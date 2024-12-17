"use client";

import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckSquare,
  FileText,
  GitFork,
  GitMerge,
  LayoutGrid,
  Users,
} from "lucide-react";
import { memo } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { nodeTypes } from "./node-types";

interface WorkflowNodeData {
  label: string;
  description?: string;
  nodeId: string;
  assignee?: { type: "role" | "user"; id: string };
  form?: { fields: any[] };
  conditions?: any[];
  branches?: { id: string; name: string }[];
}

const WorkflowNode = memo(({ data, type }: NodeProps<WorkflowNodeData>) => {
  const NodeIcon = nodeTypes[type as keyof typeof nodeTypes]?.icon;
  const nodeColor = nodeTypes[type as keyof typeof nodeTypes]?.color;

  return (
    <div
      className={cn(
        "group shadow-lg rounded-lg bg-white bg-opacity-100 border-2 transition-all duration-200",
        "hover:shadow-xl hover:scale-105",
        {
          "min-w-[180px]": type !== "start" && type !== "end",
          "min-w-[140px]": type === "start" || type === "end",
        },
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
      />

      <div
        className={cn(
          "px-4 py-3 rounded-t-lg flex items-center justify-between",
          nodeColor,
          "text-white",
        )}
      >
        <div className="flex items-center gap-2">
          {NodeIcon && <NodeIcon className="h-5 w-5" />}
          <div className="font-medium">{data.label}</div>
        </div>
      </div>

      <div className="px-4 py-2 space-y-2">
        {data.description && (
          <div className="text-xs text-gray-600">{data.description}</div>
        )}

        {type === "start" && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Initiates workflow</span>
          </div>
        )}

        {type === "end" && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Concludes workflow</span>
          </div>
        )}

        {type === "task" && (
          <>
            {data.assignee && (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {data.assignee.type === "role" ? "Role: " : "User: "}
                  {data.assignee.id}
                </span>
              </div>
            )}
            {data.form && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <FileText className="h-3.5 w-3.5" />
                <span>{data.form.fields.length} form fields</span>
              </div>
            )}
          </>
        )}

        {type === "decision" && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <GitFork className="h-3.5 w-3.5" />
            <span>
              {data.conditions ? data.conditions.length : 0} conditions
            </span>
          </div>
        )}

        {type === "parallel" && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>
              {data.branches ? data.branches.length : 0} parallel branches
            </span>
          </div>
        )}

        {type === "merge" && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <GitMerge className="h-3.5 w-3.5" />
            <span>Merges parallel paths</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500 transition-colors"
      />
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";

export default WorkflowNode;
