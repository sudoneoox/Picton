from django.core.management.base import BaseCommand
from django.db import transaction
from ...models import FormTemplate, OrganizationalUnit, UnitApprover, User
import random
import string


class Command(BaseCommand):
    help = "Set up approvers for all departments for the graduate petition workflow"

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.stdout.write("Setting up approvers for all departments...")

                # Get the graduate school and provost office
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

                # Get all departments (level 2 units)
                departments = OrganizationalUnit.objects.filter(level=2)
                if not departments.exists():
                    self.stdout.write(
                        self.style.ERROR(
                            "No departments found. Run setup_organization_hierarchy first."
                        )
                    )
                    return

                self.stdout.write(
                    f"Found {departments.count()} departments to set up approvers for"
                )

                # Get all colleges (level 1 units that have departments)
                colleges = set(departments.values_list("parent_id", flat=True))
                college_units = OrganizationalUnit.objects.filter(id__in=colleges)

                self.stdout.write(
                    f"Found {college_units.count()} colleges to set up associate deans for"
                )

                # Set up Graduate School-wide approver (Vice Provost/Dean)
                grad_dean = self._create_approver(
                    "grad_dean",
                    "Vice Provost",
                    "Dean of Graduate School",
                    graduate_school,
                    "Vice Provost/Dean of the Graduate School",
                    is_organization_wide=True,
                )

                # Set up associate deans for each college
                for college in college_units:
                    college_code = college.code.lower()
                    dean_username = f"{college_code}_dean"

                    self._create_approver(
                        dean_username,
                        f"Associate Dean {college.code}",
                        f"Associate Dean for Graduate Studies",
                        college,
                        "Associate/Assistant Dean for Graduate Studies",
                    )

                # Set up department-level approvers for each department
                positions = [
                    "Graduate Advisor/Committee Chair",
                    "Graduate Studies/Program Director",
                    "Department Chair",
                ]

                for department in departments:
                    dept_code = department.code.lower()

                    # Create the three department-level approvers
                    self._create_approver(
                        f"{dept_code}_advisor",
                        f"Advisor {department.code}",
                        "Graduate Advisor",
                        department,
                        "Graduate Advisor/Committee Chair",
                    )

                    self._create_approver(
                        f"{dept_code}_director",
                        f"Director {department.code}",
                        "Program Director",
                        department,
                        "Graduate Studies/Program Director",
                    )

                    self._create_approver(
                        f"{dept_code}_chair",
                        f"Chair {department.code}",
                        "Department Chair",
                        department,
                        "Department Chair",
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully set up approvers for all departments:"
                        f"\n - 1 Vice Provost/Dean of the Graduate School"
                        f"\n - {college_units.count()} Associate/Assistant Deans"
                        f"\n - {departments.count() * 3} department-level approvers"
                    )
                )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error setting up approvers: {str(e)}"))

    def _create_approver(
        self, username, display_name, title, unit, position, is_organization_wide=False
    ):
        """Helper to create approver users and link them to units"""
        first_name, last_name = (
            display_name.split(" ", 1) if " " in display_name else (display_name, "")
        )

        # Create or get the user
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@uh.edu",
                "first_name": first_name,
                "last_name": last_name,
                "role": "staff",
                "is_staff": True,
                # Generate a random personal_id if the field exists
                "personal_id": self._generate_personal_id()
                if hasattr(User, "personal_id")
                else None,
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
                "role": title,
                "is_organization_wide": is_organization_wide,
                "is_active": True,
            },
        )

        if not created:
            # Update existing approver
            approver.role = title
            approver.is_organization_wide = is_organization_wide
            approver.save()

        self.stdout.write(
            f"{'Created' if created else 'Updated'} approver: {username} as {position} for {unit.name}"
        )

        return approver

    def _generate_personal_id(self):
        """Generate a unique 7-digit personal ID"""
        while True:
            # Generate a random 7-digit number
            personal_id = "".join(random.choices(string.digits, k=7))
            # Check if it's unique
            if not User.objects.filter(personal_id=personal_id).exists():
                return personal_id
