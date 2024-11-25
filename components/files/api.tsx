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
  data: T;
  message?: string;
};

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

export const addDocumentsByFolderId = async (
  files: File[],
  folderId: number
): Promise<void> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await axios.post<ApiResponse<void>>(`${ENDPOINT_URL}bulk/${folderId}`, formData, {
      headers: {
        Authorization: authorization,
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(response);
  } catch (error) {
    console.error("Error uploading documents:", error);
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

export const allFiles = async (
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
