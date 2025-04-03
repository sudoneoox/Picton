// frontend/src/Pages/dashboard/Staff/ApprovalQueue.jsx
import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { DataTable } from "@/components/ui/data-table";
import { api } from '@/api/api';
import { toast } from '@/utils/toast';

const ApprovalQueue = ({ approvals, loading, refreshDashboard }) => {
  // We'll use an object to hold comment input per approval, if needed.
  const [comments, setComments] = useState({});

  const handleApprove = async (approvalId) => {
    try {
      const response = await api.admin.approveApproval(approvalId);
      toast.success(`Submission approved! New status: ${response.status}`);
      refreshDashboard();
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error(`Error approving submission: ${error.message}`);
    }
  };

  const handleReturnForChanges = async (approvalId) => {
    // If no comment is set, we can prompt for one (or handle it via a dedicated input)
    const comment = comments[approvalId] || prompt("Enter comment for returning submission:") || "";
    try {
      const response = await api.admin.returnForChanges(approvalId, comment);
      toast.success(`Submission returned for changes! Status: ${response.status}`);
      refreshDashboard();
    } catch (error) {
      console.error("Error returning submission:", error);
      toast.error(`Error returning submission: ${error.message}`);
    }
  };

  // Define the columns. Adjust accessor keys based on your data structure.
  // If each approval object has nested submission data under "form_submission", update accordingly.
  const columns = [
    { header: "Form Type", accessorKey: "form_submission.form_template.name" },
    { header: "Submitter", accessorKey: "form_submission.submitter.username" },
    { header: "Current Step", accessorKey: "form_submission.current_step" },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button onClick={() => handleApprove(row.original.id)}>Approve</Button>
          <Button variant="destructive" onClick={() => handleReturnForChanges(row.original.id)}>
            Return for Changes
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <div>Loading pending approvals...</div>;
  if (!approvals.length) return <div>No pending approvals at this time.</div>;

  return <DataTable columns={columns} data={approvals} />;
};

export default ApprovalQueue;
