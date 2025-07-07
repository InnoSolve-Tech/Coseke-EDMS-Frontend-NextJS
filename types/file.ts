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
  documentType: string;
  documentName: string;
  hashName: string;
  mimeType: string;
  metadata: Metadata;
  createdDate?: string;
  signature?: string;
  lastModifiedDateTime?: string;
  lastModifiedBy?: number;
  createdBy?: number;
  [key: string]: unknown;
  comments?: string;
  fileVersions: FileVersions[];
}

interface Metadata {
  [key: string]: string | string[];
}

export interface FileVersions {
  id: number;
  fileManager: FileData;
  versionName: string;
  filePath: string;
  createdDate: string;
  lastModifiedDateTime: string;
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
