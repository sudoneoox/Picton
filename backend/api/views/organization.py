from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from utils import MethodNameMixin, pretty_print

from ..models import OrganizationalUnit, UnitApprover, ApprovalDelegation, User
from ..serializers import (
    OrganizationalUnitSerializer,
    UnitApproverSerializer,
    ApprovalDelegationSerializer,
)


class OrganizationalUnitViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """
    ViewSet for managing organizational units
    """

    serializer_class = OrganizationalUnitSerializer
    queryset = OrganizationalUnit.objects.all()

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [IsAdminUser]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    @action(detail=True, methods=["GET"])
    def sub_units(self, request, pk=None):
        """Get all sub-units of this unit"""
        unit = self.get_object()
        sub_units = OrganizationalUnit.objects.filter(parent=unit)
        serializer = self.get_serializer(sub_units, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["GET"])
    def approvers(self, request, pk=None):
        """Get all approvers for this unit"""
        unit = self.get_object()
        approvers = UnitApprover.objects.filter(unit=unit, is_active=True)
        serializer = UnitApproverSerializer(approvers, many=True)
        return Response(serializer.data)


class UnitApproverViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """
    ViewSet for managing unit approvers
    """

    serializer_class = UnitApproverSerializer
    queryset = UnitApprover.objects.all()
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Filter approvers based on user role"""
        user = self.request.user
        queryset = super().get_queryset()

        # Admins see all approvers
        if user.is_superuser:
            return queryset

        # Staff can only see approvers in their units
        if user.role == "staff":
            return queryset.filter(
                unit__in=user.unit_approver_roles.values_list("unit", flat=True)
            )

        # Students only see their own approvers if any
        return queryset.filter(user=user)

    @action(detail=False, methods=["GET"])
    def my_units(self, request):
        """Get all units where the current user is an approver"""
        units = OrganizationalUnit.objects.filter(
            approvers__user=request.user, approvers__is_active=True
        ).distinct()
        serializer = OrganizationalUnitSerializer(units, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["GET"])
    def role(self, request):
        """Get the current user's approver role for a specific unit"""
        unit_id = request.query_params.get("unit")
        if not unit_id:
            return Response(
                {"error": "Unit ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            unit_approver = UnitApprover.objects.get(
                user=request.user, unit_id=unit_id, is_active=True
            )
            return Response(
                {
                    "role": unit_approver.role,
                    "unit_name": unit_approver.unit.name,
                    "is_organization_wide": unit_approver.is_organization_wide,
                }
            )
        except UnitApprover.DoesNotExist:
            return Response(
                {"error": "No approver role found for this unit"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ApprovalDelegationViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """
    ViewSet for managing approval delegations
    """

    serializer_class = ApprovalDelegationSerializer
    queryset = ApprovalDelegation.objects.all()

    @action(detail=True, methods=["POST"])
    def cancel(self, request, pk=None):
        """Cancel a delegation"""
        try:
            delegation = self.get_object()

            # Only allow canceling by the delegator or an admin
            if delegation.delegator != request.user and not request.user.is_superuser:
                return Response(
                    {"error": "You can only cancel your own delegations"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Set delegation as inactive
            delegation.is_active = False
            delegation.save()

            return Response(
                {"message": "Delegation cancelled successfully", "id": delegation.id}
            )
        except Exception as e:
            pretty_print(f"Error cancelling delegation: {str(e)}", "ERROR")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get_permissions(self):
        # Creating delegations requires being an approver
        if self.action == "create":
            self.permission_classes = [IsAuthenticated]
        # Only admins can list all delegations
        elif self.action == "list" and not self.request.query_params.get("mine"):
            self.permission_classes = [IsAdminUser]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        """Create a new delegation"""
        # Ensure the user is an approver for the specified unit
        unit_id = request.data.get("unit")
        delegate_id = request.data.get("delegate")

        # Log the incoming request data
        pretty_print(f"Delegation creation request data: {request.data}", "DEBUG")

        if not unit_id:
            return Response(
                {"error": "Unit is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not delegate_id:
            return Response(
                {"error": "Delegate is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user is an approver for this unit
        is_approver = UnitApprover.objects.filter(
            user=request.user, unit_id=unit_id, is_active=True
        ).exists()

        if not is_approver and not request.user.is_superuser:
            return Response(
                {"error": "You are not an approver for this unit"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create delegation data with the current user as delegator
        delegation_data = request.data.copy()

        # Create the delegation
        serializer = self.get_serializer(data=delegation_data)
        serializer.is_valid(raise_exception=True)

        # Save with the current user as delegator
        serializer.save(delegator=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        """Filter delegations based on user role"""
        user = self.request.user
        queryset = super().get_queryset()

        # Check if we're filtering for current user's delegations
        mine = self.request.query_params.get("mine")
        if mine:
            return queryset.filter(delegator=user) | queryset.filter(delegate=user)

        # Admins see all delegations
        if user.is_superuser:
            return queryset

        # Others see delegations they're involved in
        return queryset.filter(delegator=user) | queryset.filter(delegate=user)

    @action(detail=False, methods=["GET"])
    def active(self, request):
        """Get all active delegations for the current user"""
        now = timezone.now()
        delegated_to_me = ApprovalDelegation.objects.filter(
            delegate=request.user,
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
        )
        delegated_by_me = ApprovalDelegation.objects.filter(
            delegator=request.user,
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
        )

        serializer = self.get_serializer(delegated_to_me | delegated_by_me, many=True)
        return Response(serializer.data)
