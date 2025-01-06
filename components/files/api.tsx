"use client";

import axios from "axios";
import { AxiosInstance } from "../routes/api";
import { getTokenFromSessionStorage } from "../routes/sessionStorage";

const ENDPOINT_URL = "file-management/api/v1/files/";

type DocumentProps = {
  documentName: string;
  documentType?: string;
  metadata: Record<string, unknown>;
};

type DocumentType = {
  name: string;
  metadata: Record<string, unknown>[];
};

type FileData = {
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
};

interface Metadata {
  [key: string]: string | string[];
}

type ApiResponse<T> = {
  map(
    arg0: (folder: any) => {
      id: any;
      label: any;
      type: string;
      folderID: any;
      parentFolderID: any;
    },
  ): unknown;
  id: number;
  name: string;
  parentFolderID: number | undefined;
  folderID: ApiResponse<FileData[]>;
  data: T;
  message?: string;
};

export interface DirectoryData {
  folderID?: number;
  id?: number;
  name: string;
  parentFolderID?: number;
}

export interface FileManagerData {
  folderID?: number | null;
  filename: string;
  documentType: string;
  documentName: string;
  hashName?: string;
  fileLink?: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
  fileContent?: string;
}

export const addDocument = async (
  data: any,
  file: File,
  folderId: number,
): Promise<void> => {
  // Create FormData object
  let formData = new FormData();
  console.log(data);
  formData.append(
    "fileData",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  formData.append("file", file);

  try {
    let res = await axios.post(
      `http://localhost:8081/${ENDPOINT_URL}${folderId}`,
      formData,
      {
        headers: {
          "X-Proxy-Secret": "my-proxy-secret-key",
          "Content-Type": "multipart/form-data",
        },
      },
    );
    console.log(res);
  } catch (error) {
    console.error("Error uploading document:", error);
  }
};

export const addDocumentByFolderId = async (
  data: DocumentProps,
  file: File,
  folderId: number,
): Promise<void> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  const formData = new FormData();

  // Properly stringify and append the fileData
  formData.append(
    "fileData",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );

  // Append the actual file
  formData.append("file", file);

  try {
    const response = await AxiosInstance.post<ApiResponse<void>>(
      `/api/v1/files/${folderId}`,
      formData,
      {
        headers: {
          Authorization: authorization,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    console.log(response);
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error; // Re-throw to handle in the calling function
  }
};

export const getFiles = async (): Promise<ApiResponse<FileData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<FileData[]>>(
    "file-management/api/v1/files/stored",
  );
  return response.data;
};

export const getFilesById = async (fileId: number): Promise<FileData> => {
  const response = await AxiosInstance.get<FileData>(
    `file-management/api/v1/files/file/${fileId}`,
  );
  return response.data;
};

export const getFilesByHash = async (hashName: string): Promise<Blob> => {
  const response = await axios.get(
    `http://localhost:8081/file-management/api/v1/files/download/${hashName}`,
    {
      responseType: "blob",
      headers: {
        "X-Proxy-Secret": "my-proxy-secret-key",
      },
    },
  );

  // Return the blob with the correct MIME type
  const mimeType =
    response.headers["content-type"] || "application/octet-stream";
  return new Blob([response.data], { type: mimeType });
};

export const getFilesByFolderID = async (
  folderId: number,
): Promise<ApiResponse<FileData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<FileData[]>>(
    `file-management/api/v1/files/folder/${folderId}`,
  );
  return response.data;
};

export const editDocument = async (
  data: Record<string, unknown>,
): Promise<void> => {
  await AxiosInstance.post<ApiResponse<void>>(`/files/file-update`, data);
};

export const searchFiles = async (
  keyword: string,
): Promise<ApiResponse<FileData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<FileData[]>>(
    `/files/search?keyword=${encodeURIComponent(keyword)}`,
  );
  return response.data;
};

export const getDocumentType = async (): Promise<
  ApiResponse<DocumentType[]>
> => {
  const response = await AxiosInstance.get<ApiResponse<DocumentType[]>>(
    "/document-types/all",
  );
  return response.data;
};

export const createDocumentType = async (
  newDocumentType: DocumentType,
): Promise<ApiResponse<DocumentType>> => {
  const response = await AxiosInstance.post<ApiResponse<DocumentType>>(
    "/document-types/create",
    newDocumentType,
  );
  return response.data;
};

export const updateDocumentType = async (
  documentTypeId: number,
): Promise<ApiResponse<DocumentType>> => {
  try {
    const response = await AxiosInstance.put<ApiResponse<DocumentType>>(
      `/document-types/update/${documentTypeId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating document type:", error);
    throw error;
  }
};

export const deleteDocumentType = async (
  documentTypeId: number,
): Promise<ApiResponse<void>> => {
  try {
    const response = await AxiosInstance.delete<ApiResponse<void>>(
      `/document-types/delete/${documentTypeId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting document type:", error);
    throw error;
  }
};

export const deleteFile = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await AxiosInstance.delete<ApiResponse<void>>(
      `file-management/api/v1/files/delete/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting document type:", error);
    throw error;
  }
};

export const getFolders = async (): Promise<ApiResponse<DirectoryData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<DirectoryData[]>>(
    "file-management/api/v1/directories/all",
  );
  return response.data;
};

export const createFolders = async (
  newFolder: Omit<DirectoryData, "folderID">,
): Promise<ApiResponse<DirectoryData>> => {
  try {
    const response = await AxiosInstance.post<ApiResponse<DirectoryData>>(
      "file-management/api/v1/directories/create",
      newFolder,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create folder via API:", error);
    throw error; // Ensure errors are properly propagated
  }
};

export const createSubFolders = async (newFolder: DirectoryData) => {
  try {
    const response = await AxiosInstance.post<ApiResponse<DirectoryData>>(
      "file-management/api/v1/directories/subfolder",
      {
        name: newFolder.name,
        parentFolderID: newFolder.parentFolderID,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error creating subfolder:", error);
    throw error;
  }
};

export const fetchChildFolders = async (parentFolderId: number) => {
  try {
    const response = await AxiosInstance.get<ApiResponse<DirectoryData[]>>(
      `file-management/api/v1/directories/by-parent/${parentFolderId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching child folders:", error);
    throw error;
  }
};

export const deleteFolder = async (folderId: number): Promise<void> => {
  try {
    const response = await AxiosInstance.delete<ApiResponse<void>>(
      `file-management/api/v1/directories/delete/${folderId}`,
    );

    if (!response.data) {
      throw new Error(response.data || "Failed to delete folder");
    }
  } catch (error) {
    console.error("Failed to delete folder", error);
    throw error;
  }
};

export const editFolder = async (
  folderId: number,
  newName: string,
): Promise<void> => {
  try {
    const response = await AxiosInstance.put<ApiResponse<void>>(
      `file-management/api/v1/directories/edit/${folderId}`,
      { name: newName }, // Send the new name in the request body
    );

    if (response.status !== 200) {
      throw new Error("Failed to edit folder");
    }
  } catch (error) {
    console.error("Failed to edit folder", error);
    throw error;
  }
};

export const getDocumentTypes = async () => {
  try {
    const response = await AxiosInstance.get(
      "file-management/api/v1/document-types/all",
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const addDocumentsByFolderId = async (
  files: File[],
  folderId: number,
  documentData?: {
    documentName: string;
    documentType: string;
    metadata: Record<string, any>;
    mimeType?: string;
  },
): Promise<ApiResponse<void>> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  const formData = new FormData();

  // Add document data if provided
  if (documentData) {
    formData.append(
      "fileData",
      new Blob(
        [
          JSON.stringify({
            ...documentData,
            folderID: folderId,
          }),
        ],
        { type: "application/json" },
      ),
    );
  }

  // Add files
  files.forEach((file) => {
    formData.append("file", file);
  });

  try {
    const response = await AxiosInstance.post<ApiResponse<void>>(
      `${ENDPOINT_URL}${folderId}`,
      formData,
      {
        headers: {
          Authorization: authorization,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error;
  }
};
