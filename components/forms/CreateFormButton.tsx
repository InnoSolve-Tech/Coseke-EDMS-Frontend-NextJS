"use client";

import { EditFormDialog } from "@/components/forms/EditFormDialog";
import { Button } from "@/components/ui/button";
import { createForm } from "@/core/forms/api";
import { toast } from "@/hooks/use-toast";
import { PlusIcon } from "lucide-react";

export function CreateFormButton({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon className="mr-2 h-4 w-4" /> Create Form
      </Button>
      <EditFormDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={async (formData) => {
          formData.formFields = formData.formFields.map(({ id, ...field }) => ({
            ...field,
            type: field.type.toUpperCase().trim(),
          })) as any;
          try {
            await createForm(formData);
            toast({
              title: "Success",
              description: "Form created successfully!",
            });
            setIsOpen(false);
          } catch (error) {
            console.error("Error creating form", error);
            toast({
              title: "Error",
              description: "Failed to create form. Please try again.",
              variant: "destructive",
            });
          }
          return;
          setIsOpen(false);
          // In a real application, you would save the new form data here
        }}
      />
    </>
  );
}
