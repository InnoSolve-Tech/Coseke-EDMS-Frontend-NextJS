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
import { Button } from "@/components/ui/button";
import {
  createFormRecord,
  getFormRecordById,
  updateFormRecord,
} from "@/core/formrecords/api";
import { getAllForms } from "@/core/forms/api";
import { useToast } from "@/hooks/use-toast";
import type { FormRecord } from "@/lib/types/formRecords";
import type { Form, FormField } from "@/lib/types/forms";
import { useEffect, useState } from "react";
import { getUserFromSessionStorage } from "../routes/sessionStorage";
import FolderTreeSelector from "@/components/forms/Active/FolderTreeSelector";
import { addDocument, getFolders } from "@/components/files/api";
import type { DirectoryData } from "@/components/files/api";
import type { FileData } from "@/types/file";
import { Workflow, WorkflowType } from "@/lib/types/workflow";
import { updateWorkflowInstance } from "@/core/workflowInstance/api";

type WorkflowInstance = {
  id: number;
  workflowId: number;
  name: string;
  status: WorkflowType | "Completed" | "Active";
  startFormData?: Record<string, string>;
  currentStep: string;
  workflow: Workflow;
  metadata: Record<string, string>;
};

const WorkflowFormRecord = ({
  formId,
  formInstanceId,
  forms,
  currentStep,
  setForms,
  setSelectedForm,
  workflowInstance,
  selectedForm,
  moveToNextStep,
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
  moveToNextStep: (instance: WorkflowInstance) => Promise<void>;
  setSelectedForm: (form: Form | null) => void;
  formValues: Record<string, string>;
  setFormValues: (formValues: any) => void;
}) => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>();
  const [comment, setComment] = useState<string>("");
  const [folders, setFolders] = useState<DirectoryData[]>([]);
  const [folderValues, setFolderValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getComment = (): string => {
    const nodes = workflowInstance.workflow?.nodes || [];

    const { forms, approvals } = nodes.reduce(
      (acc, node) => {
        if (node.type === "form") acc.forms.push(node);
        else if (node.type === "approval") acc.approvals.push(node);
        return acc;
      },
      { forms: [] as typeof nodes, approvals: [] as typeof nodes },
    );

    const formIds = new Set(forms.map((form) => form.data.formId));
    const approvalIndex = approvals.find((approval) =>
      formIds.has(approval.data.formId),
    );

    if (workflowInstance.metadata) {
      return approvalIndex ? workflowInstance.metadata[approvalIndex.id] : "";
    }

    return "";
  };

  useEffect(() => {
    setUser(getUserFromSessionStorage());

    // Fetch folders
    const fetchDirectory = async () => {
      try {
        const response = await getFolders();
        if (Array.isArray(response)) {
          setFolders(response);
        } else {
          console.error("Invalid directory response:", response);
        }
      } catch (error) {
        console.error("Error fetching directory:", error);
        toast({
          title: "Error",
          description: "Failed to fetch directory. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchDirectory();
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
                if (fieldValue.formField.type?.toLowerCase() === "file") {
                  const [fileId, folderId] = fieldValue.value.split("|");
                  acc[fieldValue.formField.id] = fileId;
                  setFolderValues((prev) => ({
                    ...prev,
                    [fieldValue.formField.id]: folderId,
                  }));
                } else {
                  acc[fieldValue.formField.id] = fieldValue.value;
                }
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
    setFolderValues({});
  };

  const handleInputChange = (fieldId: number, value: string) => {
    setFormValues((prev: any) => ({ ...prev, [fieldId]: value }));
  };

  const handleFolderSelect = (fieldId: number, folderId: string) => {
    setFolderValues((prev) => ({ ...prev, [fieldId]: folderId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    setIsSubmitting(true);

    try {
      const updatedFormValues = { ...formValues };

      // First, validate that all required file fields have files
      for (const field of selectedForm.formFields) {
        if (field.type.toLowerCase() === "file") {
          const fileInput = document.getElementById(
            `field-${field.id}`,
          ) as HTMLInputElement;
          const file = fileInput?.files?.[0];
          const folderId = folderValues[field.id];

          if (!file || !folderId) {
            toast({
              title: "Validation Error",
              description: `Please select both a file and destination folder for ${field.name}`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Now handle file uploads before form submission
      for (const field of selectedForm.formFields) {
        if (field.type.toLowerCase() === "file") {
          const fieldId = field.id;
          const fileInput = document.getElementById(
            `field-${fieldId}`,
          ) as HTMLInputElement;
          const file = fileInput!.files![0];

          try {
            // Upload the document and get its ID
            const res = await addDocument(
              file,
              { filename: file.name, mimeType: file.type } as FileData,
              Number(folderValues[fieldId]),
            );

            // Update form values with the document ID
            updatedFormValues[fieldId] = res!.id.toString();
          } catch (fileError) {
            console.error("Error uploading file:", fileError);
            toast({
              title: "Error",
              description: `Failed to upload file for ${field.name}. Please try again.`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Create form field values array with file references
      const formFieldValues = Object.entries(updatedFormValues).map(
        ([fieldId, value]) => {
          const field = selectedForm.formFields.find((f) => f.id === fieldId);
          if (field?.type.toLowerCase() === "file") {
            // Store both document ID and folder ID
            return {
              formField: { id: fieldId } as FormField,
              value: `${value}|${folderValues[fieldId]}`,
            };
          }
          return {
            formField: { id: fieldId } as FormField,
            value,
          };
        },
      );

      // Update or create the form record
      if (formInstanceId) {
        const response = await updateFormRecord({
          id: Number.parseInt(formInstanceId),
          formFieldValues: formFieldValues,
          form: { id: selectedForm.id },
        } as FormRecord);

        toast({
          title: "Success",
          description: "Form record updated successfully!",
        });
        setFormValues({});
        setFolderValues({});
        setSelectedForm(null);
        await moveToNextStep(workflowInstance);
      } else {
        let res = await createFormRecord({
          form: selectedForm,
          formFieldValues: formFieldValues,
          userId: user.id as number,
          createdBy: user.id,
          createdDate: new Date().toISOString(),
        } as FormRecord);

        // Ensure metadata exists
        const updatedInstance = {
          ...workflowInstance,
          metadata: { ...workflowInstance.metadata, [currentStep]: res.id },
        };

        console.log("updatedInstance", updatedInstance);

        await updateWorkflowInstance(
          updatedInstance.id.toString(),
          updatedInstance,
        );

        toast({
          title: "Success",
          description: "Form record created successfully!",
        });

        setFormValues({});
        setFolderValues({});
        setSelectedForm(null);

        await moveToNextStep(updatedInstance);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to submit form record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                      handleInputChange(Number(field.id), value)
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
                ) : field.type.toLowerCase() === "file" ? (
                  <div className="space-y-4">
                    <Input
                      id={`field-${field.id}`}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleInputChange(Number(field.id), file.name);
                        }
                      }}
                    />
                    <FolderTreeSelector
                      folders={folders}
                      onSelect={(folderId) => {
                        handleFolderSelect(
                          Number(field.id),
                          folderId.toString(),
                        );
                      }}
                      selectedFolderId={
                        folderValues[field.id]
                          ? Number(folderValues[field.id])
                          : undefined
                      }
                      triggerButtonText="Select Destination Folder"
                    />
                    <div className="text-sm text-muted-foreground">
                      {folderValues[field.id] && (
                        <div>
                          Selected folder:{" "}
                          {folders.find(
                            (f) =>
                              f.folderID === Number(folderValues[field.id]),
                          )?.name || "Unknown folder"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Input
                    id={`field-${field.id}`}
                    type={field.type.toLowerCase()}
                    value={formValues[field.id] || ""}
                    onChange={(e) =>
                      handleInputChange(Number(field.id), e.target.value)
                    }
                    required
                    className="w-full"
                  />
                )}
              </div>
            ))}
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : formInstanceId
                  ? "Update Form"
                  : "Submit Form"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WorkflowFormRecord;
