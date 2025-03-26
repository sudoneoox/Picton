# Auth Related Views
from .authentication import (
    LoginView,
    RegisterView,
    AzureAuthViewSet,
)

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
from .signature import CheckSignatureView, SubmitSignatureView

# Forms
from .forms import FormApprovalViewSet, FormTemplateViewSet, FormSubmissionViewSet

# Custom student views
from .views import dashboard_view, login_view, register_view  # Use these for login and register

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
    "dashboard_view",
    "login_view",
    "register_view",

]
