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

const FormSubmissionDialog = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedForm(null);
      setFormData({
        first_name: "",
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

  const handleInitialsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      initialsText: {
        ...prev.initialsText,
        [field]: value
      }
    }));
  };

  const handleFormSelection = (formType) => {
    setSelectedForm(formType);
    setCurrentStep(2);
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
          const requiredFields = ["student_id", "phone_number", "email", "program_plan", "academic_career", "season"];
          const missingFields = requiredFields.filter(field => !formData[field]);

          if (missingFields.length > 0) {
            showToast({ error: "Please fill in all required fields" }, "error");
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

      // Determine form template ID based on selection (you would need to get actual IDs from your API)
      const templateId = selectedForm === "withdrawal" ? 2 : 1; // Assuming IDs from backend

      const response = await api.student.previewForm({
        form_template: templateId,
        form_data: formData
      });

      if (response && response.pdf_content) {
        setPreviewPdf(response.pdf_content);
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

      // Determine form template ID based on selection
      const templateId = selectedForm === "withdrawal" ? 2 : 1;

      // Submit form for approval
      const response = await api.student.submitForm({
        form_template: templateId,
        form_data: formData
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
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>Select Form Type</DialogTitle>
              <DialogDescription>
                Choose the type of form you want to submit
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-4">
              <Card
                className={`cursor-pointer border-2 ${selectedForm === "graduate" ? "border-blue-500" : "border-gray-200"}`}
                onClick={() => handleFormSelection("graduate")}
              >
                <CardHeader>
                  <CardTitle>Graduate Petition Form</CardTitle>
                  <CardDescription>
                    For graduate students requesting exceptions to university policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Use this form to request course exceptions, deadline extensions, or other graduate program adjustments
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 ${selectedForm === "withdrawal" ? "border-blue-500" : "border-gray-200"}`}
                onClick={() => handleFormSelection("withdrawal")}
              >
                <CardHeader>
                  <CardTitle>Term Withdrawal Form</CardTitle>
                  <CardDescription>
                    For students withdrawing from all courses in the current term
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    <strong>Please note:</strong> Term withdrawal means the student is dropping all courses in all sessions of the term and withdrawing from the university for the <strong>current term only</strong>.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    The general processing time for all Term Withdrawal Requests is 3-5 business days, however, the official term withdrawal date for the student will be the date that the request has been received by the Office of the University Registrar.
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleNextStep} disabled={!selectedForm}>Next</Button>
            </DialogFooter>
          </div>
        );

      case 2:
        return selectedForm === "withdrawal" ? (
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>Term Withdrawal Form</DialogTitle>
              <DialogDescription>
                Please fill out all required fields
              </DialogDescription>
            </DialogHeader>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">

              <div className="md:col-span-1">
                <Label htmlFor="first_name">First Name<span className="text-red-500">*</span></Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Enter your First Name"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <Label htmlFor="last_name">Last Name<span className="text-red-500">*</span></Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Enter your Last Name"
                  required
                />
              </div>


              <div className="md:col-span-2">
                <Label htmlFor="student_id">MyUH ID<span className="text-red-500">*</span></Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange("student_id", e.target.value)}
                  placeholder="Enter your student ID"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number<span className="text-red-500">*</span></Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  placeholder="(xxx) xxx-xxxx"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Student Email<span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="program_plan">Program Plan<span className="text-red-500">*</span></Label>
                <Input
                  id="program_plan"
                  value={formData.program_plan}
                  onChange={(e) => handleInputChange("program_plan", e.target.value)}
                  placeholder="Enter your program plan"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label>Academic Career<span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={formData.academic_career}
                  onValueChange={(value) => handleInputChange("academic_career", value)}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="undergraduate" id="undergraduate" />
                    <Label htmlFor="undergraduate">Undergraduate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="graduate" id="graduate" />
                    <Label htmlFor="graduate">Graduate</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="year">Withdrawal Year<span className="text-red-500">*</span></Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  placeholder="YYYY"
                />
              </div>

              <div>
                <Label>Withdrawal Term<span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={formData.season}
                  onValueChange={(value) => handleInputChange("season", value)}
                  className="flex space-x-1 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Fall" id="fall" />
                    <Label htmlFor="fall">Fall</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Spring" id="spring" />
                    <Label htmlFor="spring">Spring</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Summer" id="summer" />
                    <Label htmlFor="summer">Summer</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="font-medium mb-2">Initial all that apply:</h3>

                <div className="space-y-4">
                  {/* Financial Aid */}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="financial_aid"
                      checked={formData.initials.financial_aid}
                      onCheckedChange={(checked) => handleCheckboxChange("financial_aid", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="financial_aid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        STUDENTS RECEIVING FINANCIAL AID
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that if I withdrawal from ALL classes I may owe financial aid back to the university based on federal regulations.
                      </p>
                      {formData.initials.financial_aid && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.financial_aid}
                          onChange={(e) => handleInitialsChange("financial_aid", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* International Students */}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="international_student"
                      checked={formData.initials.international_student}
                      onCheckedChange={(checked) => handleCheckboxChange("international_student", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="international_student" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        INTERNATIONAL STUDENTS HOLDING F-1 OR J-1 STUDENT VISAS
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that federal regulations require me to obtain authorization for a reduced course load from the International Student and Scholar Services Office.
                      </p>
                      {formData.initials.international_student && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.international_student}
                          onChange={(e) => handleInitialsChange("international_student", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Student Athletes */}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="student_athlete"
                      checked={formData.initials.student_athlete}
                      onCheckedChange={(checked) => handleCheckboxChange("student_athlete", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="student_athlete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        STUDENT-ATHLETES
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that I must clear any financial holds related to student-athlete services and return all textbooks, uniforms, and equipment.
                      </p>
                      {formData.initials.student_athlete && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.student_athlete}
                          onChange={(e) => handleInitialsChange("student_athlete", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Veterans */}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="veterans"
                      checked={formData.initials.veterans}
                      onCheckedChange={(checked) => handleCheckboxChange("veterans", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="veterans" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        VETERANS
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that an official term withdrawal from the university will automatically initiate a recalculation of benefits reported to the VA.
                      </p>
                      {formData.initials.veterans && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.veterans}
                          onChange={(e) => handleInitialsChange("veterans", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Professional Students */}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="graduate_professional"
                      checked={formData.initials.graduate_professional}
                      onCheckedChange={(checked) => handleCheckboxChange("graduate_professional", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="graduate_professional" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        GRADUATE/PROFESSIONAL STUDENTS
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that any university support (i.e. graduate assignment, DSTF) will
                        be cancelled.
                      </p>
                      {formData.initials.graduate_professional && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.veterans}
                          onChange={(e) => handleInitialsChange("graduate_professional", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Doctoral Students */}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="doctoral_student"
                      checked={formData.initials.doctoral_student}
                      onCheckedChange={(checked) => handleCheckboxChange("doctoral_student", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="doctoral_student" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        DOCTORAL STUDENTS
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that I must file a leave of absence with the Office of Graduate and Professional
                        Studies
                      </p>
                      {formData.initials.doctoral_student && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.veterans}
                          onChange={(e) => handleInitialsChange("doctoral_student", e.target.value)}
                        />
                      )}
                    </div>
                  </div>


                  {/* Student Housing */}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="student_housing"
                      checked={formData.initials.student_housing}
                      onCheckedChange={(checked) => handleCheckboxChange("student_housing", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="student_housing" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        STUDENT HOUSING
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that my housing agreement outlines important information regarding housing
                        cancelation and refunds.
                      </p>
                      {formData.initials.student_housing && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.veterans}
                          onChange={(e) => handleInitialsChange("student_housing", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Dining Services*/}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="dining_services"
                      checked={formData.initials.dining_services}
                      onCheckedChange={(checked) => handleCheckboxChange("dining_services", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="dining_services" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        DINING SERVICES
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that withdrawing from the university does not automatically relieve me of my obligation to
                        pay outstanding charges stemming from my purchase of a UH Dining Services meal plan                      </p>
                      {formData.initials.dining_services && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.veterans}
                          onChange={(e) => handleInitialsChange("dining_services", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Parking Transportation*/}
                  <div className="flex space-x-2">
                    <Checkbox
                      id="parking_transportation"
                      checked={formData.initials.parking_transportation}
                      onCheckedChange={(checked) => handleCheckboxChange("parking_transportation", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="parking_transportation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        PARKING AND TRANSPORTATION
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I understand that withdrawing from the university does not relieve me of my
                        obligation to pay outstanding charges stemming from my purchase of a UH parking permit or parking citations received

                      </p>
                      {formData.initials.parking_transportation && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.veterans}
                          onChange={(e) => handleInitialsChange("parking_transportation", e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button onClick={handleNextStep} disabled={isSubmitting}>
                {isSubmitting ? "Generating Preview..." : "Preview Form"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>Graduate Petition Form</DialogTitle>
              <DialogDescription>
                This form is not yet implemented.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </div>
        );

      case 3:
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default FormSubmissionDialog;
