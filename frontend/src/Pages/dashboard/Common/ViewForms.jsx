import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pretty_log } from "@/api/common_util";

const ViewForms = ({ submissions }) => {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No form submissions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{submission.template_name}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                submission.status === 'returned' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Submitted by: {submission.submitter_name}
              </p>
              <p className="text-sm text-gray-500">
                Submitted on: {new Date(submission.created_at).toLocaleDateString()}
              </p>
              {submission.current_pdf && (
                <a
                  href={submission.current_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View PDF
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
=======
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
      const formDetails = await api.student.getSubmissionByidentifier(identifier);
      setSelectedForm(formDetails);
      setPdfDialogOpen(true);
    } catch (error) {
      pretty_log(`Error fetching form details: ${error.message}`, "ERROR");
    } finally {
      setLoadingForm(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "returned":
        return <Badge className="bg-orange-100 text-orange-800">Returned</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
                <TableCell>{getStatusBadge(submission.status)}</TableCell>
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

      {/* PDF View Dialog */}
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
                  <p className="text-sm">Status: {selectedForm && getStatusBadge(selectedForm.status)}</p>
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
