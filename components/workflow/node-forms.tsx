"use client";

import { useState } from "react";
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
import { PlusCircle, Trash2 } from "lucide-react";
import { FormFieldValue } from "@/lib/types/formRecords";

interface FormField {
  id: string;
  label: string;
  type: string;
  options?: string[];
}

interface NodeFormProps {
  fields: FormField[];
  onUpdate: (fields: FormField[]) => void;
}

export function TaskForm({ fields, onUpdate }: NodeFormProps) {
  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: "",
      type: "text",
    };
    onUpdate([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field,
    );
    onUpdate(updatedFields);
  };

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onUpdate(updatedFields);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Task Form Fields</h3>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 p-4 border rounded-md">
          <div className="flex items-center justify-between">
            <Label>Field Label</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeField(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input
            value={field.label}
            onChange={(e) => updateField(index, { label: e.target.value })}
            placeholder="Enter field label"
          />
          <Label>Field Type</Label>
          <Select
            value={field.type}
            onValueChange={(value) => updateField(index, { type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="select">Select</SelectItem>
            </SelectContent>
          </Select>
          {field.type === "select" && (
            <div className="space-y-2">
              <Label>Options (comma-separated)</Label>
              <Input
                value={field.options?.join(", ") || ""}
                onChange={(e) =>
                  updateField(index, {
                    options: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                placeholder="Enter options"
              />
            </div>
          )}
        </div>
      ))}
      <Button onClick={addField} className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Field
      </Button>
    </div>
  );
}
