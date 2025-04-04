/**
 * FormSchemaManager - Admin interface for managing form templates
 * Handles creation, editing, and deletion of form templates including:
 * - Form field schema definition using visual builder
 * - LaTeX template upload and editing
 * - Template metadata (name, description, approvals)
 */
import React, { useState, useEffect } from "react";
import { api } from "@/api/api.js";
import { useToast } from "@/components/ToastNotification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormBuilder from "@/components/FormBuilder/FormBuilder";

const DEFAULT_FORM_DATA = {
  name: "",
  description: "",
  field_schema: JSON.stringify({ fields: [] }, null, 2),
  latex_template: "",
  required_approvals: 1,
};

const FormSchemaManager = () => {
  const { showToast } = useToast();
  
  // State management for templates and UI
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState("schema");
  
  // Form data state with default values
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Example schema for reference
  const exampleSchema = {
    fields: [
      {
        name: "first_name",
        type: "text",
        required: true,
        label: "First Name"
      },
      {
        name: "email",
        type: "email",
        required: true,
        label: "Email Address"
      },
      {
        name: "options",
        type: "radio",
        required: true,
        label: "Select Option",
        options: ["Option 1", "Option 2"]
      }
    ]
  };

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  /**
   * Fetch all form templates from the API
   * Updates templates state and handles loading/error states
   */
  const fetchTemplates = async () => {
    try {
      const response = await api.admin.getFormTemplates();
      setTemplates(response);
    } catch (error) {
      showToast({ error: "Failed to fetch form templates" }, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission for creating/updating templates
   * Validates schema format and LaTeX template field usage
   */
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    // Don't submit if loading
    if (loading) return;
    
    setLoading(true);

    try {
      // Parse and validate JSON schema
      let fieldSchema;
      try {
        fieldSchema = JSON.parse(formData.field_schema);
      } catch (error) {
        showToast({ error: "Invalid JSON schema format" }, "error");
        setLoading(false);
        return;
      }

      // Validate LaTeX template field usage
      const fieldNames = fieldSchema.fields.map(field => field.name);
      if (formData.latex_template) {
        const missingFields = fieldNames.filter(name => 
          !formData.latex_template.includes(`$${name}$`)
        );
        
        if (missingFields.length > 0) {
          showToast({ 
            error: `Warning: Some fields are not used in the LaTeX template: ${missingFields.join(', ')}` 
          }, "warning");
        }
      }

      const data = {
        ...formData,
        field_schema: fieldSchema,
      };

      // Create or update template based on editingTemplate state
      if (editingTemplate) {
        await api.admin.updateFormTemplate(editingTemplate.id, data);
        showToast({ message: "Form template updated successfully" }, "success");
      } else {
        await api.admin.createFormTemplate(data);
        showToast({ message: "Form template created successfully" }, "success");
      }

      // Reset form state and refresh templates
      resetForm();
      fetchTemplates();
      // Close the dialog after successful creation/update
      setDialogOpen(false);
    } catch (error) {
      showToast({ error: "Failed to save form template" }, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load template data into form for editing
   * Ensures proper schema format for FormBuilder
   */
  const handleEdit = (template) => {
    setEditingTemplate(template);
    
    let schemaObj;
    try {
      if (typeof template.field_schema === 'string') {
        schemaObj = JSON.parse(template.field_schema);
      } else {
        schemaObj = template.field_schema;
      }
      
      // Ensure schema has fields property
      if (!schemaObj.fields && Array.isArray(schemaObj)) {
        schemaObj = { fields: schemaObj };
      } else if (!schemaObj.fields) {
        schemaObj = { fields: [] };
      }
      
      setFormData({
        name: template.name,
        description: template.description,
        field_schema: JSON.stringify(schemaObj, null, 2),
        latex_template: template.latex_template || "",
        required_approvals: template.required_approvals,
      });
    } catch (error) {
      console.error('Error parsing field schema:', error);
      setFormData({
        name: template.name,
        description: template.description,
        field_schema: JSON.stringify({ fields: [] }, null, 2),
        latex_template: template.latex_template || "",
        required_approvals: template.required_approvals,
      });
    }
    
    setActiveTab("schema");
    setDialogOpen(true);
  };

  /**
   * Delete template with confirmation
   */
  const handleDelete = async (template) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return;
    }

    setLoading(true);
    try {
      await api.admin.deleteFormTemplate(template.id);
      showToast({ message: "Form template deleted successfully" }, "success");
      fetchTemplates();
    } catch (error) {
      showToast({ error: "Failed to delete form template" }, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle LaTeX template file upload
   * Validates file type and reads content
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.tex')) {
      showToast({ error: "Please upload a .tex file" }, "error");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          latex_template: event.target.result
        });
      };
      reader.readAsText(file);
    } catch (error) {
      showToast({ error: "Failed to read the LaTeX file" }, "error");
    }
  };

  /**
   * Handle PDF file upload for LaTeX conversion
   * Sends PDF to backend for processing and receives LaTeX template
   */
  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      showToast({ error: "Please upload a PDF file" }, "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf_file', file);

      const response = await api.admin.convertPDFToLaTeX(formData);
      if (response.latex_template) {
        setFormData(prev => ({
          ...prev,
          latex_template: response.latex_template
        }));
        showToast({ message: "PDF converted to LaTeX successfully" }, "success");
      }
    } catch (error) {
      showToast({ error: "Failed to convert PDF to LaTeX" }, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate PDF preview from current LaTeX template
   */
  const handlePreviewPDF = async () => {
    if (!formData.latex_template) {
      showToast({ error: "Please add LaTeX template content first" }, "error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.admin.previewLaTeXTemplate({
        latex_template: formData.latex_template,
        field_schema: JSON.parse(formData.field_schema)
      });

      // Open PDF in new window or download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      showToast({ error: "Failed to generate PDF preview" }, "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset form to default state
  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingTemplate(null);
    setActiveTab("schema");
  };

  // Handle dialog open/close
  const handleDialogChange = (open) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Form Templates</CardTitle>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          Add New Template
        </Button>
      </CardHeader>
      <CardContent>
        {/* Loading state or templates table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Required Approvals</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id || `template-${template.name}`}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>{template.required_approvals}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEdit(template)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Template Edit/Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Form Template" : "Add New Form Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? "Modify the form template details, schema, and LaTeX template."
                  : "Create a new form template by defining its fields and LaTeX template."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Only submit if the submit button was clicked
              if (e.nativeEvent.submitter?.type === 'submit') {
                handleSubmit(e);
              }
            }} className="mt-4">
              <div className="grid gap-6">
                {/* Template metadata fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="required_approvals">Required Approvals</Label>
                    <Input
                      id="required_approvals"
                      type="number"
                      min="1"
                      value={formData.required_approvals}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          required_approvals: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Form Schema and LaTeX Template tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="schema">Form Schema</TabsTrigger>
                    <TabsTrigger value="latex">LaTeX Template</TabsTrigger>
                  </TabsList>
                  <TabsContent value="schema" className="mt-4">
                    <FormBuilder
                      value={formData.field_schema}
                      onChange={(schema) =>
                        setFormData({
                          ...formData,
                          field_schema: schema,
                        })
                      }
                    />
                  </TabsContent>
                  <TabsContent value="latex" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="latex_file">Upload LaTeX Template</Label>
                          <Input
                            id="latex_file"
                            type="file"
                            accept=".tex"
                            onChange={handleFileUpload}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pdf_file">Upload PDF to Convert</Label>
                          <Input
                            id="pdf_file"
                            type="file"
                            accept=".pdf"
                            onChange={handlePDFUpload}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <Label htmlFor="latex_template">LaTeX Template Content</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePreviewPDF}
                            disabled={!formData.latex_template || loading}
                          >
                            {loading ? <Spinner className="mr-2" /> : null}
                            Preview PDF
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Use <code>$FIELD_NAME$</code> to insert form fields. Field names should match those defined in the Form Schema.
                        </div>
                        <Textarea
                          id="latex_template"
                          value={formData.latex_template}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              latex_template: e.target.value,
                            })
                          }
                          className="font-mono min-h-[200px] resize-y max-h-[400px] mt-2"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter className="mt-6 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner className="mr-2" /> : null}
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default FormSchemaManager; 