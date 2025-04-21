from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import OrganizationalUnit


class Command(BaseCommand):
    help = "Set up organizational units hierarchy for the university"

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                self.stdout.write("Setting up university organizational structure...")

                # Level 0: University (top-level)
                university, created = OrganizationalUnit.objects.get_or_create(
                    name="University of Houston",
                    code="UH",
                    level=0,
                    defaults={"description": "University of Houston main campus"},
                )
                self.stdout.write(
                    f"{'Created' if created else 'Found'} top-level university unit"
                )

                # Level 1: Schools and Administrative Units
                admin_units = {
                    "GRAD": "Graduate School",
                    "UGRAD": "Undergraduate Studies",
                    "PROV": "Office of the Provost",
                    "REG": "Registrar's Office",
                }

                admin_unit_objects = {}
                for code, name in admin_units.items():
                    unit, created = OrganizationalUnit.objects.get_or_create(
                        name=name,
                        code=code,
                        parent=university,
                        level=1,
                        defaults={"description": f"{name} - Administrative Unit"},
                    )
                    admin_unit_objects[code] = unit
                    self.stdout.write(
                        f"{'Created' if created else 'Found'} admin unit: {name}"
                    )

                # Level 1: Colleges
                colleges = {
                    "NSM": "College of Natural Sciences & Mathematics",
                    "ENGR": "Cullen College of Engineering",
                    "ARTS": "Kathrine G. McGovern College of the Arts",
                    "BUS": "C.T. Bauer College of Business",
                    "EDUC": "College of Education",
                    "CLASS": "College of Liberal Arts & Social Sciences",
                    "PHARM": "College of Pharmacy",
                    "OPT": "College of Optometry",
                    "SOCW": "Graduate College of Social Work",
                    "NURS": "Gessner College of Nursing",
                    "MED": "Fertitta Family College of Medicine",
                    "HOSP": "Hilton College of Hospitality Leadership",
                    "ARCH": "Hines College of Architecture and Design",
                    "HOBBY": "Hobby School of Public Affairs",
                }

                college_units = {}
                for code, name in colleges.items():
                    college, created = OrganizationalUnit.objects.get_or_create(
                        name=name,
                        code=code,
                        parent=university,
                        level=1,
                        defaults={"description": f"{name}"},
                    )
                    college_units[code] = college
                    self.stdout.write(
                        f"{'Created' if created else 'Found'} college: {name}"
                    )

                # Level 2: Departments under colleges
                departments = [
                    # NSM
                    {
                        "name": "Biology and Biochemistry",
                        "code": "BIOL",
                        "college": "NSM",
                    },
                    {"name": "Chemistry", "code": "CHEM", "college": "NSM"},
                    {"name": "Computer Science", "code": "CS", "college": "NSM"},
                    {
                        "name": "Earth and Atmospheric Sciences",
                        "code": "EAS",
                        "college": "NSM",
                    },
                    {"name": "Mathematics", "code": "MATH", "college": "NSM"},
                    {"name": "Physics", "code": "PHYS", "college": "NSM"},
                    # Engineering
                    {
                        "name": "Biomedical Engineering",
                        "code": "BME",
                        "college": "ENGR",
                    },
                    {
                        "name": "Chemical & Biomolecular Engineering",
                        "code": "CHBE",
                        "college": "ENGR",
                    },
                    {
                        "name": "Civil & Environmental Engineering",
                        "code": "CEE",
                        "college": "ENGR",
                    },
                    {
                        "name": "Electrical & Computer Engineering",
                        "code": "ECE",
                        "college": "ENGR",
                    },
                    {"name": "Industrial Engineering", "code": "IE", "college": "ENGR"},
                    {"name": "Mechanical Engineering", "code": "ME", "college": "ENGR"},
                    {
                        "name": "Petroleum Engineering",
                        "code": "PETE",
                        "college": "ENGR",
                    },
                    {"name": "Technology Division", "code": "TECH", "college": "ENGR"},
                    # CLASS
                    {"name": "Psychology", "code": "PSY", "college": "CLASS"},
                    {"name": "Political Science", "code": "POLS", "college": "CLASS"},
                    {"name": "History", "code": "HIST", "college": "CLASS"},
                    # ARTS
                    {
                        "name": "Moores School of Music",
                        "code": "MUS",
                        "college": "ARTS",
                    },
                    {"name": "School of Art", "code": "ART", "college": "ARTS"},
                    {"name": "Theatre & Dance", "code": "DANCE", "college": "ARTS"},
                    # Business
                    {"name": "Finance", "code": "FIN", "college": "BUS"},
                    {"name": "Management", "code": "MGMT", "college": "BUS"},
                    # Education
                    {
                        "name": "Curriculum & Instruction",
                        "code": "CI",
                        "college": "EDUC",
                    },
                    {
                        "name": "Educational Leadership",
                        "code": "EDLEAD",
                        "college": "EDUC",
                    },
                    {
                        "name": "Health and Learning Sciences",
                        "code": "HLS",
                        "college": "EDUC",
                    },
                ]

                for dept in departments:
                    parent_college = college_units[dept["college"]]
                    unit, created = OrganizationalUnit.objects.get_or_create(
                        name=dept["name"],
                        code=dept["code"],
                        parent=parent_college,
                        level=2,
                        defaults={
                            "description": f"{dept['name']} in {parent_college.name}"
                        },
                    )
                    self.stdout.write(
                        f"{'Created' if created else 'Found'} {unit.name}"
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully set up organizational structure with:"
                        f"\n - 1 top-level university unit"
                        f"\n - {len(admin_units) + len(colleges)} level 1 units"
                        f"\n - {len(departments)} level 2 departments"
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error setting up organization hierarchy: {str(e)}")
            )
