"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import WorkflowNode from "./workflow-node";
import { Button } from "../ui/button";
import { nodeTypes as nodeConfig } from "./node-types";
import { NodeEditor } from "./node-editor";
import { WorkflowNode as WorkflowNodeType, Workflow } from "@/lib/types/workflow";
import { WorkflowJson } from "./workflow-json";
import { WorkflowHelpDialog } from "./workflow-help-dialog";
import { Info } from "lucide-react";

const nodeTypes = {
  start: WorkflowNode,
  end: WorkflowNode,
  task: WorkflowNode,
  decision: WorkflowNode,
  parallel: WorkflowNode,
  merge: WorkflowNode,
};

interface WorkflowDesignerProps {
  name?: string;
  description?: string;
}

export function WorkflowDesigner({ name, description }: WorkflowDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: keyof typeof nodeConfig) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 250, y: 250 },
      data: {
        label: nodeConfig[type].label,
        description: nodeConfig[type].description,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as WorkflowNodeType);
  };

  const updateNode = (updatedNode: WorkflowNodeType) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );
    setSelectedNode(null);
  };

  const workflowData: Partial<Workflow> = {
    name,
    description,
    nodes: nodes as WorkflowNodeType[],
    edges,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {Object.entries(nodeConfig).map(([type, config]) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addNode(type as keyof typeof nodeConfig)}
              className="flex items-center gap-2"
            >
              <config.icon className="h-4 w-4" />
              {config.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <WorkflowHelpDialog />
          <WorkflowJson workflow={workflowData} />
        </div>
      </div>

      <div className="h-[600px] border rounded-lg bg-slate-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2 },
            animated: true,
          }}
          fitView
        >
          <Background color="#94a3b8" gap={16} size={1} />
          <Controls />
          <Panel position="bottom-center" className="bg-white p-2 rounded-t-lg shadow-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>Click nodes to edit details, drag between dots to connect</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeEditor
          node={selectedNode}
          isOpen={true}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNode}
        />
      )}
    </div>
  );
}