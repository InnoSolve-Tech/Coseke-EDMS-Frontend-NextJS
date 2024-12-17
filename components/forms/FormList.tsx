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
import { EditIcon } from "lucide-react";
import { useState } from "react";

const fieldTypes = [
  "text",
  "number",
  "email",
  "password",
  "date",
  "time",
  "textarea",
  "select",
] as const;

interface SelectOptions {
  options: string[];
}
interface FieldDefinition {
  type: (typeof fieldTypes)[number];
  selectOptions?: SelectOptions;
}

export interface Form {
  id?: number;
  name: string;
  description: string;
  fieldDefinitions: Record<string, FieldDefinition>;
}

interface FormListProps {
  forms: Form[];
}

export function FormList({ forms: initialForms }: FormListProps) {
  const [forms, setForms] = useState(initialForms);
  const [editingForm, setEditingForm] = useState<Form | null>(null);

  const handleSave = (updatedForm: Form) => {
    setForms(
      forms.map((form) => (form.id === updatedForm.id ? updatedForm : form)),
    );
    setEditingForm(null);
  };

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
                {Object.entries(form.fieldDefinitions).map(
                  ([fieldName, fieldType]) => (
                    <li key={fieldName} className="text-sm">
                      {fieldName}:{" "}
                      <span className="font-mono">{fieldType.type}</span>
                    </li>
                  ),
                )}
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
