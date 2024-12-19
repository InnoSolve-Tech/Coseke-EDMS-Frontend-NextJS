"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EditFormDialog } from "@/components/forms/EditFormDialog";
import { createForm } from "@/core/forms/api";

export function CreateFormButton() {
  const [isOpen, setIsOpen] = useState(false);

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
          } catch (error) {
            console.error("Error creating form", error);
          }
          return;
          setIsOpen(false);
          // In a real application, you would save the new form data here
        }}
      />
    </>
  );
}
