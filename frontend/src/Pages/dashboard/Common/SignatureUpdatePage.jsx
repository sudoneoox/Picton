import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/api";
import { pretty_log } from "@/api/common_util";
import { useToast } from "@/components/ToastNotification";

const SignatureUpdatePage = () => {
  const [signature, setSignature] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    checkSignature();
  }, []);

  const checkSignature = async () => {
    try {
      setIsLoading(true);
      const response = await api.commonAPI.checkIfSignature();
      setHasSignature(response?.has_signature || false);
    } catch (error) {
      pretty_log(`Error checking signature: ${error}`, "ERROR");
      showToast({ error: "Failed to verify signature status" }, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size
      if (file.size > 2 * 1024 * 1024) {
        showToast({ error: "Signature file too large. Maximum is 2MB." }, "error");
        return;
      }

      // Validate file type
      const fileType = file.type;
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(fileType)) {
        showToast({ error: "Invalid file type. Please upload a JPEG, PNG or GIF image" }, "error");
        return;
      }

      setSignature(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signature) {
      showToast({ error: "Please select a signature file" }, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("signature", signature);

      await api.commonAPI.submitSignature(formData);
      showToast({ message: "Signature uploaded successfully" }, "success");
      setHasSignature(true);
      // Clear form after successful upload
      setSignature(null);
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signature Management</CardTitle>
          <CardDescription>Loading signature information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signature Management</CardTitle>
        <CardDescription>
          {hasSignature
            ? "Update your signature used for form approvals"
            : "Upload a signature for form approvals"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasSignature && (
          <div className="mb-6 p-4 bg-muted rounded-md">
            <p className="font-medium text-green-600">✓ You have a signature on file</p>
            <p className="text-sm text-muted-foreground mt-1">
              You can update your signature by uploading a new one below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="signature" className="text-sm font-medium">
              {hasSignature ? "New Signature" : "Signature"} (Image File)
            </label>
            <input
              id="signature"
              type="file"
              accept="image/*"
              onChange={handleSignatureChange}
              className="block w-full border rounded-md p-2"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Upload a clear image of your signature on a white background
              (JPEG, PNG or GIF, max 2MB)
            </p>
          </div>

          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="border rounded-md p-4 bg-white">
                <img
                  src={previewUrl}
                  alt="Signature Preview"
                  className="max-h-32 mx-auto"
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" disabled={!signature || isSubmitting}>
              {isSubmitting ? "Uploading..." : hasSignature ? "Update Signature" : "Upload Signature"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-4">
        <div className="text-xs text-muted-foreground">
          <p>Your signature will be used to sign form submissions and approvals.</p>
          <p>The image should be clear and legible for official documentation.</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignatureUpdatePage;
