"use client";

import { CreateFormButton } from "@/components/forms/CreateFormButton";
import { FormList } from "@/components/forms/FormList";
import { getAllForms } from "@/core/forms/api";
import { Form } from "@/lib/types/forms";
import React, { useState } from "react";

export default function FormsPage() {
  const [forms, setForms] = React.useState<Form[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchForms = async () => {
    try {
      const response = await getAllForms();
      setForms(response);
    } catch (error) {
      console.error("Error fetching forms", error);
    }
  };

  React.useEffect(() => {
    fetchForms();
  }, [isOpen]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Forms List</h1>
        <CreateFormButton isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>
      {forms.length > 0 && <FormList initialForms={forms} />}
    </div>
  );
}
