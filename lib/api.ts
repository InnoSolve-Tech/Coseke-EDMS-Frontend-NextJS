"use client";

import axios from "axios";
import { FileData } from "@/types/file";

export interface DirectoryData {
  id?: number;
  name: string;
  folderID?: number;
  parentFolderID?: number;
}

// Folders API
export const getFolders = async () => {
  const response = await axios.get("/api/v1/folders");
  return response.data;
};

export const createFolders = async (folderData: Omit<DirectoryData, "id">) => {
  const response = await axios.post("/api/v1/folders", folderData);
  return response.data;
};

export const createSubFolders = async (folderData: DirectoryData) => {
  const response = await axios.post("/api/v1/folders/sub", folderData);
  return response.data;
};

export const editFolder = async (folderId: number, name: string) => {
  const response = await axios.put(`/api/v1/folders/${folderId}`, { name });
  return response.data;
};

export const deleteFolder = async (folderId: number) => {
  const response = await axios.delete(`/api/v1/folders/${folderId}`);
  return response.data;
};

// Files API
export const getFiles = async () => {
  const response = await axios.get("/api/v1/files");
  return response.data;
};

export const getFilesByFolderID = async (folderId: number) => {
  const response = await axios.get(`/api/v1/files/folder/${folderId}`);
  return response.data;
};

export const getFilesByHash = async (hash: string) => {
  const response = await axios.get(`/api/v1/files/hash/${hash}`);
  return response.data;
};

export const deleteFile = async (fileId: number) => {
  const response = await axios.delete(`/api/v1/files/${fileId}`);
  return response.data;
};

// Document Types API
export const getDocumentTypes = async () => {
  const response = await axios.get("/api/v1/document-types");
  return response.data;
};

// Child Folders API
export const fetchChildFolders = async (parentId: number) => {
  const response = await axios.get(`/api/v1/folders/${parentId}/children`);
  return response.data;
};
