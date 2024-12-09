interface EdgeStyle {
  // Add specific style properties here
  // Since they're not specified in the Java code
  [key: string]: any;
}

export interface IEdge {
  id: string;
  type: string;
  animated?: boolean;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  style?: EdgeStyle;
  workflowId?: number;  // Foreign key reference
} 