import type React from "react";
export interface MetadataItem {
  name: string;
  type: string;
  value: string;
  options?: any;
}

export interface Metadata {
  [key: string]: string | string[];
}

export interface Document {
  comments: any;
  version: React.ReactNode;
  id: number;
  folderID: number;
  filename: string;
  documentType: string;
  documentName: string;
  hashName: string;
  fileLink: string | null;
  mimeType: string;
  metadata: Metadata;
  createdDate: string;
  lastModifiedDateTime: string;
  lastModifiedBy: number;
  createdBy: number;
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  user: string;
}

export interface IDocumentType {
  id: number;
  name: string;
  metadata: MetadataItem[];
}
