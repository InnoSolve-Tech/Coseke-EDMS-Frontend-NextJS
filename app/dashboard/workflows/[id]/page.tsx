"use client";

import { WorkflowViewer } from "@/components/workflow/workflow-viewer";
import { useParams } from "next/navigation";

export default function WorkflowViewPage() {
  const params = useParams();
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">View Workflow</h1>
      <WorkflowViewer id={params.id as string} />
    </div>
  );
}
