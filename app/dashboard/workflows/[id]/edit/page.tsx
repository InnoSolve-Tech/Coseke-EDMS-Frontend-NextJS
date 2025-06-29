"use client";

import { WorkflowDesigner } from "@/components/workflow/edit/workflow-edit-designer";
import { WorkflowProvider } from "@/lib/contexts/workflow-edit-context";
import { useParams } from "next/navigation";

export default function WorkflowEditPage() {
  const params = useParams();
  return (
    <WorkflowProvider>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Edit Workflow</h1>
        <WorkflowDesigner id={params?.id as string} />
      </div>
    </WorkflowProvider>
  );
}
