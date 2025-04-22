import os
import subprocess
import tempfile
from datetime import datetime

from django.conf import settings
from django.core.files.base import ContentFile

from utils import pretty_print


class FormPDFGenerator:
    """
    Utility class to generate PDFs from LaTeX templates
    for the form approval system
    """

    def __init__(self):
        # Base directory for templates
        self.template_dir = os.path.join(settings.BASE_DIR, "templates", "forms")

        # generates .tex format and saves it as well for debugging
        # rather than just generating and saving the pdf
        # set this to True in your env file in order to test
        self.DEBUG_PDF = os.getenv("DEBUG_PDF")

        # Create the directory if it doesn't exist
        os.makedirs(self.template_dir, exist_ok=True)

        # Path to the university logo
        self.logo_path = os.path.join(settings.BASE_DIR, "static", "img", "uh.png")

        # Ensure the logo exists
        if not os.path.exists(self.logo_path):
            pretty_print("Warning: University logo not found", "WARNING")
            # Try alternative path
            self.logo_path = os.path.join(settings.STATIC_ROOT, "img", "uh.png")
            if not os.path.exists(self.logo_path):
                pretty_print(
                    "Error: University logo not found in any location", "ERROR"
                )
                self.logo_path = ""  # Set to empty string if logo is not found

    def generate_template_form(self, template_name, user, form_data):
        """
        Generate a form PDF based on template name and form data

        Args:
            template_name: String identifier for the form template
            user: The User model instance
            form_data: Dictionary containing form field values

        Returns:
            The generated PDF from the appropriate template
        """
        pretty_print(
            f"received params in generate_template_form {template_name}, {user}, {list(form_data)}",
            "DEBUG",
        )

        return self._generate_form_dynamically(template_name, user, form_data)

    def generate_signed_form(
        self, form_submission, approver, decision, comments, signature_position=None
    ):
        """
        Generate a signed version of the form with approver's signature

        Args:
            form_submission: The FormSubmission object
            approver: The User (staff) who is approving/rejecting
            decision: "approved" or "rejected"
            comments: Comments from the approver
            signature_position: Position key for signature placement (PROGRAM_DIRECTOR, DEPARTMENT_CHAIR...)

        Returns:
            ContentFile with the signed PDF
        """
        try:
            # Get template content based on form_submission template
            template_name = form_submission.form_template

            # Get all existing approvals for this form
            from api.models import FormApproval

            existing_approvals = FormApproval.objects.filter(
                form_submission=form_submission, decision__in=["approved", "rejected"]
            ).select_related("approver", "workflow")

            form_data = form_submission.form_data.copy()

            # Start with a base PDF generation
            pdf_content = self._generate_form_dynamically(
                template_name,
                form_submission.submitter,
                form_data,
                approver=approver,
                decision=decision,
                comments=comments,
                signature_position=signature_position,
                existing_approvals=existing_approvals,
                submission=form_submission,
            )

            return pdf_content
        except Exception as e:
            pretty_print(f"Error generating signed form: {str(e)}", "ERROR")
            import traceback

            pretty_print(traceback.format_exc(), "ERROR")
            return None

    def _generate_form_dynamically(
        self,
        template_name,
        user,
        form_data,
        approver=None,
        decision=None,
        comments=None,
        signature_position=None,
        existing_approvals=None,
        submission=None,
    ):
        """
        Generate a form dynamically based on the form template schema

        Args:
            template_name: The name or object of the form template
            user: The user submitting the form
            form_data: The form data dictionary
            approver: Optional approver for signed forms
            decision: Optional decision for signed forms (approved/rejected)
            comments: Optional comments from approver
            signature_position: Position key for signature placement
            existing_approvals: List of existing approvals to include in the document

        Returns:
            A ContentFile containing the generated PDF
        """
        from api.models import FormTemplate

        try:
            # Get the template object from the database
            if isinstance(template_name, str):
                try:
                    # First try exact match
                    form_template = FormTemplate.objects.get(name=template_name)
                except FormTemplate.DoesNotExist:
                    # Try partial match (for "graduate" -> "Graduate Petition Form")
                    form_template = FormTemplate.objects.filter(
                        name__icontains=template_name
                    ).first()
                    if not form_template:
                        pretty_print(f"Template not found: {template_name}", "ERROR")
                        raise ValueError(f"Template not found: {template_name}")
            else:
                # Template is already an object
                form_template = template_name

            # Get template path based on template name
            template_file = form_template.latex_template_path
            template_path = os.path.join(self.template_dir, template_file)

            pretty_print(f"Using template file: {template_path}", "DEBUG")

            # Ensure template file exists
            if not os.path.exists(template_path):
                pretty_print(f"Template file not found: {template_path}", "ERROR")
                raise ValueError(f"Template file not found: {template_path}")

            # Load template content
            with open(template_path, "r") as file:
                template_content = file.read()

            # Start with basic replacements
            replacements = {
                "$CURRENT_DATE$": datetime.now().strftime("%m/%d/%Y"),
                "$UNIVERSITY_LOGO$": self.logo_path,
            }

            # Add student signature
            # BUG: possible bug have to check what happens to student signature when a staff signs and returns it
            if user.signature:
                replacements["$STUDENT_SIGNATURE$"] = self._process_signature(user)
            else:
                replacements["$STUDENT_SIGNATURE$"] = ""

            # Common fields that exist in most forms
            common_fields = {
                "first_name": "$FIRST_NAME$",
                "last_name": "$LAST_NAME$",
                "middle_name": "$MIDDLE_NAME$",
                "student_id": "$STUDENT_ID$",
                "phone_number": "$PHONE_NUMBER$",
                "email": "$EMAIL_ADDRESS$",
                "email_address": "$EMAIL_ADDRESS$",
                "program_plan": "$PROGRAM_PLAN$",
                "academic_career": "$ACADEMIC_CAREER$",
                "year": "$YEAR$",  # Graduate petition or common year
                "withdrawal_year": "$WITHDRAWAL_YEAR$",  # Term withdrawal
                "season": "$SEASON$",  # Season value itself
            }

            # Process common fields
            for field_name, placeholder in common_fields.items():
                if field_name in form_data:
                    # Get value with proper handling
                    value = form_data.get(field_name, "")

                    # Format phone number if needed
                    if field_name == "phone_number" and value:
                        value = self._format_phone_number(value)

                    # Fall back to user profile if empty
                    if not value and hasattr(user, field_name):
                        value = getattr(user, field_name)
                        if field_name == "phone_number":
                            value = self._format_phone_number(value)

                    replacements[placeholder] = str(value)

            # BUG: Static for now but move this over to a lookup table
            standard_positions = [
                "PROGRAM_DIRECTOR",
                "DEPT_CHAIR",
                "ASSOC_DEAN",
                "VICE_PROVOST",
            ]

            for position in standard_positions:
                replacements[f"${position}_SIGNATURE$"] = ""
                replacements[f"${position}_NAME$"] = ""
                replacements[f"${position}_DATE$"] = ""

            if existing_approvals:
                for approval in existing_approvals:
                    if not approval.workflow or not approval.approver:
                        continue

                    position_map = {
                        "Graduate Studies/Program Director": "PROGRAM_DIRECTOR",
                        "Department Chair": "DEPT_CHAIR",
                        "Associate/Assistant Dean for Graduate Studies": "ASSOC_DEAN",
                        "Vice Provost/Dean of the Graduate School": "VICE_PROVOST",
                    }

                    position = approval.workflow.approval_position
                    key = position_map.get(position)

                    if key:
                        if approval.approver.signature:
                            replacements[f"${key}_SIGNATURE$"] = (
                                self._process_signature(approval.approver)
                            )
                        replacements[f"${key}_NAME$"] = (
                            f"{approval.approver.first_name} {approval.approver.last_name}"
                        )
                        replacements[f"${key}_DATE$"] = (
                            approval.decided_at.strftime("%m/%d/%Y")
                            if approval.decided_at
                            else ""
                        )

            # Add current approver's signature if provided
            if approver and decision and signature_position:
                # Set checkmarks for approval status based on position
                if decision == "approved":
                    replacements[f"${signature_position}_APPROVED$"] = "\\checkmark"
                    replacements[f"${signature_position}_REJECTED$"] = "\\square"
                else:
                    replacements[f"${signature_position}_APPROVED$"] = "\\square"
                    replacements[f"${signature_position}_REJECTED$"] = "\\checkmark"

                # Add signature and metadata
                if approver.signature:
                    replacements[f"${signature_position}_SIGNATURE$"] = (
                        self._process_signature(approver)
                    )
                replacements[f"${signature_position}_NAME$"] = (
                    f"{approver.first_name} {approver.last_name}"
                )
                replacements[f"${signature_position}_DATE$"] = datetime.now().strftime(
                    "%m/%d/%Y"
                )
                replacements[f"${signature_position}_COMMENTS$"] = (
                    comments if comments else ""
                )

            # Handle template-specific fields
            #
            # BUG: static remove this and shift over to a dynamic form processor
            if "Graduate Petition" in form_template.name:
                self._process_graduate_petition_fields(form_data, replacements)
            elif "Term Withdrawal" in form_template.name:
                self._process_term_withdrawal_fields(form_data, replacements)
            elif "Graduate Posthumous" in form_template.name:
                self._process_graduate_posthumous_fields(form_data, replacements)
            else:
                # Generic processing for other templates
                pretty_print(
                    f"Using generic field processing for {form_template.name}", "DEBUG"
                )
                self._process_generic_fields(
                    form_template.field_schema.get("fields", []),
                    form_data,
                    template_content,
                    replacements,
                )

            # Add approval information if this is a signed form and no specific position
            if approver and decision and not signature_position:
                # Set checkmarks for approval status
                staff_approved = "\\checkmark" if decision == "approved" else "\\square"
                staff_rejected = "\\checkmark" if decision == "rejected" else "\\square"

                # Add approval information to replacements
                replacements.update(
                    {
                        "$STAFF_APPROVED$": staff_approved,
                        "$STAFF_REJECTED$": staff_rejected,
                        "$STAFF_SIGNATURE$": self._process_signature(approver)
                        if approver.signature
                        else "",
                        "$STAFF_NAME$": f"{approver.first_name} {approver.last_name}",
                        "$APPROVAL_DATE$": datetime.now().strftime("%m/%d/%Y"),
                        "$STAFF_COMMENTS$": comments if comments else "",
                    }
                )

            # Perform all replacements
            for placeholder, value in replacements.items():
                template_content = template_content.replace(placeholder, str(value))

            # Compile the LaTeX to PDF
            pdf_file = self._compile_latex(template_content)

            # Set appropriate filename
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            user_id = getattr(user, "id", "0")

            if approver and decision:
                # For signed forms - fix the reference to form_submission
                try:
                    # submission should be passed in instead of referencing an undefined variable
                    identifier = (
                        submission.submission_identifier.identifier
                        if "submission" in locals()
                        else f"form_{timestamp}"
                    )
                except:
                    # Use a safer fallback that doesn't reference the undefined variable
                    identifier = f"form_{timestamp}"

                pdf_file.name = f"{identifier}_{decision}_{timestamp}.pdf"

            else:
                # For regular forms
                if "Graduate Petition" in form_template.name:
                    template_code = "petition"
                elif "Term Withdrawal" in form_template.name:
                    template_code = "withdrawal"
                else:
                    template_code = form_template.name.lower().replace(" ", "_")[:10]

                pdf_file.name = f"{template_code}_user{user_id}_{timestamp}.pdf"
            return pdf_file

        except Exception as e:
            pretty_print(f"Error in _generate_form_dynamically: {str(e)}", "ERROR")
            import traceback

            pretty_print(traceback.format_exc(), "ERROR")
            return None

    def _process_graduate_posthumous_fields(self, form_data, replacements):
        """Process specific fields for Graduate Posthumous Degree Petition"""
        # Year and season
        replacements["$YEAR$"] = str(form_data.get("year", datetime.now().year))
        replacements["$SEASON$"] = form_data.get("season", "")

        # Petition explanation (required for posthumous forms)
        replacements["$PETITION_EXPLANATION$"] = form_data.get(
            "petition_explanation", ""
        )

        # Handle petition purpose checkbox - for posthumous it's always the same purpose
        replacements["$PURPOSE_POSTHUMOUS_DEGREE$"] = "\\checkmark"

    def _process_graduate_petition_fields(self, form_data, replacements):
        """Process specific fields for Graduate Petition forms"""
        # Year and season
        replacements["$YEAR$"] = str(form_data.get("year", datetime.now().year))
        replacements["$SEASON$"] = form_data.get("season", "")

        # Petition explanation
        replacements["$PETITION_EXPLANATION$"] = form_data.get(
            "petition_explanation", ""
        )

        # Handle petition purpose checkboxes
        purpose_map = {
            "update_program_status": "$PURPOSE_UPDATE_PROGRAM_STATUS$",
            "admission_status_change": "$PURPOSE_ADMISSION_STATUS_CHANGE$",
            "add_concurrent_degree": "$PURPOSE_ADD_CONCURRENT$",
            "change_degree_objective": "$PURPOSE_CHANGE_DEGREE_OBJECTIVE$",
            "degree_requirements_exception": "$PURPOSE_DEGREE_REQUIREMENTS_EXCEPTION$",
            "leave_of_absence": "$PURPOSE_LEAVE_OF_ABSENCE$",
            "reinstate_discontinued": "$PURPOSE_REINSTATE_DISCONTINUED$",
            "request_to_graduate": "$PURPOSE_REQUEST_TO_GRADUATE$",
            "change_admin_term": "$PURPOSE_CHANGE_ADMIN_TERM$",
            "early_submission": "$PURPOSE_EARLY_SUBMISSION$",
            "other": "$PURPOSE_OTHER$",
        }

        selected_purpose = form_data.get("petition_purpose", "")
        for purpose, placeholder in purpose_map.items():
            replacements[placeholder] = (
                "\\checkmark" if purpose == selected_purpose else "\\square"
            )

        # Initialize standard approval signature placeholders
        replacements["$PROGRAM_DIRECTOR_SIGNATURE$"] = ""
        replacements["$DEPT_CHAIR_SIGNATURE$"] = ""
        replacements["$ASSOC_DEAN_SIGNATURE$"] = ""
        replacements["$VICE_PROVOST_SIGNATURE$"] = ""
        replacements["$PROGRAM_DIRECTOR_NAME$"] = ""
        replacements["$DEPT_CHAIR_NAME$"] = ""
        replacements["$ASSOC_DEAN_NAME$"] = ""
        replacements["$VICE_PROVOST_NAME$"] = ""
        replacements["$PROGRAM_DIRECTOR_DATE$"] = ""
        replacements["$DEPT_CHAIR_DATE$"] = ""
        replacements["$ASSOC_DEAN_DATE$"] = ""
        replacements["$VICE_PROVOST_DATE$"] = ""

    def _process_term_withdrawal_fields(self, form_data, replacements):
        """Process specific fields for Term Withdrawal forms"""
        # Year field
        year_value = form_data.get(
            "withdrawal_year", form_data.get("year", datetime.now().year)
        )
        replacements["$WITHDRAWAL_YEAR$"] = str(year_value)

        # Season checkboxes
        season = form_data.get("season", "").lower()
        replacements["$FALL_SELECTED$"] = (
            "\\checkmark" if season == "fall" else "\\square"
        )
        replacements["$SPRING_SELECTED$"] = (
            "\\checkmark" if season == "spring" else "\\square"
        )
        replacements["$SUMMER_SELECTED$"] = (
            "\\checkmark" if season == "summer" else "\\square"
        )

        # Handle initials
        initials = form_data.get("initials", {})
        initials_text = form_data.get("initialsText", {})

        for key in [
            "financial_aid",
            "international_student",
            "student_athlete",
            "veterans",
            "graduate_professional",
            "doctoral_student",
            "student_housing",
            "dining_services",
            "parking_transportation",
        ]:
            placeholder = f"$INIT_{key.upper()}$"
            if initials.get(key) and key in initials_text and initials_text[key]:
                replacements[placeholder] = initials_text[key]
            else:
                replacements[placeholder] = " "

    def _process_generic_fields(
        self, fields, form_data, template_content, replacements
    ):
        """Process fields for generic form templates by searching for placeholders in the template"""
        # Find all placeholders in the template content
        import re

        placeholder_pattern = re.compile(r"\$([A-Z_]+)\$")
        placeholders = set(placeholder_pattern.findall(template_content))

        # Process each field in the form data
        for field in fields:
            field_name = field.get("name")
            if not field_name or field_name not in form_data:
                continue

            # Try different placeholder formats
            possible_placeholders = [
                f"${field_name.upper()}$",  # FIELD_NAME
                f"${field_name.replace('_', '').upper()}$",  # FIELDNAME
                f"${field_name.title().replace('_', '')}$",  # FieldName
            ]

            field_value = form_data.get(field_name, "")

            # Check if any of our possible placeholders exists in the template
            for placeholder in possible_placeholders:
                # Extract just the name without $
                placeholder_name = placeholder[1:-1]
                if placeholder_name in placeholders:
                    # Handle special field types
                    if field.get("type") == "radio" and isinstance(field_value, str):
                        # Special handling for radio buttons, might need options from field
                        replacements[placeholder] = field_value
                    elif field.get("type") == "checkbox" and isinstance(
                        field_value, bool
                    ):
                        # For checkboxes, use LaTeX checkmark or square
                        replacements[placeholder] = (
                            "\\checkmark" if field_value else "\\square"
                        )
                    else:
                        # Default handling
                        replacements[placeholder] = str(field_value)

    def _process_signature(self, user):
        """Process user signature for inclusion in the PDF"""
        # This assumes the signature is stored as an ImageField in the User model
        if not user.signature:
            pretty_print(f"User {user} does not have a signature on file", "WARNING")
            return ""

        # Create a temporary signature file that LaTeX can use
        try:
            # For local file storage
            sig_path = user.signature.path
            # Add LaTeX command to include the image properly
            return f"\\includegraphics[width=2in]{{{sig_path}}}"
        except ValueError:
            # For remote storage
            content = user.signature.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                tmp.write(content)
                # Add LaTeX command to include the image properly
                return f"\\includegraphics[width=2in]{{{tmp.name}}}"

    def _compile_latex(self, content):
        """Compile LaTeX content to PDF"""
        # Create a temporary directory for compilation
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write the LaTeX content to a file
            tex_file = os.path.join(temp_dir, "document.tex")
            with open(tex_file, "w") as f:
                f.write(content)

            # Run pdflatex with better error handling
            try:
                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", tex_file],
                    cwd=temp_dir,
                    capture_output=True,
                    text=True,  # Get output as text for easier logging
                )

                # Check if the compilation was successful
                if result.returncode != 0:
                    # Log detailed error output to help with debugging
                    pretty_print(
                        f"LaTeX compile error. Return code: {result.returncode}",
                        "ERROR",
                    )
                    pretty_print(
                        f"LaTeX stderr: {result.stderr[:500]}", "ERROR"
                    )  # Log first 500 chars of error

                    # Save the problematic LaTeX file for debugging if DEBUG_PDF is enabled
                    if self.DEBUG_PDF:
                        debug_file = os.path.join(settings.BASE_DIR, "debug_latex.tex")
                        with open(debug_file, "w") as f:
                            f.write(content)
                        pretty_print(f"Saved problematic LaTeX to {debug_file}", "INFO")

                    # Check if PDF was still generated despite errors
                    pdf_file_path = os.path.join(temp_dir, "document.pdf")
                    if not os.path.exists(pdf_file_path):
                        pretty_print("PDF file was not generated", "ERROR")
                        return None  # Return None instead of raising an exception

                # Read the generated PDF
                pdf_file_path = os.path.join(temp_dir, "document.pdf")
                if os.path.exists(pdf_file_path):
                    with open(pdf_file_path, "rb") as f:
                        pdf_content = f.read()
                    return ContentFile(pdf_content)
                else:
                    pretty_print("PDF file was not generated", "ERROR")
                    return None

            except Exception as e:
                pretty_print(f"Exception during LaTeX compilation: {str(e)}", "ERROR")
                return None

    def _format_phone_number(self, phone_number):
        """Format phone number for display"""
        if not phone_number:
            return ""
        # Remove all non-numeric characters
        cleaned = "".join(filter(str.isdigit, str(phone_number)))
        # Format as (XXX) XXX-XXXX
        if len(cleaned) == 10:
            return f"({cleaned[:3]}) {cleaned[3:6]}-{cleaned[6:]}"
        return phone_number

    def _get_logo_path(self, is_dark_mode=False):
        """Get the appropriate logo path based on theme mode"""
        return self.logo_path
