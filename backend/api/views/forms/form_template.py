import os

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from utils import MethodNameMixin
from utils.prettyPrint import pretty_print

from ...models import FormTemplate
from ...serializers import FormTemplateSerializer


class FormTemplateViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """ViewSet for form templates"""

    serializer_class = FormTemplateSerializer
    queryset = FormTemplate.objects.all()
    permission_classes = [IsAuthenticated]
    TEMPLATES_DIR = os.path.join(settings.BASE_DIR, "templates", "forms")

    def get_latex_template_content(self, template_name):
        """Read LaTeX template content from file"""
        try:
            template_path = os.path.join(self.TEMPLATES_DIR, f"{template_name}.tex")
            if os.path.exists(template_path):
                with open(template_path, "r") as f:
                    return f.read()
            return None
        except Exception as e:
            pretty_print(f"Error reading template {template_name}: {str(e)}", "ERROR")
            return None

    def list(self, request, *args, **kwargs):
        """List all form templates including their LaTeX content"""
        templates = self.get_queryset()

        data = []

        # Add existing database templates
        for template in templates:
            template_data = self.serializer_class(template).data
            latex_content = self.get_latex_template_content(
                template.name.lower().replace(" ", "_")
            )
            if latex_content:
                template_data["latex_template"] = latex_content
            data.append(template_data)

        # Add templates from filesystem that aren't in database
        tex_files = [f for f in os.listdir(self.TEMPLATES_DIR) if f.endswith(".tex")]
        for tex_file in tex_files:
            template_name = tex_file[:-4]  # Remove .tex extension
            if not templates.filter(
                name__iexact=template_name.replace("_", " ")
            ).exists():
                latex_content = self.get_latex_template_content(template_name)
                if latex_content:
                    data.append(
                        {
                            "id": None,
                            "name": template_name.replace("_", " ").title(),
                            "description": f"LaTeX template for {template_name.replace('_', ' ').title()}",
                            "field_schema": {},
                            "required_approvals": 1,
                            "latex_template": latex_content,
                        }
                    )

        return Response(data)

    def create(self, request, *args, **kwargs):
        """Create a new form template and save its LaTeX content"""
        latex_template = request.data.pop("latex_template", None)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        template = serializer.save()

        if latex_template:
            template_name = template.name.lower().replace(" ", "_")
            template_path = os.path.join(self.TEMPLATES_DIR, f"{template_name}.tex")
            with open(template_path, "w") as f:
                f.write(latex_template)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a form template and its LaTeX content"""
        latex_template = request.data.pop("latex_template", None)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=kwargs.get("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        template = serializer.save()

        if latex_template:
            template_name = template.name.lower().replace(" ", "_")
            template_path = os.path.join(self.TEMPLATES_DIR, f"{template_name}.tex")
            with open(template_path, "w") as f:
                f.write(latex_template)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a form template and its LaTeX file"""
        instance = self.get_object()
        template_name = instance.name.lower().replace(" ", "_")
        template_path = os.path.join(self.TEMPLATES_DIR, f"{template_name}.tex")

        # Delete the LaTeX file if it exists
        if os.path.exists(template_path):
            os.remove(template_path)

        return super().destroy(request, *args, **kwargs)

    # Admin-only access for create/update/delete operations
    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()
