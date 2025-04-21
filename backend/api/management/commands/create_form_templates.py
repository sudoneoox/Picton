from django.core.management.base import BaseCommand
from api.models import FormApprovalWorkflow, FormTemplate


class Command(BaseCommand):
    help = "Creates default form templates"

    def handle(self, *args, **options):
        # IMPORTANT: Graduate Petition schema
        graduate_petition_schema = {
            "fields": [
                {
                    "name": "first_name",
                    "type": "text",
                    "required": True,
                    "label": "First Name",
                },
                {
                    "name": "middle_name",
                    "type": "text",
                    "required": False,
                    "label": "Middle Name",
                },
                {
                    "name": "last_name",
                    "type": "text",
                    "required": True,
                    "label": "Last Name",
                },
                {
                    "name": "student_id",
                    "type": "text",
                    "required": True,
                    "label": "MyUH ID",
                },
                {
                    "name": "phone_number",
                    "type": "text",
                    "required": True,
                    "label": "Phone Number",
                },
                {
                    "name": "email_address",
                    "type": "email",
                    "required": True,
                    "label": "School Email",
                },
                {
                    "name": "program_plan",
                    "type": "text",
                    "required": True,
                    "label": "Program Plan",
                },
                {
                    "name": "academic_career",
                    "type": "radio",
                    "required": True,
                    "label": "Academic Career",
                    "options": ["undergraduate", "graduate", "law"],
                },
                {"name": "year", "type": "text", "required": True, "label": "Year"},
                {
                    "name": "season",
                    "type": "radio",
                    "required": True,
                    "label": "Term",
                    "options": ["Fall", "Spring", "Summer"],
                },
                {
                    "name": "petition_purpose",
                    "type": "radio",
                    "required": True,
                    "label": "Purpose of Petition",
                    "options": [
                        "update_program_status",
                        "admission_status_change",
                        "add_concurrent_degree",
                        "change_degree_objective",
                        "degree_requirements_exception",
                        "leave_of_absence",
                        "reinstate_discontinued",
                        "request_to_graduate",
                        "change_admin_term",
                        "early_submission",
                        "other",
                    ],
                },
                {
                    "name": "petition_explanation",
                    "type": "textarea",
                    "required": False,
                    "label": "Explanation of Request",
                },
                {
                    "name": "supporting_document",
                    "type": "file",
                    "required": False,
                    "label": "Supporting Documents",
                },
            ]
        }

        # IMPORTANT: Term Withdrawal schema
        term_withdrawal_schema = {
            "fields": [
                {
                    "name": "first_name",
                    "type": "text",
                    "required": True,
                    "label": "First Name",
                },
                {
                    "name": "middle_name",
                    "type": "text",
                    "required": False,
                    "label": "Middle Name",
                },
                {
                    "name": "last_name",
                    "type": "text",
                    "required": True,
                    "label": "Last Name",
                },
                {
                    "name": "student_id",
                    "type": "text",
                    "required": True,
                    "label": "MyUH ID",
                },
                {
                    "name": "phone_number",
                    "type": "text",
                    "required": True,
                    "label": "Phone Number",
                },
                {
                    "name": "email_address",
                    "type": "email",
                    "required": True,
                    "label": "School Email",
                },
                {
                    "name": "program_plan",
                    "type": "text",
                    "required": True,
                    "label": "Program Plan",
                },
                {
                    "name": "academic_career",
                    "type": "radio",
                    "required": True,
                    "label": "Academic Career",
                    "options": ["undergraduate", "graduate"],
                },
                {
                    "name": "withdrawal_year",
                    "type": "text",
                    "required": True,
                    "label": "Withdrawal Year",
                },
                {
                    "name": "season",
                    "type": "radio",
                    "required": True,
                    "label": "Withdrawal Term",
                    "options": ["Fall", "Spring", "Summer"],
                },
                {
                    "name": "initials",
                    "type": "checkboxGroup",
                    "required": False,
                    "label": "Initial all that apply",
                    "subfields": [
                        {
                            "name": "financial_aid",
                            "label": "Students Receiving Financial Aid",
                        },
                        {
                            "name": "international_student",
                            "label": "International Students",
                        },
                        {"name": "student_athlete", "label": "Student Athletes"},
                        {"name": "veterans", "label": "Veterans"},
                        {
                            "name": "graduate_professional",
                            "label": "Graduate/Professional Students",
                        },
                        {"name": "doctoral_student", "label": "Doctoral Students"},
                        {"name": "student_housing", "label": "Student Housing"},
                        {"name": "dining_services", "label": "Dining Services"},
                        {
                            "name": "parking_transportation",
                            "label": "Parking and Transportation",
                        },
                    ],
                },
                {"name": "initialsText", "type": "hidden", "required": False},
            ]
        }

        # IMPORTANT: Graduate Posthumous Degree Petition schema
        graduate_posthumous_schema = {
            "fields": [
                {
                    "name": "first_name",
                    "type": "text",
                    "required": True,
                    "label": "First Name",
                },
                {
                    "name": "middle_name",
                    "type": "text",
                    "required": False,
                    "label": "Middle Name",
                },
                {
                    "name": "last_name",
                    "type": "text",
                    "required": True,
                    "label": "Last Name",
                },
                {
                    "name": "student_id",
                    "type": "text",
                    "required": True,
                    "label": "MyUH ID",
                },
                {
                    "name": "phone_number",
                    "type": "text",
                    "required": True,
                    "label": "Phone Number",
                },
                {
                    "name": "email_address",
                    "type": "email",
                    "required": True,
                    "label": "School Email",
                },
                {
                    "name": "program_plan",
                    "type": "text",
                    "required": True,
                    "label": "Program Plan",
                },
                {
                    "name": "academic_career",
                    "type": "radio",
                    "required": True,
                    "label": "Academic Career",
                    "options": ["graduate"],
                },
                {
                    "name": "year",
                    "type": "text",
                    "required": True,
                    "label": "Year",
                },
                {
                    "name": "season",
                    "type": "radio",
                    "required": True,
                    "label": "Term",
                    "options": ["Fall", "Spring", "Summer"],
                },
                {
                    "name": "petition_purpose",
                    "type": "radio",
                    "required": True,
                    "label": "Purpose of Petition",
                    "options": ["posthumous_degree"],
                },
                {
                    "name": "petition_explanation",
                    "type": "textarea",
                    "required": True,
                    "label": "Explanation of Request",
                },
                {
                    "name": "supporting_document",
                    "type": "file",
                    "required": False,
                    "label": "Supporting Documents (e.g., death certificate)",
                },
            ]
        }

        # Create templates if they don't exist
        graduate_petition, _ = FormTemplate.objects.update_or_create(
            name="Graduate Petition Form",
            defaults={
                "description": "For graduate students requesting exceptions to university policies",
                "field_schema": graduate_petition_schema,
                "required_approvals": 1,
                "latex_template_path": "graduate_petition.tex",
            },
        )

        term_withdrawal, _ = FormTemplate.objects.update_or_create(
            name="Term Withdrawal Form",
            defaults={
                "description": "For students withdrawing from all courses in the current term",
                "field_schema": term_withdrawal_schema,
                "required_approvals": 1,
                "latex_template_path": "term_withdrawal.tex",
            },
        )

        graduate_posthumous, _ = FormTemplate.objects.update_or_create(
            name="Graduate Posthumous Degree Petition",
            defaults={
                "description": "For submitting a petition to award a posthumous degree to a graduate student",
                "field_schema": graduate_posthumous_schema,
                "required_approvals": 1,
                "latex_template_path": "graduate_posthumous.tex",
            },
        )

        FormApprovalWorkflow.objects.update_or_create(
            form_template=graduate_petition,
            order=1,
            defaults={"approver_role": "staff"},
        )

        FormApprovalWorkflow.objects.update_or_create(
            form_template=term_withdrawal, order=1, defaults={"approver_role": "staff"}
        )

        FormApprovalWorkflow.objects.update_or_create(
            form_template=graduate_posthumous,
            order=1,
            defaults={"approver_role": "staff"},
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Form templates and approver workflows created successfully"
            )
        )
