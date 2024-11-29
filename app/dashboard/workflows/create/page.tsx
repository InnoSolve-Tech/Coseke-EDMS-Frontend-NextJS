"use client";

import { useState } from "react";
import { WorkflowDesigner } from "@/components/workflow/workflow-designer";
import { WorkflowForm } from "@/components/workflow/workflow-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowHelp } from "@/components/workflow/workflow-help";
import { WorkflowHelpDialog } from "@/components/workflow/workflow-help-dialog";

export default function CreateWorkflowPage() {
  const [workflowDetails, setWorkflowDetails] = useState({
    name: "",
    description: "",
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Create Workflow</h1>
        <WorkflowHelpDialog />
      </div>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workflow Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <WorkflowForm onSubmit={setWorkflowDetails} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Process Designer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <WorkflowDesigner
              name={workflowDetails.name}
              description={workflowDetails.description}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}