from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from ...models import FormTemplate
from ...serializers import FormTemplateSerializer

from utils import MethodNameMixin
from django.conf import settings

DEBUG = settings.DEBUG


class FormTemplateViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """ViewSet for form templates"""

    serializer_class = FormTemplateSerializer
    queryset = FormTemplate.objects.all()
    permission_classes = [IsAuthenticated]

    # Admin-only access for create/update/delete operations
    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [IsAdminUser]
        return super().get_permissions()
