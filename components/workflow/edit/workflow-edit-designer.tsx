"use client";

import { getWorkflow } from "@/core/workflows/api";
import { useWorkflow } from "@/lib/contexts/workflow-edit-context";
import { Form } from "@/lib/types/forms";
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
import { v4 as uuidv4 } from "uuid";
import { Button } from "../../ui/button";
import { WorkflowForm } from "../edit/workflow-edit-form";
import { NodeEditor } from "../node-editor";
import { nodeTypes as nodeConfig } from "../node-types";
import { WorkflowHelpDialog } from "../workflow-help-dialog";
import WorkflowNode from "../workflow-node";

type WorkflowNodeData = {
  nodeId: any;
  label: string;
  description?: string;
  conditions?: { id: string; field: string; operator: string; value: string }[];
  assignee?: { assignee_type: "role" | "user"; assignee_id: string };
  shouldDelegate: boolean;
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
  approval: WorkflowNode,
  notification: WorkflowNode,
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
        type:
          | "start"
          | "end"
          | "task"
          | "decision"
          | "form"
          | "approval"
          | "notification";
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
        shouldDelegate: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNode(
      node as Node<WorkflowNodeData> & {
        type:
          | "start"
          | "end"
          | "task"
          | "decision"
          | "form"
          | "approval"
          | "notification";
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
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {Object.entries(nodeConfig).map(([type, config]) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addNode(type as keyof typeof nodeConfig)}
              className="flex items-center justify-start gap-2 w-full"
            >
              <config.icon
                className={`h-4 w-4 ${config.color} text-white rounded-full p-0.5`}
              />
              <span className="truncate">{config.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex justify-end">
          <WorkflowHelpDialog />
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
