from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from utils import MethodNameMixin

from ..models import (
    OrganizationalUnit,
    UnitApprover,
    ApprovalDelegation,
    DelegationHistory,
    User,
)
from ..serializers import (
    OrganizationalUnitSerializer,
    UnitApproverSerializer,
    ApprovalDelegationSerializer,
    DelegationHistorySerializer,
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


class ApprovalDelegationViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """
    ViewSet for managing approval delegations
    """

    serializer_class = ApprovalDelegationSerializer
    queryset = ApprovalDelegation.objects.all()

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

        if not unit_id or not delegate_id:
            return Response(
                {"error": "Unit and delegate are required"},
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

        # Validate delegation dates
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")
        
        if start_date >= end_date:
            return Response(
                {"error": "End date must be after start date"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for overlapping delegations
        overlapping = ApprovalDelegation.objects.filter(
            delegator=request.user,
            unit_id=unit_id,
            is_active=True,
            start_date__lte=end_date,
            end_date__gte=start_date,
        ).exists()

        if overlapping:
            return Response(
                {"error": "You already have an active delegation for this period"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Add the current user as delegator
        data = request.data.copy()
        data['delegator'] = request.user.id

        # Create the delegation
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

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

    @action(detail=True, methods=["POST"])
    def cancel(self, request, pk=None):
        """Cancel a delegation"""
        delegation = self.get_object()
        
        # Only the delegator or an admin can cancel
        if not (request.user == delegation.delegator or request.user.is_superuser):
            return Response(
                {"error": "Only the delegator or an admin can cancel the delegation"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        delegation.cancel(cancelled_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["GET"])
    def history(self, request, pk=None):
        """Get the history of a delegation"""
        delegation = self.get_object()
        history = DelegationHistory.objects.filter(delegation=delegation)
        serializer = DelegationHistorySerializer(history, many=True)
        return Response(serializer.data)
