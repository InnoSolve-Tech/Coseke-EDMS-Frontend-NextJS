export interface SearchMatchInfo {
  label: boolean;
  metadata: boolean;
}

export interface FileNode {
  [x: string]: any;
  id: string;
  label: string;
  type: "file" | "folder";
  metadata?: {
    mimeType?: string;
    uploadStatus?: string;
    [key: string]: any;
  };
  children?: FileNode[];
  folderID?: number;
  fileId?: number;
  parentFolderID?: number;
  searchMatches?: SearchMatchInfo;
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
