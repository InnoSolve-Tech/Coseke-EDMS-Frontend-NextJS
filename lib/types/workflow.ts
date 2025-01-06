import { Form } from "./forms";

export interface FormField {
  id: string;
  type: "text" | "number" | "select" | "date" | "checkbox";
  label: string;
  required?: boolean;
}

export interface WorkflowNode {
  id: string;
  type: "start" | "end" | "task" | "decision" | "form";
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    nodeId: string;
    conditions?: { field: string; operator: string; value: string }[];
    formId?: string;
    assignee?: { assignee_type: "role" | "user"; assignee_id: string };
    dueDate?: string;
    form?: Form;
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
