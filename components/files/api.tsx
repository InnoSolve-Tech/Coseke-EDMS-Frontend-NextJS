"use client";

import axios from "axios";
import { getTokenFromSessionStorage } from "../routes/sessionStorage";
import { AxiosInstance } from "../routes/api";

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
  name: string;
  type: string;
  folderId: number;
  createdDate: string;
  lastModifiedDate: string;
};

type ApiResponse<T> = {
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

export const addDocument = async (data: DocumentProps, file: File): Promise<void> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  const formData = new FormData();
  formData.append(
    "fileData",
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );
  formData.append("file", file);

  try {
    const response = await AxiosInstance.post<ApiResponse<void>>(ENDPOINT_URL, formData, {
      headers: {
        Authorization: authorization,
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(response);
  } catch (error) {
    console.error("Error uploading document:", error);
  }
};

export const addDocumentByFolderId = async (
  data: { documentName: string },
  file: File,
  folderId: number
): Promise<void> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  const formData = new FormData();
  formData.append(
    "fileData",
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );
  formData.append("file", file);

  try {
    const response = await axios.post<ApiResponse<void>>(`${ENDPOINT_URL}${folderId}`, formData, {
      headers: {
        Authorization: authorization,
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(response);
  } catch (error) {
    console.error("Error uploading document:", error);
  }
};

export const getFiles = async (): Promise<ApiResponse<FileData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<FileData[]>>(
    "file-management/api/v1/files/stored"
  );
  return response.data;
};

export const getFilesByFolderID = async (
  folderId: number
): Promise<ApiResponse<FileData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<FileData[]>>(
    `/files/folder/${folderId}`
  );
  return response.data;
};

export const editDocument = async (data: Record<string, unknown>): Promise<void> => {
  await AxiosInstance.post<ApiResponse<void>>(`/files/file-update`, data);
};

export const searchFiles = async (keyword: string): Promise<ApiResponse<FileData[]>> => {
  const response = await AxiosInstance.get<ApiResponse<FileData[]>>(
    `/files/search?keyword=${encodeURIComponent(keyword)}`
  );
  return response.data;
};

export const getDocumentType = async (): Promise<ApiResponse<DocumentType[]>> => {
  const response = await AxiosInstance.get<ApiResponse<DocumentType[]>>(
    "/document-types/all"
  );
  return response.data;
};

export const createDocumentType = async (
  newDocumentType: DocumentType
): Promise<ApiResponse<DocumentType>> => {
  const response = await AxiosInstance.post<ApiResponse<DocumentType>>(
    "/document-types/create",
    newDocumentType
  );
  return response.data;
};

export const updateDocumentType = async (
  documentTypeId: number
): Promise<ApiResponse<DocumentType>> => {
  try {
    const response = await AxiosInstance.put<ApiResponse<DocumentType>>(
      `/document-types/update/${documentTypeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error updating document type:", error);
    throw error;
  }
};

export const deleteDocumentType = async (
  documentTypeId: number
): Promise<ApiResponse<void>> => {
  try {
    const response = await AxiosInstance.delete<ApiResponse<void>>(
      `/document-types/delete/${documentTypeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting document type:", error);
    throw error;
  }
};

export const deleteFile = async (
    documentTypeId: number
  ): Promise<ApiResponse<void>> => {
    try {
      const response = await AxiosInstance.delete<ApiResponse<void>>(
        `/document-types/delete/${documentTypeId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting document type:", error);
      throw error;
    }
  };

  export const getFolders = async (): Promise<ApiResponse<DirectoryData[]>> => {
    const response = await AxiosInstance.get<ApiResponse<DirectoryData[]>>(
      "file-management/api/v1/directories/all"
    );
    return response.data;
  };

  export const createFolders = async (
    newFolder: Omit<DirectoryData, "folderID">
): Promise<ApiResponse<DirectoryData>> => {
    try {
        const response = await AxiosInstance.post<ApiResponse<DirectoryData>>(
            "file-management/api/v1/directories/create",
            newFolder
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
        parentFolderID: newFolder.parentFolderID
      }
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
      `file-management/api/v1/directories/by-parent/${parentFolderId}`
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
        `file-management/api/v1/directory/delete/${folderId}`
      );
  
      if (!response.data) {
        throw new Error(response.data || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Failed to delete folder', error);
      throw error;
    }
  };

  export const getDocumentTypes = async () => {
    try {
      const response = await AxiosInstance.get("file-management/api/v1/document-types/all");
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
    }
  ): Promise<void> => {
    const token = getTokenFromSessionStorage();
    const authorization = `Bearer ${JSON.parse(token!)}`;
  
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
  
    // Add document data if provided
    if (documentData) {
      formData.append(
        "documentData",
        new Blob([JSON.stringify(documentData)], { type: "application/json" })
      );
    }
  
    try {
      const response = await axios.post<ApiResponse<void>>(
        `${ENDPOINT_URL}bulk/${folderId}`,
        formData,
        {
          headers: {
            Authorization: authorization,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response);
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  };