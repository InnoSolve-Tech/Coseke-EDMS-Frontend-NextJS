"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowDesigner } from "@/components/workflow/workflow-designer";
import { WorkflowForm } from "@/components/workflow/workflow-form";
import { WorkflowHelpDialog } from "@/components/workflow/workflow-help-dialog";
import { WorkflowProvider } from "@/lib/contexts/workflow-context";

export default function CreateWorkflowPage() {
  return (
    <WorkflowProvider>
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
              <WorkflowForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Process Designer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <WorkflowDesigner />
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkflowProvider>
  );
}
