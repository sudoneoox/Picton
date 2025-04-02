import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/api/api.js";
import { useToast } from "@/components/ToastNotification";
import { pretty_log } from "@/api/common_util";

// Simple signature upload component
const SignatureDialog = ({ isOpen, onClose, onSignatureSubmit }) => {
  const [signature, setSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSignatureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSignature(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signature) {
      showToast({ error: "Please upload a signature" }, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create form data to send file
      const formData = new FormData();
      formData.append("signature", signature);

      await api.commonAPI.submitSignature(formData);
      showToast({ message: "Signature uploaded successfully" }, "success");
      onSignatureSubmit();
      onClose();
    } catch (error) {
      pretty_log(`Error uploading signature: ${error}`, "ERROR");
      showToast(
        { error: error.message || "Failed to upload signature" },
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open) => {
    // Only allow closing if we're not submitting
    if (!open && isSubmitting) {
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => {
        // Prevent closing when clicking outside if submitting
        if (isSubmitting) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>Upload Signature</DialogTitle>
          <DialogDescription>
            You need to upload your signature before submitting forms.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Your Signature (image file)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureChange}
                className="border p-2 rounded"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Upload a clear image of your signature on a white background
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload Signature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDialog;
