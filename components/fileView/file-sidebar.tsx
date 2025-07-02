"use client";

import type React from "react";

import { useState } from "react";
import { Save, FileText, Calendar, User, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DocumentTypeManager } from "@/components/folder/documentTypeManager";
import { MetadataForm } from "@/components/folder/metadataForm";
import {
  type IDocumentType,
  type IDocumentTypeForm,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
} from "@/components/folder/api";
import { useToast } from "@/hooks/use-toast";

interface MetadataItem {
  name: string;
  type: string;
  value: string;
  options?: any;
}

interface Metadata {
  [key: string]: string | string[];
}

interface Document {
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
  version?: React.ReactNode;
}

interface FileSidebarProps {
  document: Document;
  setDocument: (doc: Document) => void;
  documentTypes: IDocumentType[];
  setDocumentTypes: (types: IDocumentType[]) => void;
  handleMetadataChange: (key: string, value: string) => void;
  handleDeleteMetadata: (key: string) => void;
  handleSubmit: () => void;
  currentDocTypeId: string | null;
  handleDocumentTypeChange: (value: string) => void;
}

export function FileSidebar({
  document,
  setDocument,
  documentTypes,
  setDocumentTypes,
  handleMetadataChange,
  handleDeleteMetadata,
  handleSubmit,
  currentDocTypeId,
  handleDocumentTypeChange,
}: FileSidebarProps) {
  const { toast } = useToast();
  const [selectedDocType, setSelectedDocType] = useState<IDocumentType | null>(
    currentDocTypeId
      ? documentTypes.find((dt) => dt.id.toString() === currentDocTypeId) ||
          null
      : null,
  );

  const handleCreateDocumentType = async (docType: IDocumentTypeForm) => {
    try {
      const newDocType = await createDocumentType(docType);
      setDocumentTypes([...documentTypes, newDocType]);
      toast({
        title: "Success",
        description: "Document type created successfully",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create document type",
      });
    }
  };

  const handleUpdateDocumentType = async (
    id: number,
    updatedFields: Partial<IDocumentTypeForm>,
  ) => {
    try {
      const originalDocType = documentTypes.find(
        (docType) => docType.id === id,
      );
      if (!originalDocType) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Document type not found",
        });
        return;
      }

      const updatedDocTypeData: IDocumentTypeForm = {
        name: updatedFields.name || originalDocType.name,
        metadata: updatedFields.metadata || originalDocType.metadata,
      };

      const updatedDocType = await updateDocumentType(id, updatedDocTypeData);
      setDocumentTypes(
        documentTypes.map((docType) =>
          docType.id === id ? { ...docType, ...updatedDocType } : docType,
        ),
      );

      if (selectedDocType?.id === id) {
        setSelectedDocType({ ...selectedDocType, ...updatedDocType });
      }

      toast({
        title: "Success",
        description: "Document type updated successfully",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document type",
      });
    }
  };

  const handleDeleteDocumentType = async (id: number) => {
    try {
      await deleteDocumentType(id);
      setDocumentTypes(documentTypes.filter((docType) => docType.id !== id));
      if (selectedDocType?.id === id) {
        setSelectedDocType(null);
      }
      toast({
        title: "Success",
        description: "Document type deleted successfully",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document type",
      });
    }
  };

  const handleSelectDocumentType = (docType: IDocumentType | null) => {
    setSelectedDocType(docType);
    if (docType) {
      handleDocumentTypeChange(docType.id.toString());
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Convert document metadata to the format expected by MetadataForm
  const metadataValues = Object.entries(document.metadata || {}).reduce(
    (acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value.join(", ") : value;
      return acc;
    },
    {} as Record<string, any>,
  );

  return (
    <div className="w-96 bg-background border-l border-border h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Document Info Header */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p
                className="font-medium text-sm text-gray-900 truncate"
                title={document.filename}
              >
                {document.filename}
              </p>
              <p className="text-xs text-gray-500">{document.documentName}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {document.mimeType}
              </Badge>
              {document.version && (
                <Badge variant="outline" className="text-xs">
                  v{document.version}
                </Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Created: {formatDate(document.createdDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>
                  Modified: {formatDate(document.lastModifiedDateTime)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Type Management */}
        <DocumentTypeManager
          documentTypes={documentTypes}
          onCreateDocumentType={handleCreateDocumentType}
          onUpdateDocumentType={handleUpdateDocumentType}
          onDeleteDocumentType={handleDeleteDocumentType}
          selectedDocType={selectedDocType}
          onSelectDocumentType={handleSelectDocumentType}
        />

        {/* Metadata Form */}
        {selectedDocType &&
          selectedDocType.metadata &&
          selectedDocType.metadata.length > 0 && (
            <MetadataForm
              fields={selectedDocType.metadata}
              values={metadataValues}
              onChange={handleMetadataChange}
            />
          )}

        {/* No Metadata Message */}
        {selectedDocType &&
          (!selectedDocType.metadata ||
            selectedDocType.metadata.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No metadata fields configured</p>
                <p className="text-xs">
                  This document type doesn't have any custom fields
                </p>
              </CardContent>
            </Card>
          )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t">
          <Button onClick={handleSubmit} className="w-full" size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
