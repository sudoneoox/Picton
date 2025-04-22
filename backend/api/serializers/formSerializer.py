from rest_framework import serializers
from utils.prettyPrint import pretty_print
from ..models import (
    FormTemplate,
    FormSubmission,
    FormApproval,
    FormApprovalWorkflow,
    FormSubmissionIdentifier,
    UnitApprover,
    OrganizationalUnit,
    ApprovalDelegation,
)


class FormApprovalWorkflowSerializer(serializers.ModelSerializer):
    """
    Serializer for approval workflow steps, including template and unit.
    """

    form_template = serializers.PrimaryKeyRelatedField(
        queryset=FormTemplate.objects.all(),
        help_text="ID of the form template this step belongs to",
    )
    unit = serializers.PrimaryKeyRelatedField(
        queryset=OrganizationalUnit.objects.all(),
        help_text="ID of the organizational unit responsible for this step",
    )

    class Meta:
        model = FormApprovalWorkflow
        fields = [
            "id",
            "form_template",
            "unit",
            "approver_role",
            "order",
        ]
        read_only_fields = ["id"]


class FormTemplateSerializer(serializers.ModelSerializer):
    approval_workflows = FormApprovalWorkflowSerializer(many=True, read_only=True)

    class Meta:
        model = FormTemplate
        fields = [
            "id",
            "name",
            "description",
            "field_schema",
            "required_approvals",
            "approval_workflows",
            "created_at",
            "updated_at",
        ]


class FormSubmissionSerializer(serializers.ModelSerializer):
    submitter_name = serializers.SerializerMethodField()
    template_name = serializers.SerializerMethodField()
    unit_name = serializers.SerializerMethodField()

    class Meta:
        model = FormSubmission
        fields = [
            "id",
            "form_template",
            "template_name",
            "submitter",
            "submitter_name",
            "form_data",
            "current_pdf",
            "status",
            "current_step",
            "created_at",
            "unit",
            "unit_name",
            # "identifier",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "submitter_name",
            "template_name",
            "unit_name",
            # "identifier",
        ]

    def get_unit_name(self, obj):
        return obj.unit.name if obj.unit else ""

    def get_submitter_name(self, obj):
        return f"{obj.submitter.first_name} {obj.submitter.last_name}"

    def get_template_name(self, obj):
        return obj.form_template.name

    def get_identifier(self, obj):
        """Get the unique identifier for this submission"""
        try:
            # Get the identifier through the related model
            identifier_obj = FormSubmissionIdentifier.objects.filter(
                form_submission=obj
            ).first()
            if identifier_obj:
                return identifier_obj.identifier
            return None
        except Exception as e:
            pretty_print(f"Error getting identifier: {str(e)}", "ERROR")
            return None


class FormApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()
    submitter_name = serializers.SerializerMethodField()
    form_title = serializers.SerializerMethodField()
    submission_identifier = serializers.SerializerMethodField()

    class Meta:
        model = FormApproval
        fields = [
            "id",
            "form_submission",
            "approver",
            "approver_name",
            "submitter_name",
            "form_title",
            "submission_identifier",
            "step_number",
            "decision",
            "comments",
            "signed_pdf",
            "signed_pdf_url",
            "created_at",
            "decided_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "approver_name",
            "submitter_name",
            "form_title",
            "submission_identifier",
            "decided_at",
        ]

    def get_approver_name(self, obj):
        return f"{obj.approver.first_name} {obj.approver.last_name}"

    def get_submitter_name(self, obj):
        submitter = obj.form_submission.submitter
        return f"{submitter.first_name} {submitter.last_name}"

    def get_form_title(self, obj):
        return obj.form_submission.form_template.name

    def get_submission_identifier(self, obj):
        try:
            return obj.form_submission.submission_identifier.identifier
        except Exception as e:
            return None


class OrganizationalUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationalUnit
        fields = [
            "id",
            "name",
            "code",
            "description",
            "parent",
            "level",
            "is_active",
            "created_at",
            "updated_at",
        ]


class UnitApproverSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    unit_name = serializers.SerializerMethodField()

    class Meta:
        model = UnitApprover
        fields = [
            "id",
            "unit",
            "unit_name",
            "user",
            "user_name",
            "role",
            "is_organization_wide",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_unit_name(self, obj):
        return obj.unit.name


class ApprovalDelegationSerializer(serializers.ModelSerializer):
    unit_name = serializers.SerializerMethodField()
    delegator_name = serializers.SerializerMethodField()
    delegate_name = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalDelegation
        fields = [
            "id",
            "delegator",
            "delegate",
            "unit",
            "unit_name",
            "start_date",
            "end_date",
            "reason",
            "is_active",
            "delegator_name",
            "delegate_name",
        ]
        read_only_fields = [
            "delegator",
            "id",
            "unit_name",
            "delegator_name",
            "delegate_name",
        ]

    def get_delegator_name(self, obj):
        return f"{obj.delegator.first_name} {obj.delegator.last_name}"

    def get_delegate_name(self, obj):
        return f"{obj.delegate.first_name} {obj.delegate.last_name}"

    def get_unit_name(self, obj):
        return obj.unit.name
