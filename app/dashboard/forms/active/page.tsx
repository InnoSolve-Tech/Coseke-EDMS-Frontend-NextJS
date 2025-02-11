"use client";

import { useState, useEffect } from "react";
import { getUserFromSessionStorage } from "@/components/routes/sessionStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFormRecord, getFormRecordByForm } from "@/core/formrecords/api";
import { getAllForms } from "@/core/forms/api";
import { useToast } from "@/hooks/use-toast";
import type { FormRecord } from "@/lib/types/formRecords";
import type { Form, FormField } from "@/lib/types/forms";
import { Plus } from "lucide-react";
import RecordDetailsDialog from "@/components/forms/Active/RecordDetailsDialog";
import {
  addDocument,
  addDocumentByFolderId,
  DirectoryData,
  getFolders,
} from "@/components/files/api";
import FolderTreeSelector from "@/components/forms/Active/FolderTreeSelector";
import { FileData } from "@/types/file";

export default function FormRecordsPage() {
  // Separate states for create and view sections
  const [createFormId, setCreateFormId] = useState<string | null>(null);
  const [viewFormId, setViewFormId] = useState<string | null>(null);

  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [folderValues, setFolderValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FormRecord | null>(null);
  const [folders, setFolders] = useState<DirectoryData[]>([]);
  const [user, setUser] = useState<any>();
  const { toast } = useToast();

  useEffect(() => {
    setUser(getUserFromSessionStorage());
    fetchForms();
  }, []);

  useEffect(() => {
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
    if (createFormId) {
      const form = forms.find((f) => f.id === Number.parseInt(createFormId));
      setSelectedForm(form || null);
    }
  }, [createFormId, forms]);

  useEffect(() => {
    if (viewFormId) {
      fetchRecords(viewFormId);
    }
  }, [viewFormId]);

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

  const fetchRecords = async (formId: string) => {
    setIsLoading(true);
    try {
      const response = await getFormRecordByForm(Number.parseInt(formId));
      setRecords(response);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: number, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFolderSelect = (fieldId: number, folderId: string) => {
    setFolderValues((prev) => ({ ...prev, [fieldId]: folderId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    setIsSubmitting(true);

    try {
      // Create a copy of formValues to avoid mutating state directly
      const updatedFormValues = { ...formValues };

      // Upload files and update formValues with file IDs
      for (const [fieldId, value] of Object.entries(formValues)) {
        const field = selectedForm.formFields.find((f) => f.id === fieldId); // Convert fieldId to number
        if (
          field?.type.toLowerCase().trim() === "file" &&
          folderValues[fieldId]
        ) {
          // Get the file from the input
          const fileInput = document.getElementById(
            `field-${fieldId}`,
          ) as HTMLInputElement;
          const file = fileInput?.files?.[0];
          if (file) {
            // Upload the file and get the file ID
            const res: any = await addDocument(
              file,
              { filename: file.name, mimeType: file.type } as FileData,
              Number(folderValues[fieldId]),
            );
            console.log("Data: " + res);
            // Update the formValues with the file ID
            updatedFormValues[fieldId] = res.id.toString();
          }
        }
      }

      // Create formFieldValues after all files are uploaded
      const formFieldValues = Object.entries(updatedFormValues).map(
        ([fieldId, value]) => {
          const field = selectedForm.formFields.find((f) => f.id === fieldId); // Convert fieldId to number
          if (field?.type.toLowerCase() === "file" && folderValues[fieldId]) {
            return {
              formField: { id: fieldId } as FormField, // Convert fieldId to number
              value: `${value}|${folderValues[fieldId]}`,
            };
          }
          return {
            formField: { id: fieldId } as FormField, // Convert fieldId to number
            value,
          };
        },
      );

      // Create the form record
      await createFormRecord({
        form: selectedForm,
        formFieldValues: formFieldValues,
        userId: user.id as number,
        createdBy: user.id,
        createdDate: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Form record created successfully!",
      });

      // Reset form and folder values
      setFormValues({});
      setFolderValues({});
      setIsCreating(false);

      // Refresh records if viewing a form
      if (viewFormId) {
        fetchRecords(viewFormId);
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

  const handleViewDetails = (record: FormRecord) => {
    setSelectedRecord(record);
  };

  return (
    <Card className="w-full mt-10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Form Records</CardTitle>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Form Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formSelect">Select a Form</Label>
                <Select
                  onValueChange={(value) => setCreateFormId(value)}
                  value={createFormId || undefined}
                >
                  <SelectTrigger className="w-full">
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
                            handleInputChange(Number(field.id), value)
                          }
                          value={formValues[field.id] || ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`Select ${field.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.selectOptions?.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                                    f.folderID ===
                                    Number(folderValues[field.id]),
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
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Form Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formSelect">Select a Form to View Records</Label>
            <Select
              onValueChange={setViewFormId}
              value={viewFormId || undefined}
            >
              <SelectTrigger className="w-full">
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

          {isLoading ? (
            <div className="text-center">Loading records...</div>
          ) : records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Created Date</TableHead>
                  {records[0].form.formFields.map((field) => (
                    <TableHead key={field.id}>{field.name}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>
                    <TableCell>
                      {new Date(
                        record.createdDate!.toString(),
                      ).toLocaleString()}
                    </TableCell>
                    {record.form.formFields.map((field) => (
                      <TableCell key={field.id}>
                        {record.formFieldValues.find(
                          (v) => v.formField.id === field.id,
                        )?.value || ""}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button onClick={() => handleViewDetails(record)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center">
              No records found for the selected form.
            </div>
          )}
        </div>
      </CardContent>
      {selectedRecord && (
        <RecordDetailsDialog
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </Card>
  );
}
