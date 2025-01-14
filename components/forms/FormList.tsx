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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateForm, deleteForm } from "@/core/forms/api";
import { Form } from "@/lib/types/forms";
import { DeleteIcon, EditIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface FormListProps {
  initialForms: Form[];
}

export function FormList({ initialForms }: FormListProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [deletingForm, setDeletingForm] = useState<Form | null>(null);

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

  const handleDelete = async (formId: number) => {
    try {
      await deleteForm(formId);
      setForms(forms.filter((form) => form.id !== formId));
      setDeletingForm(null);
    } catch (error) {
      console.error("Error deleting form", error);
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
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingForm(form)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingForm(form)}
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Fields:</p>
              <ul className="list-disc list-inside">
                {form.formFields.map((field) => (
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
      <DeleteFormDialog
        isOpen={!!deletingForm}
        onClose={() => setDeletingForm(null)}
        onDelete={() => deletingForm && handleDelete(deletingForm.id!)}
        formName={deletingForm?.name || ""}
      />
    </>
  );
}

function DeleteFormDialog({
  isOpen,
  onClose,
  onDelete,
  formName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  formName: string;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the form
            <span className="font-semibold"> {formName} </span>
            and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
