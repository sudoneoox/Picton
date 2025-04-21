import React, { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { pretty_log } from "@/api/common_util";
import { api } from "@/api/api.js";
import { useToast } from "@/components/ToastNotification";

const FormSubmissionDialog = ({ isOpen, onClose, template }) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState([]);
  const [previewPdf, setPreviewPdf] = useState(null);

  // Reset form when dialog opens/closes or template changes
  useEffect(() => {
    if (!isOpen || !template) {
      setCurrentStep(1);
      setPreviewPdf(null);
      return;
    }

    // Initialize form data based on template schema
    if (template && template.field_schema && template.field_schema.fields) {
      const initialData = {};

      // Process each field to set default values
      template.field_schema.fields.forEach(field => {
        if (field.type === 'checkboxGroup' && field.subfields) {
          // Initialize checkbox groups (like initials)
          initialData[field.name] = {};
          const textValues = {};

          field.subfields.forEach(subfield => {
            initialData[field.name][subfield.name] = false;
            textValues[subfield.name] = '';
          });

          // Add text values for checkbox groups if needed
          if (field.name === 'initials') {
            initialData['initialsText'] = textValues;
          }
        } else {
          // Set default value if provided, otherwise empty
          initialData[field.name] = field.defaultValue || "";
        }
      });


      // Add current year as default for year fields
      if ('year' in initialData && !initialData.year) {
        initialData.year = new Date().getFullYear().toString();
      }
      if ('withdrawal_year' in initialData && !initialData.withdrawal_year) {
        initialData.withdrawal_year = new Date().getFullYear().toString();
      }

      initialData.unit = "";
      setFormData(initialData);
    }

    const fetchUnits = async () => {
      try {
        const unitsData = await api.admin.getOrganizationalUnits();
        setUnits(unitsData.filter(unit => unit.is_active));
      } catch (error) {
        pretty_log(`Error fetching organizational units: ${error}`, "ERROR");
      }
    }
    fetchUnits()
  }, [isOpen, template]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (groupName, fieldName, checked) => {
    setFormData(prev => ({
      ...prev,
      [groupName]: {
        ...prev[groupName],
        [fieldName]: checked
      }
    }));
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

  const handleFileChange = (fieldName, e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: e.target.files[0]
      }));
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    // Validate required fields before proceeding
    if (!validateRequiredFields()) {
      showToast({ error: "Please fill in all required fields" }, "error");
      return;
    }

    // If we're on step 1, generate PDF preview
    if (currentStep === 1) {
      handleGeneratePreview();
    }

    setCurrentStep(currentStep + 1);
  };

  const validateRequiredFields = () => {
    // Skip validation if no template
    if (!template || !template.field_schema || !template.field_schema.fields) {
      return true;
    }

    // Check all required fields
    const requiredFields = template.field_schema.fields
      .filter(field => field.required)
      .map(field => field.name);

    // Check if any required fields are missing
    const missingFields = requiredFields.filter(field => !formData[field]);

    // Additional validation for special cases
    if (formData.petition_purpose === "other" && !formData.petition_explanation) {
      showToast({ error: "Please provide an explanation for your petition" }, "error");
      return false;
    }

    if (!formData.unit) {
      showToast({ error: 'Please select an organizational unit' }, 'error');
      return false;
    }

    return missingFields.length === 0;
  };

  const handleGeneratePreview = async () => {
    try {
      setIsSubmitting(true);

      // Validate form data type
      if (Array.isArray(formData)) {
        showToast(
          { error: "Internal error: form structure invalid. Please reload the page." },
          "error"
        );
        return;
      }

      // Structure data for API
      const requestData = {
        form_template: {
          form_template: template.id,
          form_data: formData
        }
      };

      const response = await api.student.previewForm(requestData);

      if (response && response.pdf_content) {
        setPreviewPdf(response.pdf_content);

        // Store draft ID for submission
        setFormData(prev => ({
          ...prev,
          draft_id: response.draft_id
        }));
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

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (!formData.draft_id) {
        showToast({ error: "Missing draft ID, please try generating preview again" }, "error");
        return;
      }

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


  const renderUnitSelection = () => {
    return (
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <Label htmlFor="unit-selection">
            Organizational Unit
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.unit?.toString() || ""}
            onValueChange={(value) => setFormData({
              ...formData,
              unit: value ? parseInt(value) : ""
            })}
          >
            <SelectTrigger id="unit-selection" className="w-full">
              <SelectValue placeholder="Select the organizational unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id.toString()}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Select the organizational unit this form is being submitted to
          </p>
        </div>
      </div>
    );
  };

  // Render form fields dynamically based on schema
  const renderFormFields = () => {
    if (!template || !template.field_schema || !template.field_schema.fields) {
      return <p>No form schema available</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
        {template.field_schema.fields.map((field, index) => {
          // Skip hidden fields
          if (field.type === 'hidden') return null;

          // Determine column span
          const colSpan = field.fullWidth ? "md:col-span-2" : "";

          return (
            <div key={field.name} className={colSpan}>
              {renderField(field)}
            </div>
          );
        })}
      </div>
    );
  };

  // Render individual field based on type
  const renderField = (field) => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </>
        );

      case 'textarea':
        return (
          <>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              className="w-full min-h-[100px] p-2 border rounded mt-1"
              required={field.required}
            />
          </>
        );

      case 'radio':
        return (
          <>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={formData[field.name] || ''}
              onValueChange={(value) => handleInputChange(field.name, value)}
              className="flex flex-wrap gap-2 mt-2"
            >
              {field.options.map((option) => {
                // Handle both string options and object options
                const value = typeof option === 'object' ? option.value : option;
                const label = typeof option === 'object' ? option.label : option;

                return (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={`${field.name}_${value}`} />
                    <Label htmlFor={`${field.name}_${value}`}>{label}</Label>
                  </div>
                );
              })}
            </RadioGroup>
          </>
        );

      case 'checkboxGroup':
        return (
          <>
            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium mb-2">{field.label}</h3>
              <div className="space-y-4">
                {field.subfields.map((subfield) => (
                  <div key={subfield.name} className="flex space-x-2">
                    <Checkbox
                      id={subfield.name}
                      checked={formData[field.name]?.[subfield.name] || false}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(field.name, subfield.name, checked)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={subfield.name}
                        className="text-sm font-medium leading-none"
                      >
                        {subfield.label}
                      </Label>
                      {/* Display text field if checkbox is checked and this is initials field */}
                      {formData[field.name]?.[subfield.name] && field.name === 'initials' && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText?.[subfield.name] || ''}
                          onChange={(e) => handleInitialsChange(subfield.name, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'file':
        return (
          <>
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.name}
              type="file"
              onChange={(e) => handleFileChange(field.name, e)}
              className="mt-1"
              required={field.required}
            />
            {field.description && (
              <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
            )}
          </>
        );

      default:
        return (
          <p>Unsupported field type: {field.type}</p>
        );
    }
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>{template?.name || "Form"}</DialogTitle>
              <DialogDescription>
                {template?.description || "Please fill out the form"}
              </DialogDescription>
            </DialogHeader>

            {renderUnitSelection()}
            {renderFormFields()}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleNextStep} disabled={isSubmitting}>
                {isSubmitting ? "Generating Preview..." : "Preview Form"}
              </Button>
            </DialogFooter>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>Form Preview</DialogTitle>
              <DialogDescription>
                Review your form before submission
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 h-[60vh] overflow-hidden">
              {previewPdf ? (
                <iframe
                  src={`data:application/pdf;base64,${previewPdf}`}
                  className="w-full h-full border rounded"
                  title="Form Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full border rounded bg-gray-100">
                  <p>Loading preview...</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button onClick={handleSubmitForm} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </Button>
            </DialogFooter>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isSubmitting) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default FormSubmissionDialog;
