import { WorkflowDesigner } from "@/components/workflow/edit/workflow-edit-designer"
import { WorkflowProvider } from "@/lib/contexts/workflow-edit-context"

export default function WorkflowEditPage({ params }: { params: { id: string } }) {
  return (
    <WorkflowProvider>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Edit Workflow</h1>
        <WorkflowDesigner id={params.id} />
      </div>
    </WorkflowProvider>
  )
}

