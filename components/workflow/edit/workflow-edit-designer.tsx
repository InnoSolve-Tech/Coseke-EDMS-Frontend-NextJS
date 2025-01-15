"use client";

import { useWorkflow } from "@/lib/contexts/workflow-edit-context";
import {
  Workflow,
  WorkflowNode as WorkflowNodeType,
} from "@/lib/types/workflow";
import { Info } from "lucide-react";
import dynamic from "next/dynamic";
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
import { Button } from "../../ui/button";
import { WorkflowForm } from "../edit/workflow-edit-form";
import { NodeEditor } from "../node-editor";
import { nodeTypes as nodeConfig } from "../node-types";
import { WorkflowHelpDialog } from "../workflow-help-dialog";
import { WorkflowJson } from "../workflow-json";
import WorkflowNode from "../workflow-node";
import { getWorkflow } from "@/core/workflows/api";
import { v4 as uuidv4 } from "uuid";
import { Form } from "@/lib/types/forms";

type WorkflowNodeData = {
  nodeId: any;
  label: string;
  description?: string;
  conditions?: { id: string; field: string; operator: string; value: string }[];
  assignee?: { assignee_type: "role" | "user"; assignee_id: string };
  dueDate?: string;
  form?: Form;
  branches?: string[];
};

const nodeTypes = {
  start: WorkflowNode,
  end: WorkflowNode,
  task: WorkflowNode,
  decision: WorkflowNode,
  form: WorkflowNode,
};

interface WorkflowDesignerProps {
  id?: string;
}

const ClientSideOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <>{children}</>;
};

export function WorkflowDesigner({ id }: WorkflowDesignerProps) {
  const { updateWorkflow } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<
    | (Node<WorkflowNodeData> & {
        type: "start" | "end" | "task" | "decision" | "form";
      })
    | null
  >(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Use nodeId instead of the node id for source and target
      const newEdge: Edge = {
        ...params,
        id: uuidv4(),
        source: nodes.find((node) => node.id === params.source)!.data.nodeId,
        target: nodes.find((node) => node.id === params.target)!.data.nodeId,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges],
  );

  const addNode = (type: keyof typeof nodeConfig) => {
    const nodeId = uuidv4();
    const newNode: Node<WorkflowNodeData> = {
      id: nodeId,
      type,
      position: { x: 250, y: 250 },
      data: {
        label: nodeConfig[type].label,
        description: nodeConfig[type].description,
        nodeId: nodeId,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNode(
      node as Node<WorkflowNodeData> & {
        type: "start" | "end" | "task" | "decision" | "form";
      },
    );
  };

  const updateNode = (updatedNode: Node<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node)),
    );
    setSelectedNode(null);
  };

  const fetchWorkflow = async (id: string) => {
    try {
      const response = await getWorkflow(parseInt(id));
      updateWorkflow(response);
      setNodes(response.nodes);
      setEdges(response.edges);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkflow(id!);
  }, [id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateWorkflow({
        nodes: nodes.map((node) => ({
          ...node,
          type: node.type as WorkflowNodeType["type"],
          nodeId: node.data.nodeId,
        })),
        edges,
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges]);

  return (
    <div className="space-y-4">
      <WorkflowForm />

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
          <WorkflowJson
            workflow={{
              nodes: nodes as unknown as WorkflowNodeType[],
              edges,
            }}
          />
        </div>
      </div>

      <div className="h-[600px] border rounded-lg bg-slate-50">
        <ClientSideOnly>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{
              type: "smoothstep",
              style: { strokeWidth: 2 },
              animated: true,
            }}
            fitView
          >
            <Background color="#94a3b8" gap={16} size={1} />
            <Controls />
            <Panel
              position="bottom-center"
              className="bg-white p-2 rounded-t-lg shadow-lg"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>
                  Click nodes to edit details, drag between dots to connect
                </span>
              </div>
            </Panel>
          </ReactFlow>
        </ClientSideOnly>
      </div>

      {selectedNode && (
        <NodeEditor
          node={selectedNode}
          workflow={{ edges, nodes: nodes as any[] }}
          isOpen={true}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNode}
        />
      )}
    </div>
  );
}
