interface Position {
  x: number;
  y: number;
}

interface NodeData {
  // Add specific node data fields here
  // Since they're not specified in the Java code
  [key: string]: any;
}

export interface INode {
  id: string;
  type: string;
  position: Position;
  data: NodeData;
  width?: number;
  height?: number;
  selected?: boolean;
  positionAbsolute?: Position;
  dragging?: boolean;
  workflowId?: number; // Foreign key reference
}
