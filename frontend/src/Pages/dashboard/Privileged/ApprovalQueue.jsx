import { useEffect, useState } from 'react';
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/api/api";

const ApprovalQueue = () => {
  const [submissions, setSubmissions] = useState([]);

  const fetchData = async () => {
    try {
      const data = await api.privileged.getPendingApprovals();
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching approvals:", error);
    }
  };

  useEffect(() => { fetchData() }, []);

  const columns = [
    { header: "Form Type", accessorKey: "form_template.name" },
    { header: "Submitter", accessorKey: "submitter.username" },
    { header: "Current Step", accessorKey: "current_step" },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button onClick={() => handleApprove(row.original.id)}>Approve</Button>
          <Button variant="destructive" onClick={() => handleReject(row.original.id)}>
            Reject
          </Button>
        </div>
      )
    }
  ];

  return <DataTable columns={columns} data={submissions} />;
};

export default ApprovalQueue;