"use client";

import {
  Circle,
  ClipboardList,
  Diamond,
  PlayCircle,
  StopCircle,
} from "lucide-react";

export const nodeTypes = {
  start: {
    icon: PlayCircle,
    label: "Start",
    color: "bg-green-500",
    description: "Initiates the process",
  },
  end: {
    icon: StopCircle,
    label: "End",
    color: "bg-red-500",
    description: "Concludes the process",
  },
  task: {
    icon: ClipboardList,
    label: "Task",
    color: "bg-blue-500",
    description: "Represents a task to be completed",
  },
  decision: {
    icon: Diamond,
    label: "Decision",
    color: "bg-yellow-500",
    description: "Branch based on conditions",
  },
  form: {
    icon: Circle,
    label: "Form",
    color: "bg-purple-500",
    description: "Represents a form to be filled",
  },
} as const;

export type NodeTypes = typeof nodeTypes;
