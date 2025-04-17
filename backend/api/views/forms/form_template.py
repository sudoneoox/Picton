import os

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
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

        # Process each template in the database
        for template in templates:
            template_data = self.serializer_class(template).data

            # Get the LaTeX content for this template
            try:
                template_path = os.path.join(
                    self.TEMPLATES_DIR, template.latex_template_path
                )
                if os.path.exists(template_path):
                    with open(template_path, "r") as f:
                        template_data["latex_template"] = f.read()
                else:
                    template_data["latex_template"] = ""
                    pretty_print(
                        f"Warning: LaTeX template not found: {template_path}", "WARNING"
                    )
            except Exception as e:
                template_data["latex_template"] = ""
                pretty_print(f"Error reading LaTeX template: {str(e)}", "ERROR")

            data.append(template_data)

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

    @action(detail=True, methods=["patch"])
    def toggle_status(self, request, pk=None):
        """Toggle form template active status"""
        template = self.get_object()
        pretty_print(f"Toggling Form Template Status for {template.id}", "DEBUG")

        template.is_active = not template.is_active
        template.save()
        return Response(
            {"id": template.id, "name": template.name, "is_active": template.is_active}
        )
