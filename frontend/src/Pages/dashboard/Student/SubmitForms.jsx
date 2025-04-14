import React, { useState, useEffect } from "react";
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
import SignatureDialog from "@/Pages/dashboard/Common/SignatureDialog";
import { Button } from "@/components/ui/button";
import FormSubmissionDialog from "@/Pages/dashboard/Student/FormSubmissionDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const SubmitForms = ({ formTemplates = [] }) => {
  const [hasSignature, setHasSignature] = useState(true); // Optimistic
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showFormTypeDialog, setShowFormTypeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);

  // Setup available templates based on props or fetch them
  useEffect(() => {
    setIsLoading(true);

    if (formTemplates && formTemplates.length > 0) {
      setAvailableTemplates(formTemplates);
      setIsLoading(false);
    } else {
      // Fallback fetch if no templates provided
      const fetchTemplates = async () => {
        try {
          const data = await api.student.getFormTemplates();
          setAvailableTemplates(data || []);
        } catch (error) {
          pretty_log(`Error fetching templates: ${error}`, "ERROR");
        } finally {
          setIsLoading(false);
        }
      };

      fetchTemplates();
    }
  }, [formTemplates]);

  // Check if user has a signature
  useEffect(() => {
    const checkSignature = async () => {
      try {
        const response = await api.commonAPI.checkIfSignature();
        setHasSignature(response?.has_signature || false);

        if (!response?.has_signature) {
          setShowSignatureDialog(true);
        }
      } catch (error) {
        pretty_log(`Error checking signature: ${error}`, "ERROR");
        setHasSignature(false);
        setShowSignatureDialog(true);
      }
    };

    checkSignature();
  }, []);

  const handleSignatureSubmit = () => {
    setHasSignature(true);
    setShowSignatureDialog(false);
  };

  const handleStartNewForm = () => {
    if (availableTemplates.length === 1) {
      // If only one template, select it automatically
      handleFormTypeSelect(availableTemplates[0]);
    } else {
      setShowFormTypeDialog(true);
    }
  };

  const handleFormTypeSelect = (template) => {
    setSelectedTemplate(template);
    setShowFormTypeDialog(false);
    setShowFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setShowFormDialog(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!hasSignature) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded">
          <h3 className="text-amber-800 font-medium">Signature Required</h3>
          <p className="text-amber-700">
            You need to upload your signature before submitting forms.
          </p>
        </div>
        <button
          onClick={() => setShowSignatureDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload Signature
        </button>
        <SignatureDialog
          isOpen={showSignatureDialog}
          onClose={() => setShowSignatureDialog(false)}
          onSignatureSubmit={handleSignatureSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h3 className="text-blue-800 font-medium">Submit a Form</h3>
        <p className="text-blue-700 mt-1">
          Select a form type below to start a new submission.
        </p>
      </div>

      <Button onClick={handleStartNewForm}>Start New Form</Button>

      {/* Form Type Selection Dialog */}
      <Dialog open={showFormTypeDialog} onOpenChange={setShowFormTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Form Type</DialogTitle>
            <DialogDescription>
              Choose the type of form you want to submit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {availableTemplates.map(template => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleFormTypeSelect(template)}
              >
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                {template.details && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {template.details}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}

            {availableTemplates.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No form templates available. Please contact an administrator.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormTypeDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Submission Dialog */}
      <FormSubmissionDialog
        isOpen={showFormDialog}
        onClose={handleCloseFormDialog}
        template={selectedTemplate}
      />

      {/* Signature Dialog */}
      <SignatureDialog
        isOpen={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        onSignatureSubmit={handleSignatureSubmit}
      />
    </div>
  );
};

export default SubmitForms;
