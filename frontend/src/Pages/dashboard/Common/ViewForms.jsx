import React, { useState, useEffect } from "react";
import { api } from "@/api/api";
import { pretty_log } from "@/api/common_util";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ViewForms = () => {
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdentifier, setSelectedIdentifier] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  useEffect(() => {
    fetchUserForms();
  }, []);

  const fetchUserForms = async () => {
    try {
      setLoading(true);
      const data = await api.student.getAllFormIdentifiers();
      setFormSubmissions(data);
      pretty_log(`Fetched ${data.length} form submissions`, "DEBUG");
    } catch (error) {
      pretty_log(`Error fetching form submissions: ${error.message}`, "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = async (identifier) => {
    try {
      setLoadingForm(true);
      setSelectedIdentifier(identifier);
      const formData = await api.student.getSubmissionByidentifier(identifier);
      setSelectedForm(formData);
      setPdfDialogOpen(true);
    } catch (error) {
      pretty_log(`Error fetching form details: ${error.message}`, "ERROR");
    } finally {
      setLoadingForm(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "returned":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Your Submitted Forms</h2>
        <Button onClick={fetchUserForms} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : formSubmissions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>You haven't submitted any forms yet.</p>
        </div>
      ) : (
        <Table>
          <TableCaption>Your submitted forms</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Form Type</TableHead>
              <TableHead>Identifier</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formSubmissions.map((submission) => (
              <TableRow key={submission.identifier}>
                <TableCell className="font-medium">{submission.form_type}</TableCell>
                <TableCell>{submission.identifier}</TableCell>
                <TableCell>{formatDate(submission.submission_date)}</TableCell>
                <TableCell><Badge className={`${getStatusColor(submission.status)}`}>{submission.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewForm(submission.identifier)}
                  >
                    View Form
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[90vw]">
          <DialogHeader>
            <DialogTitle>
              {selectedForm?.template_name || "Form"} - {selectedIdentifier}
            </DialogTitle>
          </DialogHeader>
          {loadingForm ? (
            <div className="h-[70vh] flex items-center justify-center">
              <p>Loading form details...</p>
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm">{selectedForm && <Badge className={`${getStatusColor(selectedForm.status)}`}> Status: {selectedForm.status}</Badge>}</p>
                  <p className="text-sm">Submitted: {selectedForm && formatDate(selectedForm.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm">Current Step: {selectedForm?.current_step || "N/A"}</p>
                  <p className="text-sm">Form ID: {selectedIdentifier || "N/A"}</p>
                </div>
              </div>
              <div className="h-[70vh] border rounded">
                {selectedForm?.pdf_content ? (
                  <iframe
                    src={`data:application/pdf;base64,${selectedForm.pdf_content}`}
                    className="w-full h-full"
                    title="Form PDF"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <p className="text-gray-500">PDF not available</p>
                  </div>
                )}
              </div>            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewForms;
