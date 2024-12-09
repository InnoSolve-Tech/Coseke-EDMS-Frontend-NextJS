"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { FormField, NodeForm } from "@/lib/types/workflow";

interface NodeFormBuilderProps {
  form?: NodeForm;
  onChange: (form: NodeForm) => void;
}

export function NodeFormBuilder({ form, onChange }: NodeFormBuilderProps) {
  const fields = form?.fields || [];

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
    };
    onChange({
      id: form?.id || `form-${Date.now()}`,
      fields: [...fields, newField],
    });
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange({ id: form?.id || `form-${Date.now()}`, fields: newFields });
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange({ id: form?.id || `form-${Date.now()}`, fields: newFields });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Form Fields</h3>
        <Button onClick={addField} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div className="space-y-4 flex-1">
                <div className="grid w-full gap-2">
                  <Label>Field Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      updateField(index, { label: e.target.value })
                    }
                  />
                </div>

                <div className="grid w-full gap-2">
                  <Label>Field Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value: FormField["type"]) =>
                      updateField(index, { type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      updateField(index, { required: checked })
                    }
                  />
                  <Label htmlFor={`required-${field.id}`}>Required</Label>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}