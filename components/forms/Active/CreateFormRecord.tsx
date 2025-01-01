"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Form, FieldType, FormField } from "@/lib/types/forms";
import { getAllForms } from "@/core/forms/api";
import { getCurrentUser } from "@/components/helpers";
import { createFormRecord } from "@/core/formrecords/api";
import { FormRecord } from "@/lib/types/formRecords";

export default function CreateFormRecord() {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await getAllForms();
        setForms(response);
      } catch (error) {
        console.error("Error fetching forms:", error);
        toast({
          title: "Error",
          description: "Failed to fetch forms. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchForms();
  }, []);

  const handleFormSelect = (formId: string) => {
    const form = forms.find((f) => f.id === parseInt(formId));
    setSelectedForm(form || null);
    setFormValues({});
  };

  const handleInputChange = (fieldId: number, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    let user = getCurrentUser();

    setIsSubmitting(true);
    const formFieldValues = Object.entries(formValues).map(
      ([fieldId, value]) => ({
        formField: { id: fieldId } as FormField,
        value,
      }),
    );
    try {
      console.log("records:", {
        form: selectedForm,
        formFieldValues,
        userId: user.id,
        createdBy: user.id! as string,
        createdDate: new Date().toISOString(),
      } as FormRecord);
      const response = await createFormRecord({
        form: selectedForm!,
        formFieldValues: formFieldValues,
        userId: user.id! as number,
        createdBy: user.id! as string,
        createdDate: new Date().toISOString(),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Form record created successfully!",
        });
        setFormValues({});
        setSelectedForm(null);
      } else {
        throw new Error("Failed to create form record");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to create form record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create Form Record</CardTitle>
        <CardDescription>
          Fill out the form below to create a new record
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="formSelect"
              className="text-sm font-medium text-gray-700"
            >
              Select a Form
            </Label>
            <Select onValueChange={handleFormSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent className="bg-white bg-opacity-100">
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id!.toString()}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedForm && (
            <div className="space-y-6">
              {selectedForm.formFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label
                    htmlFor={`field-${field.id}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    {field.name}
                  </Label>
                  {field.type.toLowerCase() === "select" ? (
                    <Select
                      onValueChange={(value) =>
                        handleInputChange(parseInt(field.id), value)
                      }
                      value={formValues[field.id] || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${field.name}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white bg-opacity-100">
                        {field.selectOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`field-${field.id}`}
                      type={field.type.toLowerCase()}
                      value={formValues[field.id] || ""}
                      onChange={(e) =>
                        handleInputChange(parseInt(field.id), e.target.value)
                      }
                      required
                      className="w-full"
                    />
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Form Record"}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
