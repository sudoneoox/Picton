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
      const formData = await api.student.getFormByIdentifier(identifier);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!formSubmissions || formSubmissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No form submissions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableCaption>A list of your form submissions.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Form Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formSubmissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell>{submission.form_template.name}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewForm(submission.id)}
                  disabled={loadingForm}
                >
                  {loadingForm && selectedIdentifier === submission.id ? "Loading..." : "View Form"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Form Details</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Form Information</h3>
                  <p>Type: {selectedForm.form_template.name}</p>
                  <p>Status: {selectedForm.status}</p>
                  <p>Submitted: {new Date(selectedForm.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Submitter Information</h3>
                  <p>Name: {selectedForm.submitter_name}</p>
                  <p>ID: {selectedForm.submitter.id}</p>
                </div>
              </div>
              {selectedForm.current_pdf && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Form PDF</h3>
                  <iframe
                    src={selectedForm.current_pdf}
                    className="w-full h-[600px] border rounded"
                    title="Form PDF"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewForms;
