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
        if template_name == "withdrawal" or template_name == "Term Withdrawal Form":
            return self.generate_withdrawal_form(user, form_data)
        elif template_name == "graduate" or template_name == "Graduate Petition Form":
            pretty_print("GRADUATE TEMPLATE NOT YET IMPLEMENTED", "WARNING")
            pretty_print("USING WITHDRAWAL AS PLACEHOLDER", "WARNING")
            # Create a simple placeholder PDF for now
            return self.generate_withdrawal_form(
                user, form_data
            )  # Using withdrawal as placeholder
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

        # Format student name
        student_name = f"{form_data.get('last_name', user.last_name)}, {form_data.get('first_name', user.first_name)} {form_data.get('middle_name', '')}"

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

        # Create initials replacements
        initials_replacements = {}
        for key, checked in initials.items():
            if checked and key in initials_text and initials_text[key]:
                initials_replacements[f"$INITIAL_{key.upper()}$"] = initials_text[key]
            else:
                initials_replacements[f"$INITIAL_{key.upper()}$"] = ""

        # Main replacements
        replacements = {
            "$STUDENT_NAME$": student_name,
            "$STUDENT_ID$": str(form_data.get("student_id", "")),
            "$PHONE_NUMBER$": str(form_data.get("phone_number", user.phone_number)),
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

        # Add initials replacements
        replacements.update(initials_replacements)

        # Handle signature
        if user.signature:
            signature_content = self._process_signature(user)
            replacements["$STUDENT_SIGNATURE$"] = signature_content
        else:
            replacements["$STUDENT_SIGNATURE$"] = ""

        # Replace all placeholders
        for placeholder, value in replacements.items():
            template_content = template_content.replace(placeholder, str(value))

        # Create PDF using pdflatex
        pdf_file = self._compile_latex(template_content)

        # Set a custom name for the PDF
        user_id = getattr(user, "id", "0")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        pdf_file.name = f"term_withdrawal_user{user_id}_{timestamp}.pdf"

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

    # TODO: only handles withdrawal form for right now make it so that it switches file path name with form type
    def _compile_latex(self, latex_content):
        """
        Compile LaTeX content to PDF
        """
        # Create a temporary directory for compilation
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create temporary LaTeX file
            tex_file = os.path.join(temp_dir, "document.tex")
            with open(tex_file, "w") as file:
                file.write(latex_content)

            # Compile LaTeX to PDF (run twice for better formatting)
            success = True
            for i in range(2):
                try:
                    process = subprocess.run(
                        ["pdflatex", "-interaction=nonstopmode", tex_file],
                        cwd=temp_dir,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=30,  # Add timeout to prevent hanging
                    )

                    # Check for errors but don't fail completely
                    if process.returncode != 0:
                        error_output = process.stderr.decode("utf-8", errors="replace")
                        if not error_output:
                            error_output = process.stdout.decode(
                                "utf-8", errors="replace"
                            )
                        pretty_print(
                            f"LaTeX compilation warning (run {i + 1}): {error_output}",
                            "WARNING",
                        )
                        # Don't stop if this is just a warning
                        success = process.returncode == 0
                except subprocess.TimeoutExpired:
                    pretty_print(f"LaTeX compilation timeout (run {i + 1})", "ERROR")
                    success = False
                    break
                except Exception as e:
                    pretty_print(
                        f"LaTeX compilation error (run {i + 1}): {str(e)}", "ERROR"
                    )
                    success = False
                    break

            # Check if PDF was created
            pdf_file = os.path.join(temp_dir, "document.pdf")
            if not os.path.exists(pdf_file):
                pretty_print("PDF file not generated, checking for log file", "ERROR")
                # Try to get more diagnostic information
                log_file = os.path.join(temp_dir, "document.log")
                if os.path.exists(log_file):
                    with open(log_file, "r", errors="replace") as f:
                        log_content = f.read()
                        pretty_print(
                            f"LaTeX log: {log_content[-2000:]}", "ERROR"
                        )  # Last 2000 chars

                # Create a simple error PDF instead of failing completely
                return self._create_error_pdf(
                    "PDF generation failed - please try again"
                )

            # Read the PDF file
            with open(pdf_file, "rb") as file:
                pdf_content = file.read()

            # Return the PDF content as a ContentFile
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            return ContentFile(pdf_content, name=f"form_{timestamp}.pdf")

    def _create_error_pdf(self, error_message):
        """Create a simple error PDF using an alternative method when LaTeX fails"""
        # Use a simpler approach that's guaranteed to work
        from reportlab.pdfgen import canvas
        from io import BytesIO

        buffer = BytesIO()
        c = canvas.Canvas(buffer)
        c.setFont("Helvetica", 14)
        c.drawString(100, 700, "Error Generating Form")
        c.setFont("Helvetica", 10)
        c.drawString(100, 650, error_message)
        c.drawString(100, 630, "Please try again or contact support.")
        c.save()

        pdf_content = buffer.getvalue()
        buffer.close()

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return ContentFile(pdf_content, name=f"error_{timestamp}.pdf")
