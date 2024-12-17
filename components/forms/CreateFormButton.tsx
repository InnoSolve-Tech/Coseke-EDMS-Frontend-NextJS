"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EditFormDialog } from "@/components/forms/EditFormDialog";

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
        onSave={(formData) => {
          console.log("New form data:", formData);
          setIsOpen(false);
          // In a real application, you would save the new form data here
        }}
      />
    </>
  );
}
