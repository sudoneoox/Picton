from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import (
    FormTemplate,
    FormApprovalWorkflow,
    OrganizationalUnit,
    UnitApprover,
    User,
)


class Command(BaseCommand):
    help = "Set up approvers and workflow for graduate petition forms"

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.stdout.write("Setting up graduate petition approval workflow...")

                # Get necessary organizational units
                try:
                    graduate_school = OrganizationalUnit.objects.get(code="GRAD")
                    provost_office = OrganizationalUnit.objects.get(code="PROV")
                    self.stdout.write("Found necessary administrative units")
                except OrganizationalUnit.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(
                            "Required organizational units not found. Run setup_organization_hierarchy first."
                        )
                    )
                    return

                # Set up approval workflow for Graduate Petition Form
                try:
                    petition_template = FormTemplate.objects.get(
                        name="Graduate Petition Form"
                    )
                    self.stdout.write("Found Graduate Petition Form template")

                    # Clear existing workflows
                    FormApprovalWorkflow.objects.filter(
                        form_template=petition_template
                    ).delete()
                    self.stdout.write("Cleared existing approval workflows")

                    # Create new approval workflows with positions
                    workflows = [
                        {
                            "position": "Graduate Advisor/Committee Chair",
                            "role": "staff",
                            "order": 1,
                            "required": True,
                        },
                        {
                            "position": "Graduate Studies/Program Director",
                            "role": "staff",
                            "order": 2,
                            "required": True,
                        },
                        {
                            "position": "Department Chair",
                            "role": "staff",
                            "order": 3,
                            "required": False,
                        },
                        {
                            "position": "Associate/Assistant Dean for Graduate Studies",
                            "role": "staff",
                            "order": 4,
                            "required": True,
                        },
                        {
                            "position": "Vice Provost/Dean of the Graduate School",
                            "role": "admin",
                            "order": 5,
                            "required": True,
                        },
                    ]

                    for workflow in workflows:
                        FormApprovalWorkflow.objects.create(
                            form_template=petition_template,
                            approver_role=workflow["role"],
                            approval_position=workflow["position"],
                            is_required=workflow["required"],
                            order=workflow["order"],
                        )
                        self.stdout.write(
                            f"Created approval workflow for {workflow['position']}"
                        )

                    # Set up demo approvers for CS department
                    try:
                        cs_department = OrganizationalUnit.objects.get(code="CS")
                        self.stdout.write(
                            "Setting up approvers for CS department demonstration"
                        )

                        # Create approver positions
                        self._create_approver(
                            "cs_advisor",
                            "Graduate Advisor",
                            cs_department,
                            "Graduate Advisor/Committee Chair",
                        )

                        self._create_approver(
                            "cs_director",
                            "Program Director",
                            cs_department,
                            "Graduate Studies/Program Director",
                        )

                        self._create_approver(
                            "cs_chair",
                            "Department Chair",
                            cs_department,
                            "Department Chair",
                        )

                        # Get the parent college for the associate dean position
                        nsm_college = OrganizationalUnit.objects.get(code="NSM")
                        self._create_approver(
                            "nsm_dean",
                            "Associate Dean",
                            nsm_college,
                            "Associate/Assistant Dean for Graduate Studies",
                        )

                        # Graduate school dean/vice provost
                        self._create_approver(
                            "grad_dean",
                            "Vice Provost",
                            graduate_school,
                            "Vice Provost/Dean of the Graduate School",
                            is_organization_wide=True,
                        )

                    except OrganizationalUnit.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                "CS department not found, skipping demo approvers creation"
                            )
                        )

                    self.stdout.write(
                        self.style.SUCCESS(
                            "Successfully set up graduate petition approval workflow"
                        )
                    )

                except FormTemplate.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(
                            "Graduate Petition Form template not found. Run create_form_templates command first."
                        )
                    )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error setting up workflow: {str(e)}"))

    def _create_approver(
        self, username, name, unit, position, is_organization_wide=False
    ):
        """Helper to create approver users and link them to units"""
        first_name, last_name = name.split(" ", 1) if " " in name else (name, "")

        # Create or get the user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@uh.edu",
                "first_name": first_name,
                "last_name": last_name,
                "role": "staff",
                "is_staff": True,
            },
        )

        if created:
            # Set a default password for new demo users
            user.set_password("password123")
            user.save()
            self.stdout.write(f"Created user: {username}")

        # Create or update the approver link
        approver, created = UnitApprover.objects.get_or_create(
            user=user,
            unit=unit,
            defaults={
                "role": position,
                "is_organization_wide": is_organization_wide,
                "is_active": True,
            },
        )

        if not created:
            # Update existing approver
            approver.role = position
            approver.is_organization_wide = is_organization_wide
            approver.save()

        self.stdout.write(
            f"{'Created' if created else 'Updated'} approver: {username} as {position} for {unit.name}"
        )

        return approver
