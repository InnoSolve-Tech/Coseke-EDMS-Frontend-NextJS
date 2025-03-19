export interface FileNode {
  id: string;
  label: string;
  type: "file" | "folder";
  metadata?: Record<string, unknown>;
  children?: FileNode[];
  folderID?: number;
  fileId?: number;
  parentFolderID?: number;
}

export interface FileData {
  id: number;
  name?: string;
  filename?: string;
  folderID?: number;
  fileId?: number;
  documentType?: string;
  documentName?: string;
  hashName?: string;
  fileLink?: string | null;
  mimeType?: string;
  metadata?: {
    author?: string;
    version?: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  createdDate?: string;
  lastModifiedDateTime?: string;
  lastModifiedBy?: number;
  createdBy?: number;
  [key: string]: unknown;
  comments?: string;
  versions?: any;
}

export interface DocumentType {
  id: number;
  name: string;
  metadata: MetadataField[];
}

export interface MetadataField {
  name: string;
  type: "string" | "select" | "number" | "date";
  value: string | null;
  options?: string[];
}
