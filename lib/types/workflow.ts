export interface NodeForm {
  id: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  type: "text" | "number" | "select" | "date" | "checkbox";
  label: string;
  required?: boolean;
}

export interface WorkflowNode {
  id: string;
  type: "start" | "end" | "task" | "decision" | "parallel" | "merge";
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    nodeId: string;
    conditions?: { field: string; operator: string; value: string }[];
    assignee?: { type: "role" | "user"; id: string };
    dueDate?: string;
    form?: NodeForm;
    branches?: string[];
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: Edge[];
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}
