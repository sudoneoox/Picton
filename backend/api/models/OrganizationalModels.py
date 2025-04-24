from django.db import models

from .ModelConstants import BaseModel
from .UserModel import User


class OrganizationalUnit(BaseModel, models.Model):
    """
    Represents a unit in the organizational hierarchy

    Models the institutional structure with departments, colleges, etc.
    Supports hierarchical relationships through the parent field.
    Used to determine approval workflows by unit.
    """

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="sub_units",
    )

    level = models.PositiveIntegerField(help_text="Hierarchy level (0 for top level)")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["level", "name"]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def get_hierarchy_path(self):
        """
        Returns the full path of units from root to this unit

        Walks up the hierarchy from this unit to the root unit,
        building a list of all units in the path.

        Returns:
            List[OrganizationalUnit]: List of units in order from root to this unit
        """

        path = [self]
        current = self
        while current.parent:
            current = current.parent
            path.append(current)
        return list(reversed(path))


class UnitApprover(BaseModel, models.Model):
    """
    Links approvers to organizational units with specific roles

    Maps users to their approval roles within specific organizational units.
    Can be organization-wide for approvers who can approve across all units.
    """

    unit = models.ForeignKey(
        OrganizationalUnit, on_delete=models.CASCADE, related_name="approvers"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="unit_approver_roles"
    )
    role = models.CharField(max_length=50)
    is_organization_wide = models.BooleanField(
        default=False, help_text="Can approve across all units"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["unit", "user", "role"]

    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.unit.name}"


class ApprovalDelegation(BaseModel, models.Model):
    """
    Tracks temporary delegations of approval authority

    Allows staff to delegate their approval authority to others during absences.
    Each delegation has a specific time period and is linked to a unit.
    """

    delegator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="delegated_from"
    )
    delegate = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="delegated_to"
    )
    unit = models.ForeignKey(OrganizationalUnit, on_delete=models.CASCADE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    reason = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return (
            f"{self.delegator.username} -> {self.delegate.username} ({self.unit.name})"
        )

    @classmethod
    def get_active_delegation(cls, user, unit=None):
        """
        Get all active delegations where this user is the delegate

        Finds all approval authorities that have been delegated to this user
        that are currently active based on date range.

        Args:
            user: The user to check for active delegations

        Returns:
            QuerySet: Active delegations for this user
        """
        from django.utils import timezone

        query = cls.objects.filter(
            delegator=user,
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now(),
        )

        if unit:
            query = query.filter(unit=unit)

        delegation = query.first()
        return delegation.delegate if delegation else None

    @classmethod
    def get_active_delegations_for_user(cls, user):
        """
        Get all active delegations where this user is the delegate
        """
        from django.utils import timezone

        return cls.objects.filter(
            delegate=user,
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now(),
        ).select_related("delegator", "unit")
