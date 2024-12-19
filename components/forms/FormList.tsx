"use client";

import { EditFormDialog } from "@/components/forms/EditFormDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateForm } from "@/core/forms/api";
import { dummyForms } from "@/data/dummyData";
import { Form } from "@/lib/types/forms";
import { EditIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface FormListProps {
  initialForms: Form[];
}

export function FormList({ initialForms }: FormListProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [editingForm, setEditingForm] = useState<Form | null>(null);

  const handleSave = async (updatedForm: Form) => {
    try {
      updatedForm.formFields = updatedForm.formFields.map(
        ({ id, ...field }) => ({
          ...field,
          type: field.type.toUpperCase().trim(),
        }),
      ) as any;
      await updateForm(updatedForm.id!, updatedForm);
      setForms(
        forms.map((form) => (form.id === updatedForm.id ? updatedForm : form)),
      );
      setEditingForm(null);
    } catch (error) {
      console.error("Error updating form", error);
    }
  };

  useEffect(() => {
    setForms(initialForms);
  }, [initialForms]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{form.name}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingForm(form)}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Fields:</p>
              <ul className="list-disc list-inside">
                {form.formFields.map((field, index) => (
                  <li key={field.name} className="text-sm">
                    {field.name}:{" "}
                    <span className="font-mono">{field.type}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      {editingForm && (
        <EditFormDialog
          isOpen={!!editingForm}
          onClose={() => setEditingForm(null)}
          onSave={handleSave}
          initialData={editingForm}
        />
      )}
    </>
  );
}
