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
import {
  createFormRecord,
  getFormRecordById,
  updateFormRecord,
} from "@/core/formrecords/api";
import { getAllForms } from "@/core/forms/api";
import { useToast } from "@/hooks/use-toast";
import type { FormRecord } from "@/lib/types/formRecords";
import type { Form, FormField } from "@/lib/types/forms";
import type { WorkflowInstance } from "@/lib/types/workflowInstance";
import { useEffect, useState } from "react";
import { getUserFromSessionStorage } from "../routes/sessionStorage";

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
  const [comment, setComment] = useState<string>("");

  const getComment = (): string => {
    const nodes = workflowInstance.workflow?.nodes || [];

    // Separate forms and approvals in one pass
    const { forms, approvals } = nodes.reduce(
      (acc, node) => {
        if (node.type === "form") acc.forms.push(node);
        else if (node.type === "approval") acc.approvals.push(node);
        return acc;
      },
      { forms: [] as typeof nodes, approvals: [] as typeof nodes },
    );

    // Create a Set of form IDs for efficient lookup
    const formIds = new Set(forms.map((form) => form.data.formId));

    // Find the first approval with a matching formId
    const approvalIndex = approvals.find((approval) =>
      formIds.has(approval.data.formId),
    );

    // Debug output if metadata exists
    if (workflowInstance.metadata) {
      return workflowInstance.metadata[approvalIndex!.id];
    }

    return "";
  };

  useEffect(() => {
    setUser(getUserFromSessionStorage());
  }, []);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await getAllForms();
        setForms(response);
        if (formId) {
          const form = response.find((f) => f.id === Number.parseInt(formId));
          setSelectedForm(form || null);
        }
        if (formInstanceId) {
          const formInstance = await getFormRecordById(
            Number.parseInt(formInstanceId),
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
  }, [formId, formInstanceId, toast]);

  const handleFormSelect = (selectedFormId: string) => {
    const form = forms.find((f) => f.id === Number.parseInt(selectedFormId));
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
      if (formInstanceId) {
        const response = await updateFormRecord({
          id: Number.parseInt(formInstanceId),
          formFieldValues: formFieldValues,
        } as FormRecord);
        if (response.ok) {
          toast({
            title: "Success",
            description: "Form record updated successfully!",
          });
          setFormValues({});
          setSelectedForm(null);
        } else {
          throw new Error("Failed to create form record");
        }
      } else {
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

  useEffect(() => {
    const comt = getComment();
    setComment(comt);
  }, [workflowInstance]);

  return (
    <div className="h-[400px] w-full max-w-3xl overflow-y-auto p-4">
      <div>
        {comment && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md w-full mb-4">
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Comment:
            </h3>
            <p className="text-red-600">{comment}</p>
          </div>
        )}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedForm.formFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
                {field.type.toLowerCase() === "select" ? (
                  <Select
                    onValueChange={(value) =>
                      handleInputChange(Number.parseInt(field.id), value)
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
                      handleInputChange(
                        Number.parseInt(field.id),
                        e.target.value,
                      )
                    }
                    required
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </form>
        )}
      </div>
    </div>
  );
};

export default WorkflowFormRecord;
