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
        if template_name in ["withdrawal", "Term Withdrawal Form"]:
            return self.generate_withdrawal_form(user, form_data)
        elif template_name in ["graduate", "Graduate Petition Form"]:
            pretty_print("GRADUATE TEMPLATE NOT YET IMPLEMENTED", "WARNING")
            pretty_print("USING WITHDRAWAL AS PLACEHOLDER", "WARNING")
            # Create a simple placeholder PDF for now
            return self.generate_graduate_petition(
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

        # build individual name pieces
        last_name = form_data.get("last_name", user.last_name)
        first_name = form_data.get("first_name", user.first_name)
        middle_name = form_data.get("middle_name", "")

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
            "$WITHDRAWAL_YEAR$": str(form_data.get("year", datetime.now().year)),
            "$FALL_SELECTED$": fall_selected,
            "$SPRING_SELECTED$": spring_selected,
            "$SUMMER_SELECTED$": summer_selected,
            "$CURRENT_DATE$": current_date,
            "$UNIVERSITY_LOGO$": self.logo_path,
        }

        # Handle signature
        if user.signature:
            signature_content = self._process_signature(user)
            replacements["$STUDENT_SIGNATURE$"] = signature_content
        else:
            replacements["$STUDENT_SIGNATURE$"] = ""

        # merge in all initial replacements
        replacements.update(initials_replacements)

        # perform placeholder replacements
        for placeholder, value in replacements.items():
            template_content = template_content.replace(placeholder, str(value))

        # Create PDF using pdflatex
        pdf_file = self._compile_latex(template_content)

        # Set a custom name for the PDF
        user_id = getattr(user, "id", "0")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        pdf_file.name = f"term_withdrawal_user{user_id}_{timestamp}.pdf"

        return pdf_file

    def _format_purpose_items(self, form_data):
        purposes = []
        for i in range(1, 13):
            key = f"purpose_{i}"
            if form_data.get(key, False):
                purposes.append(f"\\item {self._purpose_descriptions[i]}")
        return "\n".join(purposes)

    _purpose_descriptions = {
        1: "Update program status/action (term activate, discontinue, etc)",
        2: "Admissions status change (conditional to unconditional)",
        3: "Add new concurrent degree or certificate objective",
        4: "Change current degree objective (program/plan)",
        5: "Degree requirement exception or approved course substitution",
        6: "Leave of Absence (include specific term)",
        7: "Reinstatement to discontinued career",
        8: "Request to apply to graduate after late filing deadline",
        9: "Transfer Credit",
        10: "Change Admit Term",
        11: "Early Submission of Thesis/Dissertation",
        12: "Other (explained in request)",
    }

    def generate_graduate_petition(self, user, form_data):
        template_path = os.path.join(self.template_dir, "graduate_petition.tex")
        with open(template_path, "r") as file:
            template = file.read()

        replacements = {
            "$LAST_NAME$": form_data.get("last_name", user.last_name),
            "$FIRST_NAME$": form_data.get("first_name", user.first_name),
            "$MIDDLE_NAME$": form_data.get("middle_name", ""),
            "$STUDENT_ID$": str(form_data.get("student_id", "")),
            "$PHONE_NUMBER$": str(form_data.get("phone_number", user.phone_number)),
            "$PROGRAM_PLAN$": form_data.get("program_plan", ""),
            "$PLAN_CODE$": form_data.get("plan_code", ""),
            "$SEASON$": form_data.get("season", ""),
            "$YEAR$": str(form_data.get("year", datetime.now().year)),
            "$EMAIL$": form_data.get("email", user.email),
            "$PURPOSE_ITEMS$": self._format_purpose_items(form_data),
            "$PETITION_EXPLANATION$": form_data.get("explanation", ""),
            "$SUBMIT_DATE$": datetime.now().strftime("%m/%d/%Y"),
            "$STUDENT_SIGNATURE$": self._process_signature(user),
            "$UNIVERSITY_LOGO$": self.logo_path,
        }

        # Add approval signatures (to be implemented later)
        for role in ["advisor", "director", "chair", "dean"]:
            replacements[f"${role.upper()}_SIGNATURE$"] = ""
            replacements[f"${role.upper()}_DATE$"] = ""

        for placeholder, value in replacements.items():
            template = template.replace(placeholder, str(value))

        return self._compile_latex(template)

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

            # Save the LaTeX file if DEBUG_PDF Is enabled
            if self.DEBUG_PDF:
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                debug_dir = os.path.join(settings.BASE_DIR, "debug_latex")
                os.makedirs(debug_dir, exist_ok=True)
                debug_file = os.path.join(debug_dir, f"document_{timestamp}.tex")
                with open(debug_file, "w") as f:
                    f.write(latex_content)
                pretty_print(f"Saved LaTeX Source to {debug_file}", "DEBUG")

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

    def _format_phone_number(self, phone):
        """Format phone number consistently in PDF"""
        # remove non numeric characters
        if not phone:
            return ""
        phone_digits = "".join(filter(str.isdigit, str(phone)))

        # Format as (XXX)-XXX-XXXX if we have 10 digits
        if len(phone_digits) == 10:
            return f"({phone_digits[0:3]})-{phone_digits[3:6]}-{phone_digits[6:10]}"

        return str(phone)
