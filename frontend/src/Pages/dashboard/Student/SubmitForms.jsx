import React, { useState, useEffect } from "react";
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
import SignatureDialog from "@/Pages/dashboard/Common/SignatureDialog";
import { Button } from "@/components/ui/button"
import FormSubmissionDialog from "@/Pages/dashboard/Student/FormSubmissionDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SubmitForms = ({ formTemplates }) => {
  const [hasSignature, setHasSignature] = useState(true); // Optimistic
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // NOTE: Check if user has a signature on component mount
  useEffect(() => {
    const checkSignature = async () => {
      setIsLoading(true);
      try {
        const response = await api.commonAPI.checkIfSignature();
        setHasSignature(response?.has_signature || false);

        // NOTE: If no signature, show dialog automatically so that they can submit their signature
        if (!response?.has_signature) {
          setShowSignatureDialog(true);
        }
      } catch (error) {
        pretty_log(`Error checking signature: ${error}`, "ERROR");
        setHasSignature(false);
        setShowSignatureDialog(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkSignature();
  }, []);

  const handleSignatureSubmit = () => {
    setHasSignature(true);
    setShowSignatureDialog(false);
  };

  const handleOpenFormDialog = (template) => {
    setSelectedTemplate(template);
    setShowFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setShowFormDialog(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
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
        <h3 className="text-blue-800 font-medium">Available Forms</h3>
        <p className="text-blue-700 mt-1">
          Select a form type below to start a new submission.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formTemplates?.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleOpenFormDialog(template)}
          >
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Required Approvals: {template.required_approvals}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form submission dialog */}
      <FormSubmissionDialog
        className="w-full"
        isOpen={showFormDialog}
        onClose={handleCloseFormDialog}
        template={selectedTemplate}
      />

      {/* Signature dialog */}
      <SignatureDialog
        isOpen={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        onSignatureSubmit={handleSignatureSubmit}
      />
    </div>
  );
};

export default SubmitForms;
