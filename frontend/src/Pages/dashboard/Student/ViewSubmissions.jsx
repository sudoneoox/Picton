// src/pages/dashboard/Student/ViewSubmissions.jsx
import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { pretty_log } from "@/api/common_util";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {student} from "@/../api/student_dashboard";


    const data = await student.getSubmissions();
    const ViewSubmissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [selectedPdf, setSelectedPdf] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await api.student.getSubmissions();
        setSubmissions(data);
      } catch (error) {
        pretty_log("Error fetching submissions: " + error, "ERROR");
      }
    };

    fetchSubmissions();
  }, []);

  const handleViewPDF = (pdfUrl) => {
    setSelectedPdf(pdfUrl);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Form Submissions</h2>
      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Title</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Submitted</th>
            <th className="border p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td className="border p-2">{submission.form_template_name || "Form"}</td>
              <td className="border p-2 capitalize">{submission.status}</td>
              <td className="border p-2">{new Date(submission.created_at).toLocaleDateString()}</td>
              <td className="border p-2">
                <Button onClick={() => handleViewPDF(submission.pdf_url)}>
                  View PDF
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PDF Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
            <DialogDescription>Here is your submitted form</DialogDescription>
          </DialogHeader>
          {selectedPdf ? (
            <iframe
              src={selectedPdf}
              className="w-full h-[70vh] border rounded"
              title="PDF Preview"
            />
          ) : (
            <div className="text-center">Loading PDF...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewSubmissions;
