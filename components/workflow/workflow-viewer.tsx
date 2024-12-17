"use client";

import { useEffect, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { Workflow } from "@/lib/types/workflow";
import WorkflowNode from "./workflow-node";
import { getWorkflow } from "@/core/workflows/api";

const nodeTypes = {
  start: WorkflowNode,
  end: WorkflowNode,
  task: WorkflowNode,
  decision: WorkflowNode,
  parallel: WorkflowNode,
  merge: WorkflowNode,
};

export function WorkflowViewer({ id }: { id: string }) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  const fetchWorkflow = async (id: string) => {
    try {
      const response = await getWorkflow(parseInt(id));
      setWorkflow(response);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkflow(id);
  }, [id]);

  if (!workflow) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-[600px] border rounded-lg bg-slate-50">
      <ReactFlow
        nodes={workflow.nodes}
        edges={workflow.edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#94a3b8" gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
