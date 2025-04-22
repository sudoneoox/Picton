from django.db.models import OuterRef
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from utils import FormPDFGenerator, MethodNameMixin, pretty_print

from api.core import IsActiveUser
from api.models import (
    FormApproval,
    FormApprovalWorkflow,
    FormSubmission,
    FormSubmissionIdentifier,
    FormTemplate,
    OrganizationalUnit,
    UnitApprover,
)
from api.serializers import FormSubmissionSerializer


class FormSubmissionViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """ViewSet for form submissions"""

    serializer_class = FormSubmissionSerializer
    queryset = FormSubmission.objects.all()
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get_approval_path(self):
        """
        Determines the approval path based on the organizational unit hierarchy
        """
        if not self.unit:
            return []

        # Get the hierarchy from unit to root
        unit_path = self.unit.get_hierarchy_path()

        # Get all approvers for each unit in the path
        approvers = []
        for unit in unit_path:
            unit_approvers = UnitApprover.objects.filter(
                unit=unit, is_active=True
            ).select_related("user")

            # Add organization-wide approvers
            org_approvers = UnitApprover.objects.filter(
                is_organization_wide=True, is_active=True
            ).select_related("user")

            approvers.extend(list(unit_approvers))
            approvers.extend(list(org_approvers))

        return approvers

    def perform_create(self, serializer) -> None:
        """Set the submitter as the current user and assign to their unit if available"""
        # Try to determine the user's organizational unit
        user = self.request.user
        user_unit = None

        # If user has an approver role, assign to their primary unit
        if user.role in ["staff", "admin"]:
            user_approver = UnitApprover.objects.filter(
                user=user, is_active=True
            ).first()
            if user_approver:
                user_unit = user_approver.unit

        # Save with user and their unit
        serializer.save(submitter=user, unit=user_unit)

    @action(detail=False, methods=["POST"])
    def preview(self, request):
        """
        Generate a preview PDF from form data without storing it to the database
        So user can preview pdf inside their dashboard
        """
        pretty_print(f"Generating form preview from {self._get_method_name()}", "DEBUG")

        # NOTE: The Form Type (Graduate Petition | Term Withdrawal)
        # More should be added in the future
        # Graduate Petition should have Form ID 1
        # Term Withdrawal should have Form ID 2

        # BUG: The data comes weirdly this is done to depack the first level of the json request
        form_template = request.data.get("form_template")

        try:
            # NOTE: this form_data is what were going to use to generate our pdf from the template
            # we should add error handling for this in its own class
            # different forms require different optional and required fields
            form_template_id = form_template.get("form_template")
            form_data = form_template.get("form_data")

            pretty_print(
                f"form_data received in FormSubmissionViewSet.preview: {form_data}",
                "INFO",
            )

            # Validate required fields
            if not form_template_id or not form_data:
                return Response(
                    {"error": "Missing form_template or form_data in request"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Get the form template
            form_template = FormTemplate.objects.get(id=form_template_id)

            # Generate the PDF using util class without saving it to DB
            pdf_generator = FormPDFGenerator()

            # pass the template name so that we know which one to generate
            pdf_file = pdf_generator.generate_template_form(
                form_template.name, request.user, form_data
            )

            draft_submission, created = FormSubmission.objects.get_or_create(
                form_template=form_template,
                submitter=request.user,
                status="draft",
                defaults={"form_data": form_data},
            )

            if not created:
                if isinstance(form_data, dict):
                    draft_submission.form_data = form_data
                    draft_submission.save()
                else:
                    pretty_print(
                        f"form_data is not a dict before saving: {type(form_data)}",
                        "ERROR",
                    )

            # Generate identifier for the preview/draft if it doesnt have one
            # Store the identifier in the database
            identifier_obj, created = FormSubmissionIdentifier.objects.get_or_create(
                form_submission=draft_submission,
                defaults={
                    "identifier": draft_submission.generate_submission_identifier(),
                    "form_type": form_template.name,
                    "student_id": form_data.get("student_id", ""),
                },
            )
            identifier = identifier_obj.identifier

            template_code = (
                "withdrawal"
                if form_template.name == "Term Withdrawal Form"
                else "petition"
            )

            pdf_filename = f"forms/{identifier}_{template_code}.pdf"

            draft_submission.current_pdf.save(pdf_filename, pdf_file, save=False)
            draft_submission.pdf_url = pdf_filename
            draft_submission.save()

            # read pdf content and encode
            import base64

            pdf_file.seek(0)  # make sure we read from beginning
            pdf_content = pdf_file.read()
            pdf_base_64 = base64.b64encode(pdf_content).decode("utf-8")

            # Return PDF as base64 in the response
            return Response(
                {
                    "pdf_content": pdf_base_64,
                    "filename": f"{form_template.name}_preview.pdf",
                    "draft_id": draft_submission.id,
                    "identifier": identifier,
                }
            )

        except FormTemplate.DoesNotExist:
            return Response(
                {"error": "Form template not found"}, status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            pretty_print(f"Error generating preview: {str(e)}", "ERROR")
            return Response(
                {"error": f"Error generating preview: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["POST"])
    def submit(self, request, pk=None):
        """Submit a draft form for approval"""
        pretty_print(f"Request in submit form {request}", "INFO")
        try:
            form_submission = self.get_object()

            # Ensure the form is in draft status
            if form_submission.status != "draft":
                return Response(
                    {"error": "Only draft forms can be submitted for approval"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate form data against template schema before submitting
            if not self._validate_form_data(
                form_submission.form_data, form_submission.form_template
            ):
                return Response(
                    {"error": "Form data is incomplete or invalid"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create unique identifer for form submission
            identifier = form_submission.generate_submission_identifier()

            # Get the form template's approval workflow
            approval_workflows = (
                form_submission.form_template.approvals_workflows.all().order_by(
                    "order"
                )
            )

            if not approval_workflows.exists():
                # If no approval workflow, mark as approved immediately
                pretty_print(
                    "NO APPROVAL WORKFLOW FOUND MARKING AS APPROVED COULD BE A BUG, \n IN form_submissin.ViewSet.submit",
                    "WARNING",
                )
                form_submission.status = "approved"
                form_submission.save()

                # create identifer record even for auto-approved forms
                identifier_obj, created = (
                    FormSubmissionIdentifier.objects.get_or_create(
                        form_submission=form_submission,
                        defaults={
                            "identifier": form_submission.generate_submission_identifier(),
                            "form_type": form_submission.form_template.name,
                            "student_id": form_submission.form_data.get(
                                "student_id", ""
                            ),
                        },
                    )
                )

                identifier = identifier_obj.identifier

                return Response(
                    {"status": "approved", "message": "Form approved automatically"}
                )

            # Set form to pending approval and set current step to first approval step
            form_submission.status = "pending"
            form_submission.current_step = 1

            # Set required approval count based on workflow
            required_workflows = approval_workflows.filter(is_required=True)
            form_submission.required_approval_count = required_workflows.count()
            form_submission.save()

            pretty_print(
                f"Form {form_submission.id} submitted for approval, current step: {form_submission.current_step}",
                "INFO",
            )

            # Generate final PDF with official timestamp
            pdf_file = self._generate_pdf(
                form_submission.form_template.name, form_submission
            )

            # BUG: static should get template name from database
            if pdf_file:
                template_code = (
                    "withdrawal"
                    if form_submission.form_template.name == "Term Withdrawal Form"
                    else "petition"
                )
                pdf_filename = f"forms/{identifier}_{template_code}.pdf"
                form_submission.current_pdf.save(pdf_filename, pdf_file, save=True)

            # Create Identifier Record
            identifier_obj, created = FormSubmissionIdentifier.objects.get_or_create(
                form_submission=form_submission,
                defaults={
                    "identifier": identifier,
                    "form_type": form_submission.form_template.name,
                    "student_id": form_submission.form_data.get("student_id", ""),
                },
            )

            # If the unit is not assigned, try to determine it from form data
            if not form_submission.unit and form_submission.form_data.get("unit"):
                try:
                    unit_id = int(form_submission.form_data.get("unit"))
                    # Get unit from database - FIX: use the imported model, not a local import
                    unit_obj = OrganizationalUnit.objects.get(id=unit_id)
                    form_submission.unit = unit_obj
                    form_submission.save()
                except (ValueError, OrganizationalUnit.DoesNotExist):
                    pass

            # If still no unit, try submitter's unit
            if not form_submission.unit:
                # Try to assign unit based on submitter
                user = form_submission.submitter
                user_approver = UnitApprover.objects.filter(
                    user=user, is_active=True
                ).first()
                if user_approver:
                    form_submission.unit = user_approver.unit
                    form_submission.save()

            # Create first approval record for the appropriate approver
            FormApproval.create_or_reassign(
                form_submission, None, form_submission.current_step
            )

            return Response(
                {
                    "status": "pending",
                    "required_approvals": form_submission.required_approval_count,
                    "identifier": identifier,
                    "unit": form_submission.unit.id if form_submission.unit else None,
                    "unit_name": form_submission.unit.name
                    if form_submission.unit
                    else None,
                }
            )
        except Exception as e:
            pretty_print(f"Error submitting form: {str(e)}", "ERROR")
            return Response(
                {"error": f"Error submitting form: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["POST"])
    def approve(self, request, pk=None):
        """Approve a form at the current step"""
        form_submission = self.get_object()

        # Ensure the form is in pending status
        if form_submission.status != "pending":
            return Response(
                {"error": "Only pending forms can be approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the current user has the right role to approve at this step
        user_role = request.user.role
        current_workflow = form_submission.form_template.approvals_workflows.filter(
            order=form_submission.current_step
        ).first()

        if not current_workflow or current_workflow.approver_role != user_role:
            return Response(
                {
                    "error": "You don't have permission to approve this form at this step"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create approval record
        approval = FormApproval.objects.create(
            form_submission=form_submission,
            approver=request.user,
            step_number=form_submission.current_step,
            decision="approved",
            comments=request.data.get("comments", ""),
        )

        # Generate signed PDF for this approval
        signed_pdf = self._generate_signed_pdf(form_submission, approval)
        approval.signed_pdf = signed_pdf
        approval.save()

        # Check if there are more steps in the workflow
        next_workflow = (
            form_submission.form_template.approvals_workflows.filter(
                order__gt=form_submission.current_step
            )
            .order_by("order")
            .first()
        )

        if next_workflow:
            # Move to next step
            form_submission.current_step = next_workflow.order
            form_submission.save()
            return Response(
                {
                    "status": "pending",
                    "current_step": form_submission.current_step,
                    "approver_role": next_workflow.approver_role,
                }
            )
        else:
            # Final approval
            form_submission.status = "approved"
            form_submission.save()
            return Response({"status": "approved", "message": "Form fully approved"})

    def _generate_pdf(self, template_name, form_submission):
        """Generate PDF for the form submission"""
        pretty_print(
            f"RECEIVED INSIDE _generate_pdf: {template_name} {form_submission}", "DEBUG"
        )
        try:
            pdf_generator = FormPDFGenerator()
            pdf_file = pdf_generator.generate_template_form(
                template_name,
                form_submission.submitter,
                form_submission.form_data,
            )

            # Update the form submission with the generated PDF
            form_submission.current_pdf = pdf_file
            form_submission.save()

            return pdf_file
        except Exception as e:
            pretty_print(f"Error generating PDF: {str(e)}", "ERROR")
            return None

    def _generate_signed_pdf(self, form_submission, approval):
        """Generate signed PDF for the approval"""
        # TODO: need to do this complete need to make it required for user to
        # submit their signature into their account before being able to access
        # forms sidepanel
        try:
            # WARNING: for right now just send back current pdf
            return form_submission.current_pdf
        except Exception as e:
            pretty_print(f"Error generating signed PDF: {str(e)}", "ERROR")
            return None

    def get_queryset(self):
        """Filter submissions based on user role"""
        user = self.request.user
        queryset = super().get_queryset()

        # Admins see all submissions
        if user.is_superuser:
            return queryset

        # Users see submissions they created
        if self.action == "list":
            return queryset.filter(submitter=user)

        # For approvers, include submissions they need to approve
        role_submissions = FormSubmission.objects.filter(
            status="pending",
            form_template__approvals_workflows__approver_role=user.role,
            current_step=FormApprovalWorkflow.objects.filter(
                form_template=OuterRef("form_template"), approver_role=user.role
            ).values_list("order", flat=True)[:1],
        )
        return (queryset.filter(submitter=user) | role_submissions).distinct()

    @action(detail=False, methods=["GET"])
    def by_identifier(self, request):
        """Retrieve a form submission by its identifier"""
        identifier = request.query_params.get("identifier")

        if not identifier:
            return Response(
                {"error": "Identifier parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            identifier_obj = FormSubmissionIdentifier.objects.get(identifier=identifier)
            submission = identifier_obj.form_submission

            # check permissions - only allow if user is submnitter or has appropriate role
            if submission.submitter != request.user and not request.user.is_superuser:
                if request.user.role != "staff" or submission.current_step == 0:
                    return Response(
                        {"error": "You dont have permission to access this submission"}
                    )

            serializer = self.get_serializer(submission)

            # include identifier in response
            response_data = serializer.data
            response_data["identifier"] = identifier

            # include pdf as base64 if present
            if submission.current_pdf:
                import base64

                try:
                    submission.current_pdf.seek(0)
                    pdf_content = submission.current_pdf.read()
                    pdf_base_64 = base64.b64encode(pdf_content).decode("utf-8")
                    response_data["pdf_content"] = pdf_base_64
                except Exception as e:
                    pretty_print(f"Error reading PDF: {str(e)}", "ERROR")

            return Response(response_data)

        except FormSubmissionIdentifier.DoesNotExist:
            return Response(
                {"error": "Form Submission not found with this identifier"},
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as e:
            pretty_print(f"ERROR in fetching form by identifier: {str(e)}", "ERROR")
            return Response(
                {"error": f"ERROR in fetching form by identifier: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["GET"])
    def all_identifiers(self, request):
        """Retrieve all form submission identifiers for the current user"""

        try:
            # get all identifiers for forms submitted by current user
            identifiers = FormSubmissionIdentifier.objects.filter(
                form_submission__submitter=request.user
            ).select_related("form_submission")

            # prepare response data (cleanup)
            response_data = []
            for identifier in identifiers:
                response_data.append(
                    {
                        "identifier": identifier.identifier,
                        "form_type": identifier.form_type,
                        "submission_date": identifier.submission_date,
                        "status": identifier.form_submission.status,
                        "student_id": identifier.student_id,
                    }
                )
            return Response(response_data)

        except Exception as e:
            pretty_print(f"Error fetching identifiers: {str(e)}", "ERROR")
            return Response(
                {"error": f"Failed to fetch form identifiers: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _validate_form_data(self, form_data, form_template) -> bool:
        """Validate form data against template schema"""
        pretty_print(f"[VALIDATION] form_data type: {type(form_data)}", "DEBUG")

        if not isinstance(form_data, dict):
            pretty_print("[VALIDATION] form_data is not a dict", "ERROR")
            return False

        schema = form_template.field_schema

        if not schema or not isinstance(schema, dict):
            pretty_print("NO SCHEMA FOR THIS FORM", "ERROR")
            return False

        fields = schema.get("fields", [])
        if not isinstance(fields, list):
            pretty_print("Schema 'fields' key is not a list", "ERROR")
            return False

        for field in fields:
            field_name = field.get("name")
            if field.get("required", False) and field_name not in form_data:
                pretty_print(f"Missing required field: {field_name}", "ERROR")
                return False

        return True
