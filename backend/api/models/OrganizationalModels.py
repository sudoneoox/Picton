from django.db import models
from django.conf import settings

from .ModelConstants import BaseModel
from .UserModel import User


class OrganizationalUnit(BaseModel, models.Model):
    """Represents a unit in the organizational hierarchy"""

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
        """Returns the full path of units from root to this unit"""
        path = [self]
        current = self
        while current.parent:
            current = current.parent
            path.append(current)
        return list(reversed(path))


class UnitApprover(BaseModel, models.Model):
    """Links approvers to organizational units with specific roles"""

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
    """Tracks temporary delegations of approval authority"""

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
    notify_on_approval = models.BooleanField(
        default=True,
        help_text="Notify delegator when delegate makes an approval decision"
    )
    notify_on_new_request = models.BooleanField(
        default=True,
        help_text="Notify delegate when new approval requests arrive"
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return (
            f"{self.delegator.username} -> {self.delegate.username} ({self.unit.name})"
        )

    def save(self, *args, **kwargs):
        # Track if this is a new instance
        is_new = self.pk is None
        
        # Save the instance
        super().save(*args, **kwargs)
        
        # Create history entry
        if is_new:
            self.create_history('created')
        else:
            self.create_history('updated')

    def cancel(self, cancelled_by):
        """Cancel this delegation"""
        self.is_active = False
        self.save()
        self.create_history('cancelled', action_by=cancelled_by)

    def create_history(self, action, action_by=None, details=None):
        """Create a history entry for this delegation"""
        from django.utils import timezone
        
        if action_by is None:
            action_by = self.delegator

        DelegationHistory.objects.create(
            delegation=self,
            action=action,
            action_by=action_by,
            details=details
        )

        try:
            # If action is 'cancelled', notify relevant users
            if action == 'cancelled':
                self.send_cancellation_notification()
            # If action is 'created', notify delegate
            elif action == 'created':
                self.send_creation_notification()
        except ImportError:
            # If notification module is not available, log it but don't fail
            print(f"Warning: Notification system not available - {action} notification skipped")
        except Exception as e:
            # Log other errors but don't fail the operation
            print(f"Warning: Failed to send {action} notification - {str(e)}")

    def send_cancellation_notification(self):
        """Send notification about delegation cancellation"""
        try:
            from api.tasks import send_notification
            
            # Notify delegate
            send_notification.delay(
                user_id=self.delegate.id,
                title="Delegation Cancelled",
                message=f"Your delegation for {self.unit.name} has been cancelled.",
                notification_type="delegation_cancelled"
            )
        except ImportError:
            # If notification module is not available, log it but don't fail
            print("Warning: Notification system not available")
        except Exception as e:
            # Log other errors but don't fail the operation
            print(f"Warning: Failed to send cancellation notification - {str(e)}")

    def send_creation_notification(self):
        """Send notification about new delegation"""
        try:
            from api.tasks import send_notification
            
            # Notify delegate
            send_notification.delay(
                user_id=self.delegate.id,
                title="New Delegation Assigned",
                message=f"You have been assigned as a delegate for {self.unit.name}",
                notification_type="delegation_created"
            )
        except ImportError:
            # If notification module is not available, log it but don't fail
            print("Warning: Notification system not available")
        except Exception as e:
            # Log other errors but don't fail the operation
            print(f"Warning: Failed to send creation notification - {str(e)}")

    @classmethod
    def get_active_delegation(cls, user, unit=None):
        """
        Check if a user has delegated their approval authority
        Returns the active delegate user or None
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


class DelegationHistory(BaseModel, models.Model):
    """Tracks the history of changes to delegations"""
    
    delegation = models.ForeignKey(
        ApprovalDelegation, 
        on_delete=models.CASCADE,
        related_name='history'
    )
    action = models.CharField(
        max_length=20,
        choices=[
            ('created', 'Created'),
            ('updated', 'Updated'),
            ('cancelled', 'Cancelled'),
            ('expired', 'Expired')
        ]
    )
    action_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='delegation_actions'
    )
    action_date = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(
        null=True,
        blank=True,
        help_text='Additional details about the action'
    )

    class Meta:
        ordering = ['-action_date']

    def __str__(self):
        return f"{self.delegation} - {self.action} by {self.action_by}"
