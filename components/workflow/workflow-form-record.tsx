"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFormRecord, getFormRecordById } from "@/core/formrecords/api";
import { getAllForms } from "@/core/forms/api";
import { useToast } from "@/hooks/use-toast";
import { FormRecord } from "@/lib/types/formRecords";
import { Form, FormField } from "@/lib/types/forms";
import { useEffect, useState } from "react";
import { getUserFromSessionStorage } from "../routes/sessionStorage";
import { WorkflowInstance } from "@/lib/types/workflowInstance";
import { updateWorkflowInstance } from "@/core/workflowInstance/api";

const WorkflowFormRecord = ({
  formId,
  formInstanceId,
  forms,
  currentStep,
  setForms,
  setSelectedForm,
  workflowInstance,
  selectedForm,
  formValues,
  setFormValues,
}: {
  formId?: string;
  formInstanceId?: string;
  forms: Form[];
  currentStep: string;
  setForms: (forms: Form[]) => void;
  selectedForm: Form | null;
  workflowInstance: WorkflowInstance;
  setSelectedForm: (form: Form | null) => void;
  formValues: Record<string, string>;
  setFormValues: (formValues: any) => void;
}) => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>();

  useEffect(() => {
    setUser(getUserFromSessionStorage());
  }, []);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await getAllForms();
        setForms(response);
        if (formId) {
          const form = response.find((f) => f.id === parseInt(formId));
          setSelectedForm(form || null);
        }
        if (formInstanceId) {
          const formInstance = await getFormRecordById(
            parseInt(formInstanceId),
          );
          if (formInstance && formInstance.formFieldValues) {
            const initialFormValues = formInstance.formFieldValues.reduce(
              (acc: Record<string, string>, fieldValue: any) => {
                acc[fieldValue.formField.id] = fieldValue.value;
                return acc;
              },
              {},
            );
            setFormValues(initialFormValues);
          }
        }
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
  }, [formId, toast]);

  const handleFormSelect = (selectedFormId: string) => {
    const form = forms.find((f) => f.id === parseInt(selectedFormId));
    setSelectedForm(form || null);
    setFormValues({});
  };

  const handleInputChange = (fieldId: number, value: string) => {
    setFormValues((prev: any) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    const formFieldValues = Object.entries(formValues).map(
      ([fieldId, value]) => ({
        formField: { id: fieldId } as FormField,
        value,
      }),
    );

    try {
      const response = await createFormRecord({
        form: selectedForm,
        formFieldValues: formFieldValues,
        userId: user.id as number,
        createdBy: user.id,
        createdDate: new Date().toISOString(),
      } as FormRecord);

      if (!workflowInstance.metadata) {
        workflowInstance.metadata = {};
      }

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
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="formSelect">Select a Form</Label>
          <Select
            onValueChange={handleFormSelect}
            value={selectedForm?.id?.toString() || ""}
            disabled={true}
          >
            <SelectTrigger id="formSelect" className="w-full">
              <SelectValue placeholder="Select a form" />
            </SelectTrigger>
            <SelectContent>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id!.toString()}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedForm && (
          <div className="space-y-4">
            {selectedForm.formFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
                {field.type.toLowerCase() === "select" ? (
                  <Select
                    onValueChange={(value) =>
                      handleInputChange(parseInt(field.id), value)
                    }
                    value={formValues[field.id] || ""}
                  >
                    <SelectTrigger id={`field-${field.id}`} className="w-full">
                      <SelectValue placeholder={`Select ${field.name}`} />
                    </SelectTrigger>
                    <SelectContent>
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
          </div>
        )}
      </form>
    </div>
  );
};

export default WorkflowFormRecord;
