# Auth Related Views
from .authentication import LoginView, RegisterView, AzureAuthViewSet, LogoutView, AuthViewSet

# Admin dashboard viewsets
from .admin_dashboard import AdminDashboardViewSet

# User CRUD Operations
from .user_management import UserManagementViewSet
from .signature import CheckSignatureView, SubmitSignatureView

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
    "CheckSignatureView",
    "SubmitSignatureView",
    "LogoutView",
    "AuthViewSet",
]
