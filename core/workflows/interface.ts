import { INode } from "../node/interface";
import { IEdge } from "../edge/interface";

export interface IWorkflow {
  id?: number;
  name: string;
  description: string;
  nodes?: INode[];
  edges?: IEdge[];
} 