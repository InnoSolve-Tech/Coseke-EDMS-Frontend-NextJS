"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Save,
  FileText,
  Calendar,
  User,
  Folder,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MetadataForm } from "@/components/folder/metadataForm";
import type { IDocumentType } from "@/components/folder/api";
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
    null,
  );
  const [isEditingDocType, setIsEditingDocType] = useState(false);

  // Auto-select the document type based on the document's assigned type
  useEffect(() => {
    if (document && document.documentType && documentTypes.length > 0) {
      const matchingType = documentTypes.find(
        (type) => type.name === document.documentType,
      );
      if (matchingType) {
        setSelectedDocType(matchingType);
      }
    }
  }, [document, documentTypes]);

  const handleDocumentTypeChangeInternal = (value: string) => {
    const docType = documentTypes.find((dt) => dt.id.toString() === value);
    if (docType) {
      setSelectedDocType(docType);
      handleDocumentTypeChange(value);
      setIsEditingDocType(false);
    }
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
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>Created by: User {document.createdBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="h-3 w-3" />
                <span>Folder ID: {document.folderID}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Document Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Document Type
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDocType(!isEditingDocType)}
                className="h-6 px-2"
              >
                {isEditingDocType ? (
                  <X className="h-3 w-3" />
                ) : (
                  <Edit2 className="h-3 w-3" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!isEditingDocType ? (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-sm">
                  {selectedDocType?.name ||
                    document.documentType ||
                    "No Type Assigned"}
                </Badge>
                {selectedDocType && (
                  <Badge variant="outline" className="text-xs">
                    {selectedDocType.metadata.length} fields
                  </Badge>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Select
                  value={selectedDocType?.id.toString() || ""}
                  onValueChange={handleDocumentTypeChangeInternal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{type.name}</span>
                          <Badge variant="outline" className="text-xs ml-2">
                            {type.metadata.length} fields
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (selectedDocType) {
                        handleDocumentTypeChangeInternal(
                          selectedDocType.id.toString(),
                        );
                      }
                    }}
                    className="flex-1"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditingDocType(false)}
                    className="flex-1"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* No Document Type Assigned */}
        {!selectedDocType && (
          <Card className="border-dashed border-yellow-300 bg-yellow-50">
            <CardContent className="p-6 text-center text-yellow-700">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No Document Type Assigned</p>
              <p className="text-xs mb-3">
                Assign a document type to enable metadata editing
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingDocType(true)}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Assign Type
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            className="w-full"
            size="lg"
            disabled={!selectedDocType}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
