import React, { useState, useEffect } from "react";
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
import SignatureDialog from "@/Pages/dashboard/Common/SignatureDialog";
import { Button } from "@/components/ui/button";
import FormSubmissionDialog from "@/Pages/dashboard/Student/FormSubmissionDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Form template definitions with proper field schemas
const FORM_TEMPLATES = {
  graduate: {
    id: 1,
    type: "graduate",
    name: "Graduate Petition Form",
    description: "For graduate students requesting exceptions to university policies",
    details: "Use this form to request course exceptions, deadline extensions, or other graduate program adjustments",
    fields: [
      {
        name: "first_name",
        label: "First Name",
        type: "text",
        required: true,
      },
      {
        name: "last_name",
        label: "Last Name",
        type: "text",
        required: true,
      },
      {
        name: "middle_name",
        label: "Middle Name",
        type: "text",
        required: false,
      },
      {
        name: "student_id",
        label: "MyUH ID",
        type: "text",
        required: true,
      },
      {
        name: "phone_number",
        label: "Phone Number",
        type: "text",
        required: true,
      },
      {
        name: "email",
        label: "School Email",
        type: "email",
        required: true,
      },
      {
        name: "program_plan",
        label: "Program Plan",
        type: "text",
        required: true,
      },
      {
        name: "academic_career",
        label: "Academic Career",
        type: "radio",
        required: true,
        options: [
          { value: "Undergraduate", label: "Undergraduate" },
          { value: "Graduate", label: "Graduate" },
          { value: "Law", label: "Law" },
        ],
      },
      {
        name: "year",
        label: "Petition Effective Year",
        type: "text",
        required: true,
        defaultValue: new Date().getFullYear().toString(),
      },
      {
        name: "season",
        label: "Petition Effective Term",
        type: "radio",
        required: true,
        options: [
          { value: "Fall", label: "Fall" },
          { value: "Spring", label: "Spring" },
          { value: "Summer", label: "Summer" },
        ],
      },
      {
        name: "petition_purpose",
        label: "Purpose of Petition",
        type: "radio",
        required: true,
        options: [
          { 
            value: "program_status", 
            label: "Update program status/action (term activate, discontinue, etc)" 
          },
          { 
            value: "admission_status", 
            label: "Admission status change (conditional, unconditional)" 
          },
          { 
            value: "other", 
            label: "Other (please explain below)" 
          },
        ],
      },
      {
        name: "petition_explanation",
        label: "Explanation",
        type: "textarea",
        required: false,
        conditional: {
          field: "petition_purpose",
          value: "other",
        },
      },
      {
        name: "supporting_document",
        label: "Supporting Document",
        type: "file",
        required: false,
      },
    ],
  },
  withdrawal: {
    id: 2,
    type: "withdrawal",
    name: "Term Withdrawal Form",
    description: "For students withdrawing from all courses in the current term",
    details: "Please note: Term withdrawal means the student is dropping all courses in all sessions of the term and withdrawing from the university for the current term only.",
    fields: [
      {
        name: "first_name",
        label: "First Name",
        type: "text",
        required: true,
      },
      {
        name: "last_name",
        label: "Last Name",
        type: "text",
        required: true,
      },
      {
        name: "middle_name",
        label: "Middle Name",
        type: "text",
        required: false,
      },
      {
        name: "student_id",
        label: "MyUH ID",
        type: "text",
        required: true,
      },
      {
        name: "phone_number",
        label: "Phone Number",
        type: "text",
        required: true,
      },
      {
        name: "email",
        label: "Student Email",
        type: "email",
        required: true,
      },
      {
        name: "program_plan",
        label: "Program Plan",
        type: "text",
        required: true,
      },
      {
        name: "academic_career",
        label: "Academic Career",
        type: "radio",
        required: true,
        options: [
          { value: "Undergraduate", label: "Undergraduate" },
          { value: "Graduate", label: "Graduate" },
        ],
      },
      {
        name: "year",
        label: "Withdrawal Year",
        type: "text",
        required: true,
        defaultValue: new Date().getFullYear().toString(),
      },
      {
        name: "season",
        label: "Withdrawal Term",
        type: "radio",
        required: true,
        options: [
          { value: "Fall", label: "Fall" },
          { value: "Spring", label: "Spring" },
          { value: "Summer", label: "Summer" },
        ],
      },
      {
        name: "initials",
        label: "Initial all that apply",
        type: "checkboxGroup",
        required: false,
        subfields: [
          {
            name: "financial_aid",
            label: "STUDENTS RECEIVING FINANCIAL AID: I understand that if I withdrawal from ALL classes I may owe financial aid back to the university based on federal regulations.",
          },
          {
            name: "international_student",
            label: "INTERNATIONAL STUDENTS: I understand that withdrawing may affect my visa status.",
          },
          {
            name: "student_athlete",
            label: "STUDENT ATHLETES: I understand that withdrawing may affect my athletic eligibility.",
          },
          {
            name: "veterans",
            label: "VETERANS: I understand that withdrawing may affect my VA benefits.",
          },
          {
            name: "graduate_professional",
            label: "GRADUATE/PROFESSIONAL STUDENTS: I understand that withdrawing may affect my academic standing.",
          },
          {
            name: "doctoral_student",
            label: "DOCTORAL STUDENTS: I understand that withdrawing may affect my candidacy status.",
          },
          {
            name: "student_housing",
            label: "STUDENT HOUSING: I understand that I must contact housing regarding my withdrawal.",
          },
          {
            name: "dining_services",
            label: "DINING SERVICES: I understand that I must contact dining services regarding my meal plan.",
          },
          {
            name: "parking_transportation",
            label: "PARKING & TRANSPORTATION: I understand that I must contact parking services regarding my parking permit.",
          },
        ],
      },
    ],
  },
};

const SubmitForms = ({ formTemplates }) => {
  const [hasSignature, setHasSignature] = useState(true); // Optimistic
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showFormTypeDialog, setShowFormTypeDialog] = useState(false);
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

  const handleStartNewForm = () => {
    setShowFormTypeDialog(true);
  };

  const handleFormTypeSelect = (formType) => {
    const template = FORM_TEMPLATES[formType];
    setSelectedTemplate(template);
    setShowFormTypeDialog(false);
    setShowFormDialog(true);
  };

  const handleCloseFormDialog = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleFormTypeSelect('graduate')}
            >
              <CardHeader>
                <CardTitle>Graduate Petition Form</CardTitle>
                <CardDescription>For graduate students requesting exceptions to university policies</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use this form to request course exceptions, deadline extensions, or other graduate program adjustments
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleFormTypeSelect('withdrawal')}
            >
              <CardHeader>
                <CardTitle>Term Withdrawal Form</CardTitle>
                <CardDescription>For students withdrawing from all courses in the current term</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The general processing time for all Term Withdrawal Requests is 3-5 business days, however, the official term withdrawal date for the student will be the date that the request has been received by the Office of the University Registrar.
                </p>
              </CardContent>
            </Card>
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
