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
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";

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

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface DecisionFormProps {
  conditions: Condition[];
  fields: FormField[];
  onUpdate: (conditions: Condition[]) => void;
}

export function DecisionForm({
  conditions,
  fields,
  onUpdate,
}: DecisionFormProps) {
  const addCondition = () => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}`,
      field: "",
      operator: "equals",
      value: "",
    };
    onUpdate([...conditions, newCondition]);
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const updatedConditions = conditions.map((condition, i) =>
      i === index ? { ...condition, ...updates } : condition,
    );
    onUpdate(updatedConditions);
  };

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index);
    onUpdate(updatedConditions);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Decision Conditions</h3>
      {conditions.map((condition, index) => (
        <div key={condition.id} className="space-y-2 p-4 border rounded-md">
          <div className="flex items-center justify-between">
            <Label>Condition {index + 1}</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeCondition(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={condition.field}
            onValueChange={(value) => updateCondition(index, { field: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={condition.operator}
            onValueChange={(value) =>
              updateCondition(index, { operator: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">Equals</SelectItem>
              <SelectItem value="not_equals">Not Equals</SelectItem>
              <SelectItem value="greater_than">Greater Than</SelectItem>
              <SelectItem value="less_than">Less Than</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={condition.value}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            placeholder="Enter value"
          />
        </div>
      ))}
      <Button onClick={addCondition} className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Condition
      </Button>
    </div>
  );
}

interface ParallelBranch {
  id: string;
  name: string;
}

interface ParallelFormProps {
  branches: ParallelBranch[];
  onUpdate: (branches: ParallelBranch[]) => void;
}

export function ParallelForm({ branches, onUpdate }: ParallelFormProps) {
  const addBranch = () => {
    const newBranch: ParallelBranch = {
      id: `branch-${Date.now()}`,
      name: `Branch ${branches.length + 1}`,
    };
    onUpdate([...branches, newBranch]);
  };

  const updateBranch = (index: number, name: string) => {
    const updatedBranches = branches.map((branch, i) =>
      i === index ? { ...branch, name } : branch,
    );
    onUpdate(updatedBranches);
  };

  const removeBranch = (index: number) => {
    const updatedBranches = branches.filter((_, i) => i !== index);
    onUpdate(updatedBranches);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Parallel Branches</h3>
      {branches.map((branch, index) => (
        <div key={branch.id} className="flex items-center space-x-2">
          <Input
            value={branch.name}
            onChange={(e) => updateBranch(index, e.target.value)}
            placeholder="Enter branch name"
          />
          <Button variant="ghost" size="sm" onClick={() => removeBranch(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button onClick={addBranch} className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Branch
      </Button>
    </div>
  );
}
