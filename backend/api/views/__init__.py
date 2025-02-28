# Auth Related Views
from .authentication import (
    LoginView,
    RegisterView,
    AzureAuthViewSet,
)

# Admin dashboard viewsets
from .admin_dashboard import AdminDashboardViewSet

# User CRUD Operations
from .user_management import UserManagementViewSet

# Forms
from .forms import FormApprovalViewSet, FormTemplateViewSet, FormSubmissionViewSet

__all__ = [
    "LoginView",
    "RegisterView",
    "AzureAuthViewSet",
    "AdminDashboardViewSet",
    "UserManagementViewSet",
    "FormTemplateViewSet",
    "FormSubmissionViewSet",
    "FormApprovalViewSet",
]
