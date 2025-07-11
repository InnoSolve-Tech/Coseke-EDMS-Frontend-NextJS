import { Form } from "./forms";

export type WorkflowType =
  | "approval"
  | "notification"
  | "form"
  | "decision"
  | "task"
  | "start"
  | "end";
export interface FormField {
  id: string;
  type: "text" | "number" | "select" | "date" | "checkbox";
  label: string;
  required?: boolean;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    shouldDelegate: boolean;
    nodeId: string;
    notification?: {
      id?: number;
      type: string;
      subject: string;
      body: string;
    };
    condition?: {
      id: string;
      field: string;
      operator: string;
      value: string;
    }[];
    ifFalse?: string;
    ifTrue?: string;
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
