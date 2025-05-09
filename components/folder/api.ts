"use client";

import { AxiosInstance } from "../routes/api";

export interface IDocumentType {
  id: number;
  name: string;
  metadata: MetadataItem[];
  createdDate?: string;
  lastModifiedDateTime?: string;
  documentTypeId?: number;
}

export interface IDocumentTypeForm {
  name: string;
  metadata: MetadataItem[];
}

export interface MetadataItem {
  options?: string[];
  name: string;
  type: string;
  value: string;
}

export async function getDocumentTypes(): Promise<IDocumentType[]> {
  const { data } = await AxiosInstance.get(
    "file-management/api/v1/document-types/all",
  );
  return data;
}

export async function createDocumentType(
  data: IDocumentTypeForm,
): Promise<IDocumentType> {
  const { data: response } = await AxiosInstance.post(
    "file-management/api/v1/document-types/create",
    data,
  );
  return response;
}

export async function updateDocumentType(
  id: number,
  data: IDocumentTypeForm,
): Promise<IDocumentType> {
  const { data: response } = await AxiosInstance.put(
    `file-management/api/v1/document-types/${id}`,
    data,
  );
  return response;
}

export async function deleteDocumentType(id: number): Promise<void> {
  await AxiosInstance.delete(
    `file-management/api/v1/document-types/delete/${id}`,
  );
}

export async function updateFileWithDocumentType(
  documentId: number,
  documentType: string,
): Promise<void> {
  await AxiosInstance.put(
    `/file-management/api/v1/files/file/${documentId}/document-type`,
    {
      documentType,
    },
  );
}

export async function addMetadata(
  id: number,
  metadata: MetadataItem,
): Promise<IDocumentType> {
  const { data: response } = await AxiosInstance.post(
    `file-management/api/v1/document-types/${id}/add-metadata`,
    metadata,
  );
  return response;
}

export async function updateMetadata(
  id: number,
  metadataId: number,
  metadata: MetadataItem,
): Promise<IDocumentType> {
  const { data: response } = await AxiosInstance.put(
    `file-management/api/v1/document-types/${id}/update-metadata/${metadataId}`,
    metadata,
  );
  return response;
}

export async function deleteMetadata(
  id: number,
  metadataId: number,
): Promise<IDocumentType> {
  const { data: response } = await AxiosInstance.delete(
    `file-management/api/v1/document-types/${id}/delete-metadata/${metadataId}`,
  );
  return response;
}
