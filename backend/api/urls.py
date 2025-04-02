from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.views import exception_handler
from rest_framework.response import Response
from .views import (
    LoginView,
    RegisterView,
    AzureAuthViewSet,
    AdminDashboardViewSet,
    UserManagementViewSet,
    FormApprovalViewSet,
    FormSubmissionViewSet,
    FormTemplateViewSet,
    SubmitSignatureView,
    CheckSignatureView,
    LogoutView,
    AuthViewSet,
)


router = DefaultRouter()
router.register(r"azure", AzureAuthViewSet, basename="azure")
router.register(r"auth", AuthViewSet, basename="auth")
# makes new url admin
router.register(r"admin", AdminDashboardViewSet, basename="admin")
router.register(r"users", UserManagementViewSet, basename="users")
router.register(r"forms/templates", FormTemplateViewSet, basename="form-templates")
router.register(r"forms/submission", FormSubmissionViewSet, basename="form-submissions")
router.register(r"forms/approvals", FormApprovalViewSet, basename="form-approvals")


urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    # includes above router.register
    path("", include(router.urls)),
    path("signature/check/", CheckSignatureView.as_view(), name="check-signature"),
    path("signature/upload/", SubmitSignatureView.as_view(), name="upload-signature"),
]


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {"error": str(exc)}
    return response
