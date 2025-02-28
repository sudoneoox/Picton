from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    RegisterView,
    AzureAuthViewSet,
    AdminDashboardViewSet,
    UserManagementViewSet,
    FormApprovalViewSet,
    FormSubmissionViewSet,
    FormTemplateViewSet,
)


router = DefaultRouter()
router.register(r"azure", AzureAuthViewSet, basename="azure")
# makes new url admin
router.register(r"admin", AdminDashboardViewSet, basename="admin")
router.register(r"users", UserManagementViewSet, basename="users")
router.register(r"forms/templates", FormTemplateViewSet, basename="form-templates")
router.register(r"forms/submission", FormSubmissionViewSet, basename="form-submissions")
router.register(r"forms/approvals", FormApprovalViewSet, basename="form-approvals")


urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterView.as_view(), name="register"),
    # includes above router.register
    path("", include(router.urls)),
]
