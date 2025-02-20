"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { FileText, Pencil, Plus, Save, Trash, Upload, X } from "lucide-react";
import type { WebViewerInstance } from "@pdftron/webviewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  type IDocumentType,
  type IDocumentTypeForm,
  deleteDocumentType,
  getDocumentTypes,
  updateDocumentType,
} from "./api";
import { useToast } from "@/hooks/use-toast";
import { bulkFileUpload, getFolders } from "../files/api";
import { FileQueue } from "../FileQueue";
import { Typography } from "@mui/joy";
import { DocumentTypeCreation } from "./DocumentTypes";

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

interface QueueProps {
  items: { file: File; documentType: string; metadata: Record<string, any> }[];
  onRemove: (index: number) => void;
}

interface FolderOption {
  id: number;
  name: string;
  level: number;
}

const Queue: React.FC<QueueProps> = ({ items, onRemove }) => {
  return (
    <div className="mt-4 border border-gray-200 rounded-md p-4">
      <h3 className="text-lg font-semibold mb-2">Queued Files</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
          >
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>
                {item.file.name} - {item.documentType}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

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

interface FileNode {
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

interface SearchMatchInfo {
  label: boolean;
  metadata: boolean;
}

export default function FileUploadDialog({
  open,
  onClose,
  onUpload,
  folderID: initialFolderID,
}: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<IDocumentType | null>(
    null,
  );
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<IDocumentType | null>(
    null,
  );
  const [editedName, setEditedName] = useState("");
  const viewerRef = useRef<HTMLDivElement>(null);
  const webViewerInstance = useRef<WebViewerInstance | null>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [queue, setQueue] = useState<FileQueue>(new FileQueue());
  const [isQueueMode, setIsQueueMode] = useState(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);
  const [folderOptions, setFolderOptions] = useState<FolderOption[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    initialFolderID || null,
  );

  const { toast } = useToast();

  useEffect(() => {
    setSelectedFolderId(initialFolderID || null);
  }, [initialFolderID]);

  const fetchFolders = async () => {
    try {
      console.log("Fetching folders...");
      const foldersResponse = await getFolders(); // Fetch folder data from API
      console.log("Fetched folders:", foldersResponse); // ✅ Check API response

      if (!Array.isArray(foldersResponse)) {
        console.error("Invalid folder response:", foldersResponse);
        return;
      }

      // Ensure folderID and name exist
      const buildFolderOptions = (
        nodes: any[],
        level: number = 0,
      ): FolderOption[] => {
        let options: FolderOption[] = [];
        for (const node of nodes) {
          if (node.folderID && node.name) {
            // ✅ Ensure valid folder data
            options.push({
              id: node.folderID,
              name: node.name,
              level: level,
            });
            if (node.children && Array.isArray(node.children)) {
              options = [
                ...options,
                ...buildFolderOptions(node.children, level + 1),
              ];
            }
          }
        }
        return options;
      };

      const folderHierarchy = buildFolderOptions(foldersResponse);
      console.log("Processed folder options:", folderHierarchy); // ✅ Log processed folders

      setFolderOptions(folderHierarchy); // ✅ Store structured folders in state
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  // Ensure fetchFolders runs when the dialog opens
  useEffect(() => {
    if (open) {
      fetchFolders();
    }
  }, [open]);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (open) {
      setIsViewerLoaded(false);
      webViewerInstance.current = null;
      if (viewerRef.current) {
        viewerRef.current.innerHTML = "";
      }
    }
  }, [open]);

  useEffect(() => {
    if (selectedDocType) {
      setMetadata(
        selectedDocType.metadata.reduce(
          (acc, field) => ({
            ...acc,
            [field.name]: field.type === "select" ? "" : field.value || "",
          }),
          {},
        ),
      );
    } else {
      setMetadata({});
    }
  }, [selectedDocType]);

  const fetchDocumentTypes = async () => {
    try {
      const types = await getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error("Failed to fetch document types:", error);
    }
  };

  const loadWebViewer = async () => {
    if (!viewerRef.current) return;

    // If an instance exists, destroy it first
    if (webViewerInstance.current) {
      webViewerInstance.current.UI.dispose(); // Properly clean up the instance
      webViewerInstance.current = null;
      setIsViewerLoaded(false);
    }

    try {
      const viewer = await import("@pdftron/webviewer");
      const instance = await (window as any).WebViewer(
        {
          path: "/lib",
          enableOfficeEditing: true,
          enableFilePicker: true,
          enableMultipleViewerMerging: true,
          apiKey:
            "demo:1738607170548:616f59ff03000000007a9bceb1ad873e0fd71f2b4fb84257cc6dd11033",
        },
        viewerRef.current,
      );

      webViewerInstance.current = instance;
      setIsViewerLoaded(true);
      setHasLoadedBefore(true);

      instance.UI.addEventListener("documentLoaded", async () => {
        const doc = instance.Core.documentViewer.getDocument();
        const filename = await doc.getFilename();
        setCurrentDoc({ filename, doc });
      });

      instance.UI.addEventListener("documentUnloaded", () => {
        setCurrentDoc(null);
      });
    } catch (error) {
      console.error("Error loading WebViewer:", error);
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
        ...originalDocType,
        ...updatedFields,
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

      setEditingDocType(null);
      setEditedName("");
      setEditDialogOpen(false);

      toast({
        title: "Success",
        description: "Document type updated successfully",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Failed to update document type:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document type. Please try again.",
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
      console.error("Failed to delete document type:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document type. Please try again.",
      });
    }
  };

  // Removed handleFileChange function

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

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddToQueue = async () => {
    if (!webViewerInstance.current || !selectedDocType) {
      setError(
        "Please load a document and select a document type before adding to queue.",
      );
      return;
    }

    const instance = webViewerInstance.current;
    const documentViewer = instance.Core.documentViewer;
    const doc = documentViewer.getDocument();

    if (!doc) {
      setError("No document loaded in WebViewer.");
      return;
    }

    try {
      const fileData = await doc.getFileData({});
      const fileType = doc.getType() || "application/pdf";
      const fileName = doc.getFilename();

      const fileBlob = new Blob([fileData], { type: fileType });
      const extractedFile = new File([fileBlob], fileName, {
        type: fileType,
      });

      // Create new queue item with all necessary data
      const queueItem = {
        file: extractedFile,
        documentType: selectedDocType.name,
        documentName: fileName,
        mimeType: fileType,
        metadata: { ...metadata },
      };

      const newQueue = new FileQueue(queue.getItems());
      newQueue.enqueue(queueItem);

      setQueue(newQueue);
      resetForm();

      toast({
        title: "Success",
        description: "File added to queue",
      });
    } catch (error) {
      console.error("Error adding file to queue:", error);
      setError("Failed to add file to queue. Please try again.");
    }
  };

  const handleUpload = async () => {
    if (!webViewerInstance.current) {
      setError("WebViewer is not initialized");
      return;
    }

    console.log(
      "🚀 Uploading to folder ID (Before API Call):",
      selectedFolderId,
    );

    if (selectedFolderId === null || selectedFolderId === undefined) {
      setError("Please select a valid destination folder.");
      return;
    }

    const instance = webViewerInstance.current;
    const documentViewer = instance.Core.documentViewer;
    const currentDoc = documentViewer.getDocument();

    if (!currentDoc) {
      setError("No document loaded in WebViewer");
      return;
    }

    try {
      const fileExtension = currentDoc
        .getFilename()
        .split(".")
        .pop()
        ?.toLowerCase();
      let mimeType = getMimeTypeFromExtension(fileExtension); // Use a helper function to get MIME type
      const fileName = currentDoc.getFilename();

      const fileData = await currentDoc.getFileData({});
      const fileBlob = new Blob([fileData], { type: mimeType });
      const file = new File([fileBlob], fileName, { type: mimeType });

      // Set the MIME type to 'pdf' in the metadata
      const uploadMetadata = {
        ...metadata,
        mimeType: "pdf", // Change this line to set the MIME type to 'pdf'
      };

      console.log("📤 Sending file:", file.name);
      console.log("✅ MIME Type:", file.type);
      console.log("✅ Confirming folder ID being sent:", selectedFolderId);

      // Pass `uploadMetadata` correctly to `onUpload`
      await onUpload(
        file,
        selectedDocType?.name || "Unknown",
        uploadMetadata,
        selectedFolderId,
      );

      // Reset form and close dialog after successful upload
      setFile(null);
      setPreviewURL(null);
      setSelectedDocType(null);
      setMetadata({});
      setUploadProgress(100);
      onClose();
    } catch (error) {
      console.error("❌ Error during upload:", error);
      setError("Failed to upload file. Please try again.");
    }
  };

  const handleUploadAll = async () => {
    if (queue.isEmpty()) {
      setError("No files in queue.");
      return;
    }

    console.log("BulkUpload - Selected Folder ID:", selectedFolderId);
    console.log("BulkUpload - Folder ID type:", typeof selectedFolderId);

    if (selectedFolderId === null || selectedFolderId === undefined) {
      setError("Please select a valid destination folder.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create an array of files and corresponding data
      const files = queue.getItems().map((item) => item.file);
      const fileData = queue.getItems().map((item) => ({
        documentType: item.documentType,
        metadata: item.metadata,
        filename: item.file.name,
      }));

      // Create FormData
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append("files", file);
      });
      formData.append("fileData", JSON.stringify(fileData));

      // Pass the selected folder ID to the upload function
      await bulkFileUpload(queue, selectedFolderId);

      toast({
        title: "Success",
        description: `Successfully uploaded ${queue.getItems().length} files`,
        className: "bg-green-500 text-white",
      });

      setQueue(new FileQueue());
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload files");
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSelectedDocType(null);
    setMetadata({});
    setError(null);
    if (viewerRef.current) {
      viewerRef.current.innerHTML = "";
    }
    setIsViewerLoaded(false);
  };

  const handleClose = () => {
    resetForm();
    setIsViewerLoaded(false);

    // Properly dispose of WebViewer when closing
    if (webViewerInstance.current) {
      webViewerInstance.current.UI.dispose();
      webViewerInstance.current = null;
    }

    onClose();
  };

  const handleCreateNewDocType = (newDocType: IDocumentType) => {
    setDocumentTypes((prev) => [...prev, newDocType]);
    setSelectedDocType(newDocType);
    setShowDocTypeDialog(false);
  };

  const handleFileSelection = () => {
    if (webViewerInstance.current && selectedDocType) {
      if (isQueueMode) {
        handleAddToQueue(); // ✅ Correctly adds file to queue
      } else {
        setShowUploadPrompt(true);
      }
    } else {
      setError(
        "Please load a document and select a document type before uploading.",
      );
    }
  };

  // Helper function to get MIME type from file extension
  const getMimeTypeFromExtension = (extension: string | undefined): string => {
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      // Add more mappings as needed
    };
    return mimeTypes[extension || ""] || "application/octet-stream"; // Fallback to a generic binary type
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl p-0 max-h-[180vh] overflow-hidden flex flex-col bg-opacity-100 bg-white rounded-lg shadow-lg">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-semibold">
            Document Upload & Preview
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 mt-4">
          <Typography level="body-sm" sx={{ mb: 1 }}>
            Select Destination Folder
          </Typography>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <select
              value={selectedFolderId || ""}
              onChange={(e) => {
                const newFolderId = Number(e.target.value);
                console.log("Folder selected:", {
                  id: newFolderId,
                  value: e.target.value,
                  type: typeof newFolderId,
                });
                setSelectedFolderId(newFolderId);
              }}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
                backgroundColor: "#ffffff",
                color: "#333333",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "border-color 0.2s ease",
                position: "relative",
                zIndex: 10,
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = "#bdbdbd")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor = "#e0e0e0")
              }
            >
              <option value="">Select a folder</option>
              <option value="0">Root</option>
              {folderOptions.length > 0 ? (
                folderOptions.map((folder) => (
                  <option
                    key={folder.id}
                    value={folder.id}
                    style={{
                      paddingLeft: `${folder.level * 20}px`,
                      backgroundColor:
                        folder.level % 2 === 0 ? "#ffffff" : "#fafafa",
                    }}
                  >
                    {"└─".repeat(folder.level)} {folder.name}
                  </option>
                ))
              ) : (
                <option disabled>No folders found (Check console logs)</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* File Upload Section */}

          <div className="flex flex-col md:w-2/3 bg-gray-50 border p-4 rounded-lg shadow-sm relative min-h-[400px]">
            {!isViewerLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center h-full bg-white">
                <Upload className="h-12 w-12 text-gray-400" />
                <Button
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
                  onClick={loadWebViewer}
                >
                  {hasLoadedBefore
                    ? "Reload Document Viewer"
                    : "Load Document Viewer"}
                </Button>
              </div>
            )}

            <div
              ref={viewerRef}
              className={`w-full h-[400px] border border-gray-300 rounded-md bg-white overflow-hidden ${
                isViewerLoaded ? "block" : "hidden"
              }`}
            />
            {isViewerLoaded && (
              <Button
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  setIsViewerLoaded(false);
                  webViewerInstance.current = null;
                  if (viewerRef.current) {
                    viewerRef.current.innerHTML = "";
                  }
                  loadWebViewer();
                }}
              >
                Reload Document Viewer
              </Button>
            )}
          </div>

          {/* Metadata Section */}
          <Card className="shadow-md flex-grow basis-1/3 overflow-y-auto max-h-[500px]">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center mb-4">
                <Label htmlFor="queueMode" className="mr-2">
                  Queue Mode
                </Label>
                <input
                  type="checkbox"
                  id="queueMode"
                  checked={isQueueMode}
                  onChange={(e) => setIsQueueMode(e.target.checked)}
                />
              </div>

              <div>
                <Label>Document Type</Label>
                <div className="flex gap-2 items-center">
                  <Select
                    value={selectedDocType?.id.toString()}
                    onValueChange={(value) => {
                      const docType = documentTypes.find(
                        (dt) => dt.id.toString() === value,
                      );
                      setSelectedDocType(docType || null);
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-300 rounded-md">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-md">
                      <div className="max-h-[200px] overflow-y-auto">
                        {documentTypes.map((type) => (
                          <div
                            key={type.id}
                            className="flex items-center justify-between p-2"
                          >
                            <SelectItem value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDocType(type);
                                  setEditedName(type.name);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocumentType(type.id);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowDocTypeDialog(!showDocTypeDialog)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>

              {/* Edit Document Type Dialog */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Document Type</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter document type name"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingDocType) {
                          handleUpdateDocumentType(editingDocType.id, {
                            ...editingDocType,
                            name: editedName,
                          });
                          setEditDialogOpen(false);
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* DocumentTypeCreation */}
              {showDocTypeDialog && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md">
                  <DocumentTypeCreation
                    onCreate={(newDocType) => {
                      handleCreateNewDocType(newDocType);
                      setShowDocTypeDialog(false);
                    }}
                    onCancel={() => setShowDocTypeDialog(false)}
                  />
                </div>
              )}

              {/* Metadata Fields */}
              {selectedDocType?.metadata.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className="text-sm font-semibold">{field.name}</Label>
                  {field.type === "select" ? (
                    <Select
                      value={metadata[field.name] || ""}
                      onValueChange={(value) =>
                        handleMetadataChange(field.name, value)
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-300 rounded-md h-12">
                        <SelectValue placeholder={`Select ${field.name}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-md">
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="bg-gray-50 border border-gray-300 rounded-md text-lg h-12 px-4 focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter value for ${field.name}`}
                      value={metadata[field.name] || ""}
                      onChange={(e) =>
                        handleMetadataChange(field.name, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}

              {isQueueMode && (
                <Queue
                  items={queue.getItems()}
                  onRemove={(index) => {
                    queue.removeAt(index);
                    setQueue(new FileQueue(queue.getItems())); // Trigger re-render
                  }}
                />
              )}

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFileSelection}
                  disabled={!webViewerInstance.current || !selectedDocType}
                  className={`${
                    !webViewerInstance.current || !selectedDocType
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isQueueMode ? "Add to Queue" : "Upload"}
                </Button>
                {isQueueMode && (
                  <Button
                    onClick={handleUploadAll}
                    disabled={queue.isEmpty() || isUploading}
                    className={`${
                      queue.isEmpty() || isUploading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin mr-2">⌛</div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload All ({queue.getItems().length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Upload Prompt Dialog */}
      <Dialog open={showUploadPrompt} onOpenChange={setShowUploadPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to upload this file?</p>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUploadPrompt(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowUploadPrompt(false);
                handleUpload();
              }}
            >
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function setFolderOptions(folderHierarchy: FolderOption[]) {
  throw new Error("Function not implemented.");
}
