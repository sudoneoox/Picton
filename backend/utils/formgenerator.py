import os
import tempfile
from datetime import datetime
from django.conf import settings
from django.core.files.base import ContentFile
import subprocess

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
        self.logo_path = os.path.join(
            settings.BASE_DIR, "static", "img", "uh.png"
        )
        
        # Ensure the logo exists
        if not os.path.exists(self.logo_path):
            pretty_print("Warning: University logo not found", "WARNING")
            # Try alternative path
            self.logo_path = os.path.join(
                settings.STATIC_ROOT, "img", "uh.png"
            )
            if not os.path.exists(self.logo_path):
                pretty_print("Error: University logo not found in any location", "ERROR")
                self.logo_path = ""  # Set to empty string if logo is not found

    def _get_logo_path(self, is_dark_mode=False):
        """Get the appropriate logo path based on theme mode"""
        return self.logo_path

    def generate_template_form(self, template_name: str, user, form_data):
        """
        Route to the appropriate template generation function based on template name

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
        if template_name in ["withdrawal", "Term Withdrawal Form"]:
            return self.generate_withdrawal_form(user, form_data)
        elif template_name in ["graduate", "Graduate Petition Form"]:
            return self.generate_graduate_petition(user, form_data)
        else:
            pretty_print(f"NOT A VALID TEMPLATE_NAME: {template_name}", "ERROR")
            raise ValueError(f"Invalid Template Name: {template_name}")

    def generate_withdrawal_form(self, user, form_data):
        """
        Generate a term withdrawal form PDF for the given user and form data
        """
        # Get template content
        template_path = os.path.join(self.template_dir, "term_withdrawal.tex")
        with open(template_path, "r") as file:
            template_content = file.read()

        # Format date as mm/dd/yyyy
        current_date = datetime.now().strftime("%m/%d/%Y")

        # Get user's name components
        first_name = form_data.get("first_name", user.first_name)
        middle_name = form_data.get("middle_name", "")
        last_name = form_data.get("last_name", user.last_name)

        # Format checkboxes for semester selection
        fall_selected = (
            "\\checkmark" if form_data.get("season") == "Fall" else "\\square"
        )
        spring_selected = (
            "\\checkmark" if form_data.get("season") == "Spring" else "\\square"
        )
        summer_selected = (
            "\\checkmark" if form_data.get("season") == "Summer" else "\\square"
        )

        # Current date in MM/DD/YYYY format
        current_date = datetime.now().strftime("%m/%d/%Y")

        # Process initials
        initials = form_data.get("initials", {})
        initials_text = form_data.get("initialsText", {})

        # dictionary placeholders for the intial all that apply section
        initials_replacements = {}
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
                initials_replacements[placeholder] = initials_text[key]
            else:
                initials_replacements[placeholder] = " "

        # Handle season selection
        season = form_data.get("season", "").lower()
        fall_selected = "\\checkmark" if season == "fall" else "\\square"
        spring_selected = "\\checkmark" if season == "spring" else "\\square"
        summer_selected = "\\checkmark" if season == "summer" else "\\square"

        # Get the logo path
        logo_path = self.logo_path

        # Build replacements for placeholders:
        replacements = {
            "$LAST_NAME$": form_data.get("last_name", user.last_name),
            "$FIRST_NAME$": form_data.get("first_name", user.first_name),
            "$MIDDLE_NAME$": form_data.get("middle_name", ""),
            "$STUDENT_ID$": str(form_data.get("student_id", "")),
            "$PHONE_NUMBER$": self._format_phone_number(
                form_data.get("phone_number", user.phone_number)
            ),
            "$EMAIL_ADDRESS$": form_data.get("email", user.email),
            "$PROGRAM_PLAN$": form_data.get("program_plan", ""),
            "$ACADEMIC_CAREER$": form_data.get("academic_career", ""),
            "$WITHDRAWAL_YEAR$": str(form_data.get("year", datetime.now().year)),
            "$FALL_SELECTED$": fall_selected,
            "$SPRING_SELECTED$": spring_selected,
            "$SUMMER_SELECTED$": summer_selected,
            "$CURRENT_DATE$": current_date,
            "$UNIVERSITY_LOGO$": logo_path,
        }

        # Handle the user's signature (if any)
        if user.signature:
            signature_content = self._process_signature(user)
            replacements["$STUDENT_SIGNATURE$"] = signature_content
        else:
            replacements["$STUDENT_SIGNATURE$"] = ""

        # Merge in checkmark replacements for the 11 petition purpose placeholders
        replacements.update(initials_replacements)

        # Perform the actual replacements in the LaTeX template
        for placeholder, value in replacements.items():
            template_content = template_content.replace(placeholder, str(value))

        # Compile to PDF
        pdf_file = self._compile_latex(template_content)

        # Optionally name the PDF
        user_id = getattr(user, "id", "0")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        pdf_file.name = f"term_withdrawal_user{user_id}_{timestamp}.pdf"

        return pdf_file

    def generate_graduate_petition(self, user, form_data):
        template_path = os.path.join(self.template_dir, "graduate_petition.tex")
        with open(template_path, "r") as file:
            template_content = file.read()

        # Determine which petition purpose was selected and set checkmark or square
        all_purposes = {
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
        checkmark_dict = {}
        for key, placeholder in all_purposes.items():
            # if user-chosen purpose matches key, place a checkmark; otherwise empty square
            checkmark_dict[placeholder] = (
                "\\checkmark" if key == selected_purpose else "\\square"
            )

        # Format date as mm/dd/yyyy
        current_date = datetime.now().strftime("%m/%d/%Y")

        # Get user's name components
        first_name = form_data.get("first_name", user.first_name)
        middle_name = form_data.get("middle_name", "")
        last_name = form_data.get("last_name", user.last_name)

        # Get the logo path
        logo_path = self.logo_path

        # Main replacements for template macros
        replacements = {
            "$LAST_NAME$": last_name,
            "$FIRST_NAME$": first_name,
            "$MIDDLE_NAME$": middle_name,
            "$STUDENT_ID$": str(form_data.get("student_id", "")),
            "$PHONE_NUMBER$": self._format_phone_number(
                form_data.get("phone_number", user.phone_number)
            ),
            "$EMAIL_ADDRESS$": form_data.get("email", user.email),
            "$PROGRAM_PLAN$": form_data.get("program_plan", ""),
            "$ACADEMIC_CAREER$": form_data.get("academic_career", ""),
            "$YEAR$": str(form_data.get("year", datetime.now().year)),
            "$SEASON$": form_data.get("season", ""),
            "$PETITION_EXPLANATION$": form_data.get("petition_explanation", ""),
            "$CURRENT_DATE$": current_date,
            "$UNIVERSITY_LOGO$": logo_path,
        }

        # Handle signature
        if user.signature:
            signature_content = self._process_signature(user)
            replacements["$STUDENT_SIGNATURE$"] = signature_content
        else:
            replacements["$STUDENT_SIGNATURE$"] = ""

        # merge in all purpose checkmarks
        replacements.update(checkmark_dict)

        # perform placeholder replacements
        for placeholder, value in replacements.items():
            template_content = template_content.replace(placeholder, str(value))

        # Create PDF using pdflatex
        pdf_file = self._compile_latex(template_content)

        # Set a custom name for the PDF
        user_id = getattr(user, "id", "0")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        pdf_file.name = f"graduate_petition_user{user_id}_{timestamp}.pdf"

        return pdf_file

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

            # Run pdflatex
            try:
                subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", tex_file],
                    cwd=temp_dir,
                    check=True,
                    capture_output=True,
                )
            except subprocess.CalledProcessError as e:
                pretty_print(f"Error compiling LaTeX: {e.stderr.decode()}", "ERROR")
                raise

            # Read the generated PDF
            pdf_file = os.path.join(temp_dir, "document.pdf")
            with open(pdf_file, "rb") as f:
                pdf_content = f.read()

            # Create a ContentFile from the PDF content
            return ContentFile(pdf_content)

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
