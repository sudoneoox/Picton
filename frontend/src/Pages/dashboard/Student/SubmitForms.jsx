import React, { useState, useEffect } from "react";
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
import SignatureDialog from "@/Pages/dashboard/Common/SignatureDialog";

const SubmitForms = () => {
  const [hasSignature, setHasSignature] = useState(true); // Optimistic
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has a signature on component mount
  useEffect(() => {
    const checkSignature = async () => {
      setIsLoading(true);
      try {
        const response = await api.commonAPI.checkIfSignature();
        setHasSignature(response?.has_signature || false);

        // If no signature, show dialog automatically
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
    <div>
      <h1>Submit a new form</h1>
      {/* TODO: */}
      {/* NOTE: Form submission goes here */}
    </div>
  );
};

export default SubmitForms;
