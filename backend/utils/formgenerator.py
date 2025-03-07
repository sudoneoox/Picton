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

        # Create the directory if it doesn't exist
        os.makedirs(self.template_dir, exist_ok=True)

        # Path to the university logo
        self.logo_path = os.path.join(
            settings.STATIC_ROOT, "img", "university_logo.png"
        )

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
        if template_name == "withdrawal":
            return self.generate_withdrawal_form
        elif template_name == "graduate":
            pretty_print("GRADUATE TEMPLATE NOT YET IMPLEMENTED", "WARNING")
            return None
        else:
            pretty_print(f"NOT A VALID TEMPLATE_NAME: {template_name}", "ERROR")
            raise ValueError(f"Invalid Template Name: {template_name}")

    def generate_withdrawal_form(self, user, form_data):
        """
        Generate a term withdrawal form PDF for the given user and form data

        Args:
            user: The User model instance
            form_data: Dictionary containing form field values

        Returns:
            BytesIO object containing the generated PDF
        """
        # Get template content
        template_path = os.path.join(self.template_dir, "term_withdrawal.tex")
        with open(template_path, "r") as file:
            template_content = file.read()

        # NOTE: Format student name
        student_name = f"{user.last_name}, {user.first_name} {user.middle_name if hasattr(user, 'middle_name') else ''}"

        # NOTE: Format checkboxes for semester selection
        fall_selected = "\\square" if form_data.get("season") == "Fall" else "\\square"
        spring_selected = (
            "\\square" if form_data.get("season") == "Spring" else "\\square"
        )
        summer_selected = (
            "\\square" if form_data.get("season") == "Summer" else "\\square"
        )

        # NOTE: Check which one is selected and mark it with ✓
        if form_data.get("season") == "Fall":
            fall_selected = "\\checked"
        elif form_data.get("season") == "Spring":
            spring_selected = "\\checked"
        elif form_data.get("season") == "Summer":
            summer_selected = "\\checked"

        # NOTE: Current date in MM/DD/YYYY format
        current_date = datetime.now().strftime("%m/%d/%Y")

        # IMPORTANT: Replace placeholders with actual values
        replacements = {
            "$STUDENT_NAME$": student_name,
            "$STUDENT_ID$": str(form_data.get("student_id", "")) or "",
            "$PHONE_NUMBER$": str(form_data.get("phone_number", user.phone_number))
            or "",
            "$EMAIL_ADDRESS$": form_data.get("email", user.email),
            "$PROGRAM_PLAN$": form_data.get("program_plan", ""),
            "$ACADEMIC_CAREER$": form_data.get("academic_career", ""),
            "$WITHDRAWAL_YEAR$": str(form_data.get("year", datetime.now().year)),
            "$FALL_SELECTED$": fall_selected,
            "$SPRING_SELECTED$": spring_selected,
            "$SUMMER_SELECTED$": summer_selected,
            "$CURRENT_DATE$": current_date,
            "$UNIVERSITY_LOGO$": self.logo_path,
        }

        # TODO: make signatures a required field before users are able to access form requests
        # IMPORTANT: Handle signature - if user has a signature in their profile, use it
        # Otherwise leave it blank
        if user.signature:
            # Create a temporary signature file from the signature in the user model
            signature_content = self._process_signature(user)
            replacements["$STUDENT_SIGNATURE$"] = signature_content
        else:
            replacements["$STUDENT_SIGNATURE$"] = ""

        # Replace all placeholders
        for placeholder, value in replacements.items():
            template_content = template_content.replace(placeholder, str(value))

        # Create PDF using pdflatex in a temporary directory
        return self._compile_latex(template_content)

    def _process_signature(self, user):
        """Process user signature for inclusion in the PDF"""
        # This assumes the signature is stored as an ImageField in the User model
        if not user.signature:
            pretty_print(f"User {user} does not have a signature on file", "WARNING")
            return ""

        # Return the path to the signature file
        # WARNING:
        # TODO: store user signatures as img byte code
        try:
            sig_path = user.signature.path  # For local file storage
            return sig_path
        except ValueError:
            content = user.signature.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                tmp.write(content)
                return tmp.name

    # TODO: only handles withdrawal form for right now make it so that it switches file path name with form type
    def _compile_latex(self, latex_content):
        """
        Compile LaTeX content to PDF

        Args:
            latex_content: String containing the LaTeX document

        Returns:
            Path to the generated PDF file
        """
        # Create a temporary directory for compilation
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create temporary LaTeX file
            tex_file = os.path.join(temp_dir, "document.tex")
            with open(tex_file, "w") as file:
                file.write(latex_content)

            # Compile LaTeX to PDF
            subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", tex_file],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            # Check if PDF was created
            pdf_file = os.path.join(temp_dir, "document.pdf")
            if not os.path.exists(pdf_file):
                raise Exception("Failed to generate PDF")

            # Read the PDF file
            with open(pdf_file, "rb") as file:
                pdf_content = file.read()

            # Return the PDF content as a ContentFile
            return ContentFile(pdf_content, name="term_withdrawal.pdf")
