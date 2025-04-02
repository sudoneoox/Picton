import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { pretty_log } from "@/api/common_util";
import { api } from "@/api/api.js";
import { useToast } from "@/components/ToastNotification";

const FormSubmissionDialog = ({ isOpen, onClose, template }) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // NOTE: common fields
    first_name: "",
    middle_name: "",
    last_name: "",
    student_id: "",
    phone_number: "",
    email: "",
    program_plan: "",
    academic_career: "",
    year: new Date().getFullYear().toString(),
    season: "",
    // NOTE: term withdrawal
    initials: {
      financial_aid: false,
      international_student: false,
      student_athlete: false,
      veterans: false,
      graduate_professional: false,
      doctoral_student: false,
      student_housing: false,
      dining_services: false,
      parking_transportation: false,
    },
    initialsText: {
      financial_aid: "",
      international_student: "",
      student_athlete: "",
      veterans: "",
      graduate_professional: "",
      doctoral_student: "",
      student_housing: "",
      dining_services: "",
      parking_transportation: "",
    },
    // NOTE: Graduate Petition 
    petition_purpose: "",
    petition_explanation: "",
    supporting_document: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        student_id: "",
        phone_number: "",
        email: "",
        program_plan: "",
        academic_career: "",
        year: new Date().getFullYear().toString(),
        season: "",
        initials: {
          financial_aid: false,
          international_student: false,
          student_athlete: false,
          veterans: false,
          graduate_professional: false,
          doctoral_student: false,
          student_housing: false,
          dining_services: false,
          parking_transportation: false,
        },
        initialsText: {
          financial_aid: "",
          international_student: "",
          student_athlete: "",
          veterans: "",
          graduate_professional: "",
          doctoral_student: "",
          student_housing: "",
          dining_services: "",
          parking_transportation: "",
        }
      });
      setPreviewPdf(null);
      setSelectedForm(null);
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      initials: {
        ...prev.initials,
        [field]: checked
      }
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        supporting_document: e.target.files[0]
      }))
    }
  };

  const handleInitialsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      initialsText: {
        ...prev.initialsText,
        [field]: value
      }
    }));
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      // Validate current step
      if (currentStep === 1 && !selectedForm) {
        showToast({ error: "Please select a form type" }, "error");
        return;
      }

      if (currentStep === 2) {
        // Validate step 2 required fields for term withdrawal
        if (selectedForm === "withdrawal") {
          const requiredFields = ['first_name', 'last_name', "student_id", "phone_number", "email", "program_plan", "academic_career", "season"];
          const missingFields = requiredFields.filter(field => !formData[field]);

          if (missingFields.length > 0) {
            showToast({ error: "Please fill in all required fields" }, "error");
            return;
          }
        }

        // Validate required fields for graduate petition
        if (selectedForm === "graduate") {
          const requiredFields = ['first_name', 'last_name', 'student_id', 'phone_number', 'email', 'program_plan', 'academic_career', 'season', 'petition_purpose']
          const missingFields = requiredFields.filter(field => !formData[field])

          if (missingFields.length > 0) {
            showToast({ error: "Please fill in all required fields" }, 'error')
            return;
          }
          //NOTE:  if other is selected as purpose, explanation is required
          if (formData.petition_purpose === "other" && !formData.petition_explanation) {
            showToast({ error: "Please provide an explanation for your petition" }, "error");
            return;
          }
        }

        // Generate PDF preview
        handleGeneratePreview();
      }

      setCurrentStep(currentStep + 1);
    }
  };

  const handleGeneratePreview = async () => {
    try {
      setIsSubmitting(true);

      // Use template ID from the selected form type
      const templateId = selectedForm === "withdrawal" ? 2 : 1;

      const response = await api.student.previewForm({
        form_template: templateId,
        form_data: formData
      });

      if (response && response.pdf_content) {
        setPreviewPdf(response.pdf_content);

        // store draft id for submission
        setFormData(prev => ({
          ...prev,
          draft_id: response.draft_id
        }))
      } else {
        throw new Error("Failed to generate PDF preview");
      }
    } catch (error) {
      pretty_log(`Error generating preview: ${error}`, "ERROR");
      showToast({ error: error.message || "Error generating preview" }, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForm = async () => {
    try {
      setIsSubmitting(true);

      // Submit form for approval
      const response = await api.student.submitForm({
        draft_id: formData.draft_id
      });

      showToast({ message: "Form submitted successfully" }, "success");
      onClose();
    } catch (error) {
      pretty_log(`Error submitting form: ${error}`, "ERROR");
      showToast({ error: error.message || "Error submitting form" }, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different content based on current step
  const renderStepContent = () => {
    if (!template) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No form template selected.</p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{template.name}</DialogTitle>
              <DialogDescription>
                {template.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {template.field_schema.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === "text" && (
                    <Input
                      id={field.name}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  )}
                  {field.type === "email" && (
                    <Input
                      id={field.name}
                      type="email"
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  )}
                  {field.type === "radio" && (
                    <RadioGroup
                      value={formData[field.name] || ""}
                      onValueChange={(value) => handleInputChange(field.name, value)}
                    >
                      {field.options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${field.name}-${option}`} />
                          <Label htmlFor={`${field.name}-${option}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {field.type === "textarea" && (
                    <textarea
                      id={field.name}
                      className="w-full min-h-[100px] p-2 border rounded"
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  )}
                  {field.type === "file" && (
                    <Input
                      id={field.name}
                      type="file"
                      onChange={handleFileChange}
                    />
                  )}
                  {field.type === "checkboxGroup" && (
                    <div className="space-y-2">
                      {field.subfields.map((subfield) => (
                        <div key={subfield.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={subfield.name}
                            checked={formData.initials[subfield.name] || false}
                            onCheckedChange={(checked) => handleCheckboxChange(subfield.name, checked)}
                          />
                          <Label htmlFor={subfield.name}>{subfield.label}</Label>
                          {formData.initials[subfield.name] && (
                            <Input
                              className="ml-2"
                              value={formData.initialsText[subfield.name] || ""}
                              onChange={(e) => handleInitialsChange(subfield.name, e.target.value)}
                              placeholder="Initials"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Preview Form</DialogTitle>
              <DialogDescription>
                Review your form before submitting
              </DialogDescription>
            </DialogHeader>

            {previewPdf && (
              <div className="w-full h-[600px]">
                <iframe
                  src={`data:application/pdf;base64,${previewPdf}`}
                  className="w-full h-full"
                  title="Form Preview"
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        {renderStepContent()}
        <DialogFooter>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevStep}>
              Back
            </Button>
          )}
          {currentStep < 3 ? (
            <Button onClick={handleNextStep} disabled={isSubmitting}>
              {isSubmitting ? "Generating Preview..." : "Next"}
            </Button>
          ) : (
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Form"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormSubmissionDialog;
