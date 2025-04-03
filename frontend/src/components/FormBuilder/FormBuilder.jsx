/**
 * FormBuilder - A visual interface for creating and editing form field schemas
 * Allows admins to define form fields with various types and configurations
 * that will be used to generate both the form interface and LaTeX template mappings
 */
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from 'lucide-react';

// Available field types for form creation
// Each type maps to a specific form input component
const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'select', label: 'Dropdown' }
];

/**
 * FormBuilder Component
 * @param {Object} props
 * @param {string} props.value - JSON string containing the current form schema
 * @param {Function} props.onChange - Callback function when form schema changes
 */
const FormBuilder = ({ value, onChange }) => {
  // Parse the current value into fields
  const fields = React.useMemo(() => {
    try {
      if (!value) return [];
      const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
      return parsedValue?.fields || [];
    } catch (error) {
      console.error('Error parsing form schema:', error);
      return [];
    }
  }, [value]);

  const handleAddField = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newField = {
      name: `field_${fields.length + 1}`,
      type: 'text',
      label: `Field ${fields.length + 1}`,
      required: true,
    };
    
    const newFields = [...fields, newField];
    const schema = { fields: newFields };
    onChange(JSON.stringify(schema, null, 2));
  };

  const handleUpdateField = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    const schema = { fields: newFields };
    onChange(JSON.stringify(schema, null, 2));
  };

  const handleRemoveField = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const newFields = fields.filter((_, i) => i !== index);
    const schema = { fields: newFields };
    onChange(JSON.stringify(schema, null, 2));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Form Fields</h3>
        <Button 
          type="button"
          onClick={handleAddField}
          variant="outline"
        >
          Add Field
        </Button>
      </div>
      
      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={`field-${index}`} className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Field Name</Label>
                <Input
                  type="text"
                  value={field.name || ''}
                  onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                />
              </div>
              <div>
                <Label>Field Type</Label>
                <select
                  value={field.type || 'text'}
                  onChange={(e) => handleUpdateField(index, { type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {FIELD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Display Label</Label>
                <Input
                  type="text"
                  value={field.label || ''}
                  onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                  id={`required-${index}`}
                />
                <Label htmlFor={`required-${index}`}>Required</Label>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => handleRemoveField(index, e)}
                  className="ml-auto"
                >
                  Remove
                </Button>
              </div>
              {(field.type === 'select' || field.type === 'radio') && (
                <div className="col-span-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    type="text"
                    value={field.options?.join(', ') || ''}
                    onChange={(e) => handleUpdateField(index, { 
                      options: e.target.value.split(',').map(opt => opt.trim()) 
                    })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FormBuilder; 