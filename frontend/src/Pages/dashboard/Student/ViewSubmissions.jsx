// src/pages/dashboard/Student/ViewSubmissions.jsx
import React, { useEffect, useState } from "react";
import { api } from "@/api/api";
import { pretty_log } from "@/api/common_util";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ViewSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await api.student.getFormSubmissions();
        setSubmissions(data);
      } catch (error) {
        pretty_log("Error fetching submissions: " + error, "ERROR");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleViewPDF = (pdfUrl) => {
    setSelectedPdf(pdfUrl);
    setDialogOpen(true);
  };

  const statusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Form Submissions</h2>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center text-muted-foreground mt-8">
          You haven't submitted any forms yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{submission.form_template_name || "Form"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(submission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={statusColor(submission.status)}>
                  {submission.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleViewPDF(submission.pdf_url)}>
                  View PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
