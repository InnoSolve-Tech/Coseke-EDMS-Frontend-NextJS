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

export default function FormRecordsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<any>();
  const { toast } = useToast();

  useEffect(() => {
    setUser(getUserFromSessionStorage());
    fetchForms();
  }, []);

  useEffect(() => {
    if (selectedFormId) {
      fetchRecords(selectedFormId);
      const form = forms.find((f) => f.id === Number.parseInt(selectedFormId));
      setSelectedForm(form || null);
    }
  }, [selectedFormId, forms]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;

    setIsSubmitting(true);
    const formFieldValues = Object.entries(formValues).map(
      ([fieldId, value]) => ({
        formField: { id: fieldId } as FormField,
        value,
      }),
    );
    try {
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
      setFormValues({});
      setIsCreating(false);
      fetchRecords(selectedFormId!);
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
                  onValueChange={(value) => setSelectedFormId(value)}
                  value={selectedFormId || undefined}
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
                            handleInputChange(Number.parseInt(field.id), value)
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
              onValueChange={setSelectedFormId}
              value={selectedFormId || undefined}
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
    </Card>
  );
}
