"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  X,
  ImageIcon,
  FolderOpen,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { DocumentTypeManager } from "./documentTypeManager";
import { MetadataForm } from "./metadataForm";
import {
  type IDocumentType,
  type IDocumentTypeForm,
  deleteDocumentType,
  getDocumentTypes,
  updateDocumentType,
  createDocumentType,
} from "./api";
import { useToast } from "@/hooks/use-toast";
import { bulkFileUpload, getFolders } from "../files/api";
import { FileQueue } from "../FileQueue";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".jpg",
  ".png",
  ".xls",
  ".xlsx",
];

export interface DirectoryData {
  folderID: number;
  id?: number;
  name: string;
  parentFolderID: number;
  documentTypeID?: number;
  createdDate?: string;
  lastModifiedDateTime?: string;
  lastModifiedBy?: number;
  createdBy?: number;
  files?: any[];
}

interface FolderOption {
  folderID: number;
  name: string;
  level: number;
  fullPath: string;
}

interface QueueItem {
  file: File;
  documentType: string;
  metadata: Record<string, any>;
  status: "pending" | "uploading" | "completed" | "error";
}

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (
    file: File,
    documentType: string,
    metadata: Record<string, any>,
    folderID: number | null,
  ) => Promise<void>;
  folderID?: number | null;
}

export default function FileUploadDialog({
  open,
  onClose,
  onUpload,
  folderID: initialFolderID,
}: FileUploadDialogProps) {
  const { toast } = useToast();

  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);
  const [folderOptions, setFolderOptions] = useState<FolderOption[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<IDocumentType | null>(
    null,
  );
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    initialFolderID || null,
  );
  const [isQueueMode, setIsQueueMode] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setSelectedFolderId(initialFolderID || null);
  }, [initialFolderID]);

  useEffect(() => {
    if (selectedDocType) {
      // Initialize metadata with default values from the document type
      const initialMetadata: Record<string, any> = {};
      selectedDocType.metadata.forEach((field) => {
        initialMetadata[field.name] = field.value || "";
      });
      setMetadata(initialMetadata);
    } else {
      setMetadata({});
    }
  }, [selectedDocType]);

  const buildFolderHierarchy = (folders: DirectoryData[]): FolderOption[] => {
    const folderMap = new Map<number, DirectoryData>();
    folders.forEach((folder) => folderMap.set(folder.folderID, folder));

    const buildPath = (
      folderId: number,
      visited = new Set<number>(),
    ): string => {
      if (visited.has(folderId)) return "";
      visited.add(folderId);

      const folder = folderMap.get(folderId);
      if (!folder) return "";

      if (folder.parentFolderID === 0) return folder.name;

      const parentPath = buildPath(folder.parentFolderID, visited);
      return parentPath ? `${parentPath} / ${folder.name}` : folder.name;
    };

    const buildHierarchy = (parentId: number, level = 0): FolderOption[] => {
      const children = folders.filter(
        (folder) => folder.parentFolderID === parentId,
      );
      const result: FolderOption[] = [];

      children.forEach((folder) => {
        const fullPath = buildPath(folder.folderID);
        result.push({
          folderID: folder.folderID,
          name: folder.name,
          level,
          fullPath,
        });
        result.push(...buildHierarchy(folder.folderID, level + 1));
      });

      return result;
    };

    return buildHierarchy(0);
  };

  const fetchFolders = async () => {
    try {
      const foldersResponse = await getFolders();
      if (Array.isArray(foldersResponse)) {
        const folderHierarchy = buildFolderHierarchy(foldersResponse);
        setFolderOptions(folderHierarchy);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const types = await getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error("Failed to fetch document types:", error);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (open) {
      fetchFolders();
    }
  }, [open]);

  const handleCreateDocumentType = async (docType: IDocumentTypeForm) => {
    try {
      const newDocType = await createDocumentType(docType);
      setDocumentTypes((prev) => [...prev, newDocType]);
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
      setDocumentTypes((prev) =>
        prev.map((docType) =>
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
      setDocumentTypes((prev) => prev.filter((docType) => docType.id !== id));
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

  const validateFile = (file: File): boolean => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit");
      return false;
    }
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ALLOWED_TYPES.includes(fileExtension)) {
      setError(
        "Invalid file type. Please upload PDF, DOC, DOCX, TXT, JPG, or PNG files",
      );
      return false;
    }
    return true;
  };

  const handleFileChange = (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    const fileType = selectedFile.type;
    if (fileType.startsWith("image/") || fileType === "application/pdf") {
      const url = URL.createObjectURL(selectedFile);
      setPreviewURL(url);
    } else {
      setPreviewURL(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddToQueue = () => {
    if (!file || !selectedDocType) {
      setError(
        "Please select a file and document type before adding to queue.",
      );
      return;
    }

    const queueItem: QueueItem = {
      file,
      documentType: selectedDocType.name,
      metadata: { ...metadata },
      status: "pending",
    };

    setQueue((prev) => [...prev, queueItem]);
    resetForm();
    toast({
      title: "Added to Queue",
      description: `${file.name} has been added to the upload queue`,
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedDocType) {
      setError("Please select a file and document type.");
      return;
    }

    if (selectedFolderId === null || selectedFolderId === undefined) {
      setError("Please select a valid destination folder.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(file, selectedDocType.name, metadata, selectedFolderId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        resetForm();
        onClose();
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadAll = async () => {
    if (queue.length === 0) {
      setError("No files in queue.");
      return;
    }

    if (selectedFolderId === null || selectedFolderId === undefined) {
      setError("Please select a valid destination folder.");
      return;
    }

    setIsUploading(true);
    try {
      const fileQueue = new FileQueue();
      queue.forEach((item) => {
        fileQueue.enqueue({
          file: item.file,
          documentType: item.documentType,
          documentName: item.file.name,
          mimeType: item.file.type,
          metadata: item.metadata,
        });
      });

      await bulkFileUpload(fileQueue, selectedFolderId);

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${queue.length} files`,
        className: "bg-green-500 text-white",
      });

      setQueue([]);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      setError(error.message || "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewURL(null);
    setMetadata({});
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    setQueue([]);
    setSelectedDocType(null);
    onClose();
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-green-500" />;
  };

  const getStatusIcon = (status: QueueItem["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "uploading":
        return <Upload className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload & Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left Panel - File Upload */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Folder Selection */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Destination Folder
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <select
                  value={selectedFolderId?.toString() || ""}
                  onChange={(e) => setSelectedFolderId(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">📁 Root Directory</option>
                  {folderOptions.map((folder) => (
                    <option
                      key={folder.folderID}
                      value={folder.folderID.toString()}
                    >
                      {"📁 " + "  ".repeat(folder.level) + folder.name}
                    </option>
                  ))}
                </select>
                {selectedFolderId && selectedFolderId > 0 && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <strong>Path:</strong>{" "}
                    {folderOptions.find((f) => f.folderID === selectedFolderId)
                      ?.fullPath || "Unknown"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Drop Zone */}
            <Card className="flex-1">
              <CardContent className="p-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 scale-105"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {!file ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop files here or click to upload
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Supports PDF, DOC, DOCX, TXT, JPG, PNG • Max 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        accept={ALLOWED_TYPES.join(",")}
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileChange(e.target.files[0])
                        }
                      />
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                        className="border-2 border-dashed border-blue-300 hover:border-blue-500"
                      >
                        Choose File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        {getFileIcon(file)}
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setPreviewURL(null);
                          }}
                          className="ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* File Preview */}
                      {previewURL && (
                        <div className="mt-4 border rounded-lg overflow-hidden bg-white">
                          {file.type.startsWith("image/") ? (
                            <img
                              src={previewURL || "/placeholder.svg"}
                              alt="Preview"
                              className="max-w-full max-h-64 object-contain mx-auto"
                            />
                          ) : file.type === "application/pdf" ? (
                            <iframe
                              src={previewURL}
                              className="w-full h-64"
                              title="PDF Preview"
                            />
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Document Management */}
          <div className="w-96 space-y-4 overflow-y-auto">
            {/* Queue Mode Toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Batch Upload Mode</p>
                    <p className="text-xs text-gray-500">
                      Queue multiple files before uploading
                    </p>
                  </div>
                  <Switch
                    checked={isQueueMode}
                    onCheckedChange={setIsQueueMode}
                  />
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
              onSelectDocumentType={setSelectedDocType}
            />

            {/* Metadata Form */}
            {selectedDocType && (
              <MetadataForm
                fields={selectedDocType.metadata || []}
                values={metadata}
                onChange={handleMetadataChange}
              />
            )}

            {/* Queue Display */}
            {isQueueMode && queue.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Upload Queue ({queue.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 max-h-40 overflow-y-auto">
                  {queue.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(item.file)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {item.file.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.documentType}
                            </Badge>
                            {getStatusIcon(item.status)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueue(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {error}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t">
              {isQueueMode ? (
                <>
                  <Button
                    onClick={handleAddToQueue}
                    disabled={!file || !selectedDocType}
                    className="w-full"
                    size="lg"
                  >
                    Add to Queue
                  </Button>
                  <Button
                    onClick={handleUploadAll}
                    disabled={queue.length === 0 || isUploading}
                    className="w-full"
                    size="lg"
                    variant="default"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload All ({queue.length})
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleUpload}
                  disabled={!file || !selectedDocType || isUploading}
                  className="w-full"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full bg-transparent"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
