"use client";

import {
  Circle,
  ClipboardList,
  Diamond,
  FileCheck,
  GitMerge,
  LayoutGrid,
  PlayCircle,
  StopCircle,
} from "lucide-react";

export const nodeTypes = {
  start: {
    icon: PlayCircle,
    label: "Start Process",
    color: "bg-green-500",
    description: "Initiates the workflow",
  },
  end: {
    icon: StopCircle,
    label: "End Process",
    color: "bg-red-500",
    description: "Concludes the workflow",
  },
  task: {
    icon: FileCheck,
    label: "Task",
    color: "bg-blue-500",
    description: "Assign work to users or roles",
  },
  decision: {
    icon: Diamond,
    label: "Decision",
    color: "bg-yellow-500",
    description: "Branch based on conditions",
  },
  parallel: {
    icon: LayoutGrid,
    label: "Parallel Tasks",
    color: "bg-purple-500",
    description: "Execute multiple tasks simultaneously",
  },
  merge: {
    icon: GitMerge,
    label: "Merge",
    color: "bg-orange-500",
    description: "Combine parallel paths",
  },
} as const;

export type NodeTypes = typeof nodeTypes;
