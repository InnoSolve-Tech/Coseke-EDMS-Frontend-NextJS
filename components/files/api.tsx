"use client";

import axios from "axios";
import { AxiosInstance } from "../routes/api";
import { getTokenFromSessionStorage } from "../routes/sessionStorage";
import { FileQueue } from "../FileQueue";

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
  versions: any;
  comments: never[];
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
  length: number;
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

interface VersionComment {
  id: number;
  content: string;
  createdDate: string;
  createdBy: number;
  versionId: number;
}

interface CreateVersionCommentDTO {
  content: string;
  versionId: number;
}

interface UpdateVersionCommentDTO {
  content: string;
}

export const addDocument = async (
  file: File,
  data: any,
  folderId: number, // ✅ folderId should be correct here
): Promise<void> => {
  let formData = new FormData();

  console.log("📌 API Call - Folder ID Received:", folderId); // ✅ Debug log
  console.log("📤 FileData:", data);
  console.log("📂 FormData before sending:", formData);

  formData.append(
    "fileData",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  formData.append("file", file);

  try {
    let res = await axios.post(
      `http://localhost:8081/${ENDPOINT_URL}${folderId}`, // ✅ Check if this is `4`
      formData,
      {
        headers: {
          "X-Proxy-Secret": "my-proxy-secret-key",
          "Content-Type": "multipart/form-data",
        },
      },
    );

    console.log("✅ Upload response:", res);
  } catch (error) {
    console.error("❌ Error uploading document:", error);
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
  newDocumentTypeData: DocumentType,
): Promise<ApiResponse<DocumentType>> => {
  try {
    const response = await AxiosInstance.put<ApiResponse<DocumentType>>(
      `/document-types/update/${documentTypeId}`,
      newDocumentTypeData,
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

export const updateMetadata = async (
  fileId: number,
  newMetadata: Record<string, unknown>,
): Promise<ApiResponse<FileData>> => {
  try {
    const response = await AxiosInstance.post<ApiResponse<FileData>>(
      `${ENDPOINT_URL}${fileId}/metadata`,
      newMetadata,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating metadata:", error);
    throw error;
  }
};

/**
 * Delete specific metadata keys for a file.
 * @param fileId - The ID of the file.
 * @param keys - List of metadata keys to be removed.
 */
export const deleteMetadata = async (
  fileId: number,
  keys: string[],
): Promise<ApiResponse<FileData>> => {
  try {
    const response = await AxiosInstance.delete<ApiResponse<FileData>>(
      `${ENDPOINT_URL}${fileId}/metadata`,
      {
        data: keys,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting metadata:", error);
    throw error;
  }
};

/**
 * Clear all metadata for a file.
 * @param fileId - The ID of the file.
 */
export const clearMetadata = async (
  fileId: number,
): Promise<ApiResponse<FileData>> => {
  try {
    const response = await AxiosInstance.delete<ApiResponse<FileData>>(
      `${ENDPOINT_URL}${fileId}/metadata/all`,
    );
    return response.data;
  } catch (error) {
    console.error("Error clearing metadata:", error);
    throw error;
  }
};

export const getAllFiles = async (): Promise<ApiResponse<FileData[]>> => {
  try {
    const response = await AxiosInstance.get<ApiResponse<FileData[]>>(
      `${ENDPOINT_URL}allfiles`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all files:", error);
    throw error;
  }
};

export const bulkFileUpload = async (
  queue: FileQueue,
  folderID?: number,
): Promise<any> => {
  try {
    const formData = new FormData();
    const queueItems = queue.getItems();

    // Add each file with its corresponding data
    queueItems.forEach((item, index) => {
      formData.append(`file_${index}`, item.file);
      formData.append(
        `fileData_${index}`,
        item.fileData ||
          JSON.stringify({
            documentType: item.documentType,
            documentName: item.file.name,
            mimeType: item.file.type || "application/pdf",
            metadata: item.metadata || {},
            folderID: folderID,
          }),
      );
    });

    const token = getTokenFromSessionStorage();
    const authorization = `Bearer ${JSON.parse(token!)}`;

    // Log the FormData contents for debugging
    for (let [key, value] of formData.entries()) {
      console.log(
        `${key}:`,
        value instanceof File
          ? { name: value.name, type: value.type, size: value.size }
          : value,
      );
    }

    const response = await axios.post(
      `http://localhost:8081/${ENDPOINT_URL}bulk/${folderID}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Proxy-Secret": "my-proxy-secret-key",
          Authorization: authorization,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      },
    );

    return response.data;
  } catch (error: any) {
    console.error("Bulk upload error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

export const bulkUpload = async (
  files: File[],
  folderID: number,
  metadataList: Record<string, any>[],
  onProgress?: (progress: number) => void,
) => {
  try {
    const formData = new FormData();

    // Append each file
    files.forEach((file) => {
      formData.append("files", file);
    });

    // Append metadata
    const fileData = metadataList.map((metadata, index) => ({
      documentType: metadata.documentType || "default",
      documentName: files[index]?.name || `File_${index}`,
      mimeType: files[index]?.type || "application/octet-stream",
      metadata: metadata.metadata || {},
    }));

    formData.append("fileData", JSON.stringify(fileData));

    // Perform upload request
    const response = await axios.post(
      `http://localhost:8081/${ENDPOINT_URL}bulk/${folderID}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Proxy-Secret": "my-proxy-secret-key",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            const percentCompleted = Math.round(
              (event.loaded / event.total) * 100,
            );
            onProgress(percentCompleted);
          }
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

// Add a comment
export const addComment = async (
  documentId: number,
  content: string,
  userId: number,
) => {
  try {
    const response = await AxiosInstance.post(
      `${ENDPOINT_URL}document/${documentId}`,
      {
        userId,
        content,
      },
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Failed to add comment");
  }
};

// Fetch comments by document ID
export const getCommentsByDocument = async (documentId: number) => {
  try {
    const response = await AxiosInstance.get(
      `${ENDPOINT_URL}getComments/${documentId}`,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Failed to fetch comments");
  }
};

export const updateComment = async (
  commentId: number,
  content: string,
  userId: number,
) => {
  try {
    const response = await AxiosInstance.put(`${ENDPOINT_URL}${commentId}`, {
      content,
      userId,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Error updating comment:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data || "You are not authorized to update this comment",
    );
  }
};

// Delete comment by ID
export const deleteComment = async (commentId: number, userId: number) => {
  try {
    const response = await AxiosInstance.delete(`${ENDPOINT_URL}${commentId}`, {
      data: { userId }, // Ensure the backend expects this in the request body
    });

    return response.data; // Ensure response is returned
  } catch (error: any) {
    console.error(
      "Error deleting comment:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data || "Failed to delete comment (unauthorized)",
    );
  }
};

export const getAllCommentsForVersion = async (
  versionId: number,
): Promise<VersionComment[]> => {
  const response = await AxiosInstance.get<ApiResponse<VersionComment[]>>(
    `${ENDPOINT_URL}version/${versionId}`,
  );
  return response.data.data;
};

export const getVersionCommentById = async (
  commentId: number,
): Promise<VersionComment> => {
  const response = await AxiosInstance.get<ApiResponse<VersionComment>>(
    `${ENDPOINT_URL}${commentId}`,
  );
  return response.data.data;
};

export const createVersionComment = async (
  commentData: CreateVersionCommentDTO,
): Promise<VersionComment> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  const response = await AxiosInstance.post<ApiResponse<VersionComment>>(
    ENDPOINT_URL,
    commentData,
    {
      headers: { Authorization: authorization },
    },
  );
  return response.data.data;
};

export const updateVersionComment = async (
  commentId: number,
  commentData: UpdateVersionCommentDTO,
): Promise<VersionComment> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  const response = await AxiosInstance.put<ApiResponse<VersionComment>>(
    `${ENDPOINT_URL}${commentId}`,
    commentData,
    {
      headers: { Authorization: authorization },
    },
  );
  return response.data.data;
};

export const deleteVersionComment = async (
  commentId: number,
): Promise<void> => {
  const token = getTokenFromSessionStorage();
  const authorization = `Bearer ${JSON.parse(token!)}`;

  await AxiosInstance.delete(`${ENDPOINT_URL}${commentId}`, {
    headers: { Authorization: authorization },
  });
};
