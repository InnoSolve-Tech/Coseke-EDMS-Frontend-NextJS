"use client";

import { useWorkflow } from "@/lib/contexts/workflow-context";
import { WorkflowNode as WorkflowNodeType } from "@/lib/types/workflow";
import { Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  Node,
  Panel,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "../ui/button";
import { NodeEditor } from "./node-editor";
import { nodeTypes as nodeConfig } from "./node-types";
import { WorkflowHelpDialog } from "./workflow-help-dialog";
import { WorkflowJson } from "./workflow-json";
import WorkflowNode from "./workflow-node";

type NodeForm = {
  id: string;
  fields: Array<{
    id: string;
    type: "number" | "text" | "select" | "date" | "checkbox";
    label: string;
    required?: boolean;
  }>;
};

type WorkflowNodeData = {
  label: string;
  description?: string;
  nodeId: string;
  conditions?: { field: string; operator: string; value: string; }[];
  assignee?: { assignee_type: "role" | "user"; assignee_id: string; };
  dueDate?: string;
  form?: NodeForm;
  branches?: string[];
};

const nodeTypes = {
  start: WorkflowNode,
  end: WorkflowNode,
  task: WorkflowNode,
  decision: WorkflowNode,
  parallel: WorkflowNode,
  merge: WorkflowNode,
};


export function WorkflowDesigner() {
  const { updateWorkflow } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> & { type: "start" | "end" | "task" | "decision" | "parallel" | "merge" } | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Use nodeId instead of the node id for source and target
      const newEdge:Edge = {
        ...params,
        id: uuidv4(),
        source: nodes.find(node => node.id === params.source)!.data.nodeId,
        target: nodes.find(node => node.id === params.target)!.data.nodeId,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
  );

  const addNode = (type: keyof typeof nodeConfig) => {
    const nodeId =  uuidv4();
    const newNode: Node<WorkflowNodeData> = {
      id: nodeId,
      type,
      position: { x: 250, y: 250 },
      data: {
        label: nodeConfig[type].label,
        nodeId: nodeId,
        description: nodeConfig[type].description,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNode(node as Node<WorkflowNodeData> & { type: "start" | "end" | "task" | "decision" | "parallel" | "merge" });
  };

  const updateNode = (updatedNode: Node<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );
    setSelectedNode(null);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateWorkflow({ 
        nodes: nodes.map(node => ({
          ...node,
          type: node.type as WorkflowNodeType['type'],
          nodeId: node.data.nodeId,
        })), 
        edges 
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

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
          <WorkflowJson workflow={{ 
            nodes: nodes as unknown as WorkflowNodeType[], 
            edges 
          }} />
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
          node={{ ...selectedNode }}
          isOpen={true}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNode}
        />
      )}
    </div>
  );
}