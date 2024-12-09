import { WorkflowViewer } from "@/components/workflow/workflow-viewer"

export default function WorkflowViewPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">View Workflow</h1>
      <WorkflowViewer id={params.id} />
    </div>
  )
}

