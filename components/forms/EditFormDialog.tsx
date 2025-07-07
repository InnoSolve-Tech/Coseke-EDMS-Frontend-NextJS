"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/core/hooks/use-toast";
import { Form, FormField } from "@/lib/types/forms";
import { PlusIcon, TrashIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface EditFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Form) => void;
  initialData?: Form;
}

const fieldTypes = [
  "text",
  "number",
  "select",
  "checkbox",
  "radio",
  "date",
  "textarea",
  "file",
] as const;

// Default empty form state
const defaultFormState: Form = {
  name: "",
  description: "",
  formFields: [],
};

const validateFormFields = (fields: FormField[]): string | null => {
  const fieldNames = new Set();
  for (const field of fields) {
    if (fieldNames.has(field.name)) {
      return `Duplicate field name: ${field.name}`;
    }
    fieldNames.add(field.name);
  }
  return null;
};

export function EditFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EditFormDialogProps) {
  // Initialize with defaultFormState
  const [formData, setFormData] = useState<Form>(defaultFormState);
  const [newSelectOption, setNewSelectOption] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        formFields: initialData.formFields || [],
      });
    } else {
      setFormData(defaultFormState);
    }
  }, [initialData, isOpen]);

  // Rest of the component remains the same...
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldChange = (fieldId: string, updates: Partial<FormField>) => {
    setFormData((prev) => ({
      ...prev,
      formFields: prev.formFields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field,
      ),
    }));
  };

  const handleAddSelectOption = (fieldId: string) => {
    const optionToAdd = newSelectOption[fieldId];
    if (optionToAdd) {
      setFormData((prev) => ({
        ...prev,
        formFields: prev.formFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                selectOptions: [
                  ...(field.selectOptions || []),
                  {
                    label: optionToAdd,
                    value: optionToAdd.toLowerCase().replace(/\s+/g, "-"),
                  },
                ],
              }
            : field,
        ),
      }));

      setNewSelectOption((prev) => ({ ...prev, [fieldId]: "" }));
    }
  };

  const handleRemoveSelectOption = (fieldId: string, optionValue: string) => {
    setFormData((prev) => ({
      ...prev,
      formFields: prev.formFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              selectOptions: (field.selectOptions || []).filter(
                (option) => option.value !== optionValue,
              ),
            }
          : field,
      ),
    }));
  };

  const handleAddField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `Field ${formData.formFields.length + 1}`,
      type: "text",
    };
    setFormData((prev) => ({
      ...prev,
      formFields: [...prev.formFields, newField],
    }));
  };

  const handleRemoveField = (fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      formFields: prev.formFields.filter((field) => field.id !== fieldId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateFormFields(formData.formFields);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] bg-white bg-opacity-100">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Form" : "Create Form"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Fields</Label>
              <div className="col-span-3 space-y-4">
                {formData.formFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={field.name}
                        onChange={(e) =>
                          handleFieldChange(field.id, { name: e.target.value })
                        }
                        className="w-[120px]"
                      />
                      <Select
                        value={field.type.toLowerCase()}
                        onValueChange={(value) =>
                          handleFieldChange(field.id, {
                            type: value as (typeof fieldTypes)[number],
                          })
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white bg-opacity-100">
                          {fieldTypes.map((type) => (
                            <SelectItem
                              key={type.toLowerCase()}
                              value={type.toLowerCase()}
                            >
                              {type.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    {field.type.toLowerCase() === "select" && (
                      <div className="pl-4 border-l-2 border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            value={newSelectOption[field.id] || ""}
                            onChange={(e) =>
                              setNewSelectOption((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }))
                            }
                            placeholder="Add option"
                            className="w-[180px]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSelectOption(field.id)}
                          >
                            Add Option
                          </Button>
                        </div>
                        {field.selectOptions &&
                          field.selectOptions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.selectOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1"
                                >
                                  <span>{option.label}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleRemoveSelectOption(
                                        field.id,
                                        option.value,
                                      )
                                    }
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddField}
                >
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
