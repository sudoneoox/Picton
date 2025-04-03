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
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({
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
    },
    petition_purpose: "",
    petition_explanation: "",
    supporting_document: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [error, setError] = useState(null);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedForm(null);
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
        },
        petition_purpose: "",
        petition_explanation: "",
        supporting_document: null,
      });
      setPreviewPdf(null);
    }
  }, [isOpen]);

  // If no template is provided, close the dialog
  React.useEffect(() => {
    if (!template) {
      onClose();
    }
  }, [template, onClose]);

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
      }));
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
    if (currentStep < 2) {
      // Validate current step
      if (!template?.type) {
        showToast({ error: "Form type not specified" }, "error");
        return;
      }

      if (currentStep === 1) {
        // Validate step 1 required fields for term withdrawal
        if (template.type === "withdrawal") {
          const requiredFields = ['first_name', 'last_name', "student_id", "phone_number", "email", "program_plan", "academic_career", "season"];
          const missingFields = requiredFields.filter(field => !formData[field]);

          if (missingFields.length > 0) {
            showToast({ error: "Please fill in all required fields" }, "error");
            return;
          }
        }

        // Validate required fields for graduate petition
        if (template.type === "graduate") {
          const requiredFields = ['first_name', 'last_name', 'student_id', 'phone_number', 'email', 'program_plan', 'academic_career', 'season', 'petition_purpose'];
          const missingFields = requiredFields.filter(field => !formData[field]);

          if (missingFields.length > 0) {
            showToast({ error: "Please fill in all required fields" }, "error");
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

      // Structure the data as expected by the backend
      const requestData = {
        form_template: {
          form_template: template.id,
          form_data: formData
        }
      };

      const response = await api.student.previewForm(requestData);

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

  const handleSubmitForm = async (e) => {
    e.preventDefault(); // Prevent default form submission
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
    switch (currentStep) {
      case 1:
        // Start directly with form filling based on template type
        return template?.type === "withdrawal" ? (
          // Term withdrawal form
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>Term Withdrawal Form</DialogTitle>
              <DialogDescription>
                For students withdrawing from all courses in the current term
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              {/* Name Fields */}
              <div>
                <Label htmlFor="first_name">First Name<span className="text-red-500">*</span></Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="last_name">Last Name<span className="text-red-500">*</span></Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => handleInputChange("middle_name", e.target.value)}
                  placeholder="Enter your middle name (optional)"
                />
              </div>

              <div>
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
                <Label htmlFor="email">School Email<span className="text-red-500">*</span></Label>
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
                  className="flex gap-2 mt-2"
                >
                  <Button
                    type="button"
                    variant={formData.academic_career === "undergraduate" ? "default" : "outline"}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("academic_career", "undergraduate")}
                  >
                    Undergraduate
                  </Button>
                  <Button
                    type="button"
                    variant={formData.academic_career === "graduate" ? "default" : "outline"}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("academic_career", "graduate")}
                  >
                    Graduate
                  </Button>
                  <Button
                    type="button"
                    variant={formData.academic_career === "law" ? "default" : "outline"}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("academic_career", "law")}
                  >
                    Law
                  </Button>
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
                  className="flex space-x-4 mt-2"
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
                          value={formData.initialsText.graduate_professional}
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
                          value={formData.initialsText.doctoral_student}
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
                          value={formData.initialsText.student_housing}
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
                        pay outstanding charges stemming from my purchase of a UH Dining Services meal plan
                      </p>
                      {formData.initials.dining_services && (
                        <Input
                          placeholder="Enter your initials"
                          className="w-40 mt-1"
                          value={formData.initialsText.dining_services}
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
                          value={formData.initialsText.parking_transportation}
                          onChange={(e) => handleInitialsChange("parking_transportation", e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleNextStep} disabled={isSubmitting}>
                {isSubmitting ? "Generating Preview..." : "Preview Form"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Graduate petition form
          <div className="flex flex-col space-y-4">
            <DialogHeader>
              <DialogTitle>Graduate Petition Form</DialogTitle>
              <DialogDescription>
                For graduate students requesting exceptions to university policies
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              {/* Name Fields */}
              <div>
                <Label htmlFor="first_name">First Name<span className="text-red-500">*</span></Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="last_name">Last Name<span className="text-red-500">*</span></Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => handleInputChange("middle_name", e.target.value)}
                  placeholder="Enter your middle name (optional)"
                />
              </div>

              <div>
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
                <Label htmlFor="email">School Email<span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              {/* Academic Information */}
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
                  className="flex gap-2 mt-2"
                >
                  <Button
                    type="button"
                    variant={formData.academic_career === "undergraduate" ? "default" : "outline"}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("academic_career", "undergraduate")}
                  >
                    Undergraduate
                  </Button>
                  <Button
                    type="button"
                    variant={formData.academic_career === "graduate" ? "default" : "outline"}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("academic_career", "graduate")}
                  >
                    Graduate
                  </Button>
                  <Button
                    type="button"
                    variant={formData.academic_career === "law" ? "default" : "outline"}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("academic_career", "law")}
                  >
                    Law
                  </Button>
                </RadioGroup>
              </div>

              {/* Petition Details */}
              <div className="md:col-span-2">
                <Label>Petition Effective<span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <Label htmlFor="year">Year<span className="text-red-500">*</span></Label>
                    <Input
                      id="year"
                      value={formData.year}
                      onChange={(e) => handleInputChange("year", e.target.value)}
                      placeholder="YYYY"
                      className="w-24"
                    />
                  </div>

                  <RadioGroup
                    value={formData.season}
                    onValueChange={(value) => handleInputChange("season", value)}
                    className="flex gap-2 items-end"
                  >
                    <Button
                      type="button"
                      variant={formData.season === "Fall" ? "default" : "outline"}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      onClick={() => handleInputChange("season", "Fall")}
                    >
                      Fall
                    </Button>
                    <Button
                      type="button"
                      variant={formData.season === "Spring" ? "default" : "outline"}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      onClick={() => handleInputChange("season", "Spring")}
                    >
                      Spring
                    </Button>
                    <Button
                      type="button"
                      variant={formData.season === "Summer" ? "default" : "outline"}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      onClick={() => handleInputChange("season", "Summer")}
                    >
                      Summer
                    </Button>
                  </RadioGroup>
                </div>
              </div>

              {/* Purpose of Petition */}
              <div className="md:col-span-2 mt-4">
                <Label>Purpose of Petition<span className="text-red-500">*</span></Label>
                <RadioGroup
                  value={formData.petition_purpose}
                  onValueChange={(value) => handleInputChange("petition_purpose", value)}
                  className="grid gap-2 mt-2"
                >
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "update_program_status" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "update_program_status")}
                  >
                    Update program status/action (term activate, discontinue, etc)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "admission_status_change" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "admission_status_change")}
                  >
                    Admission status change (conditional, unconditional)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "add_concurrent_degree" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "add_concurrent_degree")}
                  >
                    Add new concurrent degree or certificate (career/program/plan)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "change_degree_objective" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "change_degree_objective")}
                  >
                    Change current degree objective (program/plan)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "degree_requirements_exception" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "degree_requirements_exception")}
                  >
                    Degree requirements exception or approved course substitution
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "leave_of_absence" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "leave_of_absence")}
                  >
                    Leave of absence (include specific term)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "reinstate_discontinued" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "reinstate_discontinued")}
                  >
                    Reinstate to discontinued career (provide explanation)
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "request_to_graduate" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "request_to_graduate")}
                  >
                    Request to apply to graduate after the late filing period deadline
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "change_admin_term" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "change_admin_term")}
                  >
                    Change admin term
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "early_submission" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "early_submission")}
                  >
                    Early submission of thesis/dissertation
                  </Button>
                  <Button
                    type="button"
                    variant={formData.petition_purpose === "other" ? "default" : "outline"}
                    className="justify-start data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    onClick={() => handleInputChange("petition_purpose", "other")}
                  >
                    Other (explain below)
                  </Button>
                </RadioGroup>
              </div>

              {/* Explanation */}
              <div className="md:col-span-2 mt-2">
                <Label htmlFor="petition_explanation">
                  Explanation of Request
                  {formData.petition_purpose === "other" && <span className="text-red-500">*</span>}
                </Label>
                <textarea
                  id="petition_explanation"
                  value={formData.petition_explanation}
                  onChange={(e) => handleInputChange("petition_explanation", e.target.value)}
                  placeholder="Provide details about your request"
                  className="w-full min-h-[100px] p-2 border rounded mt-1"
                />
              </div>

              {/* Supporting Documents */}
              <div className="md:col-span-2">
                <Label htmlFor="supporting_document">Supporting Documents (optional)</Label>
                <Input
                  id="supporting_document"
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload any relevant supporting documentation for your petition
                </p>
              </div>

              {/* Date automatically generated */}
              <div className="md:col-span-2 mt-2">
                <p className="text-sm">
                  Form Date: <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Your signature will be automatically added from your account
                </p>
              </div>
            </div>

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

            <div className="py-4 h-[60vh] overflow-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
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
