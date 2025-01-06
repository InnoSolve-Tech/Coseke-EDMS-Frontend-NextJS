"use client";

import WorkflowInstanceCreator from "@/components/workflow/workflow-instance-creator";

export default function WorkflowInstancesPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Workflow Instances</h1>
      <WorkflowInstanceCreator />
    </div>
  );
}
