from rest_framework import serializers

from utils.prettyPrint import pretty_print
from ..models import (
    FormTemplate,
    FormSubmission,
    FormApproval,
    FormApprovalWorkflow,
    FormSubmissionIdentifier,
)


class FormApprovalWorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormApprovalWorkflow
        fields = ["id", "approver_role", "order"]


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
            # "identifier",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "submitter_name",
            "template_name",
            # "identifier",
        ]

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

    class Meta:
        model = FormApproval
        fields = [
            "id",
            "form_submission",
            "approver",
            "approver_name",
            "step_number",
            "decision",
            "comments",
            "signed_pdf",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "approver_name"]

    def get_approver_name(self, obj):
        return f"{obj.approver.first_name} {obj.approver.last_name}"
