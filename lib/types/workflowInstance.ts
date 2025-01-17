// /lib/types/workflowInstance.ts

import { Workflow } from "./workflow";

/**
 * Represents the structure of a WorkflowInstance.
 */
export interface WorkflowInstance {
  id?: number; // Optional because it might be generated on the backend
  workflow: Workflow; // ID of the workflow associated with the instance
  currentStep: string; // ID of the current step in the workflow
  name: string; // Name of the workflow instance
  status: string; // Status of the instance (e.g., 'Active', 'Completed', 'Suspended')
  metadata?: { [key: string]: string }; // Optional metadata key-value pairs for additional information
}
