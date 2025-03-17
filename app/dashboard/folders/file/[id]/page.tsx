"use client";

import { Label } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Input, Typography } from "@mui/joy";
import type { ColorPaletteProp } from "@mui/joy/styles";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  getFilesByHash,
  getFilesById,
  updateMetadata,
  deleteMetadata,
  deleteFile,
  bulkFileUpload,
  updateDocumentType,
  getDocumentTypes,
  deleteDocumentType,
} from "@/components/files/api";
import { useRouter } from "next/navigation";
import { FileQueue } from "@/components/FileQueue";
import { useToast } from "@/hooks/use-toast";
import { DocumentTypeCreation } from "@/components/folder/DocumentTypes";
import { Button as UiButton } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, Download, Edit, Plus, Trash } from "lucide-react";
import { DocumentViewer } from "@/components/document-viewer/document-viewer";

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
  comments: any;
  version: ReactNode;
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
}

interface BulkUploadState {
  files: File[];
  processing: boolean;
  progress: Record<string, number>;
}

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  user: string;
}

interface IDocumentType {
  id: number;
  name: string;
  metadata: MetadataItem[];
}

const FileViewPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    color: ColorPaletteProp;
    message: string;
  }>({
    open: false,
    message: "",
    color: "success",
  });
  const [openNewMetadataModal, setOpenNewMetadataModal] = useState(false);
  const [newMetadata, setNewMetadata] = useState<MetadataItem>({
    name: "",
    type: "text",
    value: "",
    options: null,
  });
  const [bulkUploadState, setBulkUploadState] = useState<BulkUploadState>({
    files: [],
    processing: false,
    progress: {},
  });
  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<IDocumentType | null>(
    null,
  );
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [showMetadataUpdate, setShowMetadataUpdate] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [currentDocTypeId, setCurrentDocTypeId] = useState<string | null>(null);

  const handleClose = () => {
    router.back();
  };

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const res = await getFilesById(Number.parseInt(id as string));
        const response = await getFilesByHash(res.hashName);

        if (response) {
          const fileData = {
            ...res,
            fileLink: URL.createObjectURL(
              new Blob([response], { type: res.mimeType }),
            ),
          };
          setDocument(fileData as Document);
        } else {
          throw new Error("No file found");
        }
      } catch (err) {
        console.error("Error fetching file details:", err);
        setError("Failed to load file details");
      } finally {
        setLoading(false);
      }
    };

    fetchFileDetails();
  }, [id]);

  const handleMetadataChange = (key: string, value: string) => {
    if (!document) return;

    setDocument({
      ...document,
      metadata: {
        ...document.metadata,
        [key]: value,
      },
    });
  };

  const handleDeleteMetadata = async (key: string) => {
    if (!document) return;

    try {
      // Use deleteMetadata API to remove specific metadata
      await deleteMetadata(document.id, [key]);

      // Update local state
      const newMetadata = { ...document.metadata };
      delete newMetadata[key];
      setDocument({
        ...document,
        metadata: newMetadata,
      });

      showSnackbar("Metadata field deleted", "success");
    } catch (error) {
      console.error("Error deleting metadata field:", error);
      showSnackbar("Failed to delete metadata field", "danger");
    }
  };

  const handleDeleteDocument = async () => {
    if (!document) return;

    try {
      // Use deleteFile API to delete the document
      await deleteFile(document.id);

      showSnackbar("Document deleted successfully", "success");
      setDocument(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      showSnackbar("Failed to delete document", "danger");
    }
  };

  const handleAddMetadata = () => {
    if (!document || !newMetadata.name.trim()) return;

    setDocument((prev) => {
      if (!prev) return null; // Ensure prev is not null

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          [newMetadata.name]: newMetadata.value || " ", // Ensure a visible value
        },
      };
    });

    // Reset modal input fields
    setNewMetadata({ name: "", type: "text", value: "" });
    setOpenNewMetadataModal(false);
  };

  const handleSubmit = async () => {
    if (!document) return;

    try {
      // Send only the metadata object directly, avoiding nested structure
      await updateMetadata(document.id, document.metadata);

      showSnackbar("Document metadata updated successfully", "success");
    } catch (error) {
      console.error("Error updating metadata:", error);
      showSnackbar("Failed to update metadata", "danger");
    }
  };

  const showSnackbar = (message: string, color: ColorPaletteProp) => {
    setSnackbar({ open: true, message, color });
  };

  const handleDownload = async () => {
    if (!document || !document.hashName || !document.filename) {
      console.error("Invalid document object");
      showSnackbar("Invalid document", "danger");
      return;
    }

    try {
      const blob = await getFilesByHash(document.hashName);

      if (!blob || !(blob instanceof Blob)) {
        throw new Error("Invalid file data");
      }

      const link = window.document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = document.filename;
      link.style.display = "none";
      window.document.body.appendChild(link);
      link.click();

      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed:", error);
      showSnackbar("Failed to download file", "danger");
    }
  };

  const handleBulkUpload = async () => {
    if (!document || bulkUploadState.files.length === 0) return;

    setBulkUploadState((prev) => ({ ...prev, processing: true }));

    try {
      // Create a FileQueue instance
      const queue = new FileQueue();

      // Add each file to the queue with its metadata
      bulkUploadState.files.forEach((file) => {
        queue.addItem({
          file,
          documentType: document.documentType || "default",
          documentName: file.name,
          metadata: document.metadata || {},
        });
      });

      // Use the bulkFileUpload function
      const response = await bulkFileUpload(queue, document.folderID);

      if (response) {
        showSnackbar(
          `Successfully uploaded ${bulkUploadState.files.length} files`,
          "success",
        );
      }
    } catch (error) {
      console.error("Bulk upload failed:", error);
      showSnackbar("Failed to upload files", "danger");
    } finally {
      setBulkUploadState({ files: [], processing: false, progress: {} });
    }
  };

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const types = await getDocumentTypes();
        setDocumentTypes(types);

        // If document has a documentType already set, find and select it
        if (document && document.documentType) {
          const matchingType = types.find(
            (type: { name: string }) => type.name === document.documentType,
          );
          if (matchingType) {
            setSelectedDocType(matchingType);
            setCurrentDocTypeId(matchingType.id.toString());

            // Initialize metadata from the document type
            if (matchingType.metadata && matchingType.metadata.length > 0) {
              const typeMetadata = matchingType.metadata.reduce(
                (
                  acc: { [x: string]: any },
                  field: { name: string | number; value: any },
                ) => {
                  // Use existing document value if available, otherwise use default from document type
                  acc[field.name] =
                    document.metadata[field.name] || field.value || "";
                  return acc;
                },
                {} as Record<string, string>,
              );
              setMetadata(typeMetadata);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch document types:", error);
      }
    };

    fetchDocumentTypes();
  }, [document]);

  const handleAddComment = () => {
    if (!document || !newComment.trim()) return;
    const newCommentObj = {
      id: Date.now(),
      text: newComment,
      createdAt: new Date().toISOString(),
      user: "Current User", // Replace with actual user info
    };
    setDocument((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        comments: [...prev.comments, newCommentObj],
      };
    });
    setNewComment("");
  };

  const handleUpdateDocumentType = async (id: number, name: string) => {
    try {
      const updatedDocType = await updateDocumentType(id, {
        name,
        metadata: [],
      });
      setDocumentTypes((prev) =>
        prev.map((docType) =>
          docType.id === id ? { ...docType, ...updatedDocType } : docType,
        ),
      );
      toast({
        title: "Success",
        description: "Document type updated successfully",
      });
    } catch (error) {
      console.error("Failed to update document type:", error);
    }
  };

  const handleDeleteDocumentType = async (id: number) => {
    try {
      await deleteDocumentType(id);
      setDocumentTypes((prev) => prev.filter((docType) => docType.id !== id));
      setSelectedDocType(null);
      toast({
        title: "Success",
        description: "Document type deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete document type:", error);
    }
  };

  const handleDocumentTypeChange = (value: string) => {
    const docType = documentTypes.find((dt) => dt.id.toString() === value);
    setSelectedDocType(docType || null);
    setCurrentDocTypeId(value);

    if (docType && docType.metadata) {
      // Ensure the metadata values are always strings
      const initialMetadata = docType.metadata.reduce(
        (acc, field) => {
          const existingValue = document?.metadata?.[field.name];

          // If existingValue is an array, convert it to a comma-separated string
          acc[field.name] = Array.isArray(existingValue)
            ? existingValue.join(", ")
            : existingValue || field.value || "";

          return acc;
        },
        {} as Record<string, string>,
      );

      setMetadata(initialMetadata);

      // Also update the document metadata
      if (document) {
        setDocument({
          ...document,
          documentType: docType.name,
          metadata: initialMetadata,
        });
      }

      // Show metadata section immediately
      setShowMetadataUpdate(true);
    } else {
      setMetadata({});
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>Loading file details...</Typography>
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography color="danger">{error || "No file found"}</Typography>
      </Box>
    );
  }

  const handleDownloadAndOpen = async () => {
    if (!document || !document.hashName || !document.filename) {
      console.error("Invalid document object");
      showSnackbar("Invalid document", "danger");
      return;
    }

    try {
      const blob = await getFilesByHash(document.hashName);

      if (!blob || !(blob instanceof Blob)) {
        throw new Error("Invalid file data");
      }

      // Create a download link - use window.document to be explicit
      const fileUrl = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = fileUrl;
      link.download = document.filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);

      // Inform the user that the file has been downloaded
      showSnackbar(
        "File downloaded successfully. Please open it with your preferred application.",
        "success",
      );
    } catch (error) {
      console.error("Download failed:", error);
      showSnackbar("Failed to download file", "danger");
    }
  };

  // Open the file in LibreOffice
  const openInLibreOffice = (filePath: string) => {
    const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`; // Adjust if LibreOffice is installed elsewhere
    const command = `${libreOfficePath} "${filePath}"`;

    // Open the file using cmd
    window.open(`cmd.exe /C ${command}`);
  };

  const openInWord = (filePath: string) => {
    removeFileBlock(filePath);

    const wordUrl = `ms-word:ofe|u|file:///${encodeURIComponent(filePath)}`;
    window.location.href = wordUrl;
  };

  const removeFileBlock = (filePath: string) => {
    const command = `powershell -Command "Unblock-File -Path '${filePath}'"`;
    window.open(`cmd.exe /C ${command}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">{document.filename}</h1>
          <UiButton variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="h-6 w-6" />
          </UiButton>
        </header>

        {/* File viewer with proper overflow handling */}
        <div className="flex-1 relative overflow-hidden">
          <DocumentViewer
            url={document.fileLink}
            mimeType={document.mimeType}
            filename={document.filename}
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-2 p-4 border-t">
          <UiButton onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download
          </UiButton>

          {/* Microsoft 365 Edit button - only for Word documents */}
          {document.mimeType === "application/msword" ||
          document.mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
            <UiButton
              variant="outline"
              onClick={async () => {
                if (!document || !document.hashName || !document.filename) {
                  showSnackbar("Invalid document", "danger");
                  return;
                }

                try {
                  // Fetch the document from the server
                  const blob = await getFilesByHash(document.hashName);

                  if (!blob || !(blob instanceof Blob)) {
                    throw new Error("Invalid file data");
                  }

                  // Define the trusted path for storing the document
                  const trustedPath = `C:\\Users\\Public\\Documents\\${document.filename}`;

                  // Ensure we are in a client-side environment
                  if (typeof window !== "undefined") {
                    // Create a temporary file URL
                    const fileUrl = URL.createObjectURL(blob);

                    // Download the file to the system
                    const link = window.document.createElement("a");
                    link.href = fileUrl;
                    link.download = document.filename;
                    window.document.body.appendChild(link);
                    link.click();
                    window.document.body.removeChild(link);
                    URL.revokeObjectURL(fileUrl);

                    // Small delay to ensure the file is saved before opening
                    setTimeout(() => {
                      openInWord(trustedPath);
                    }, 1000);
                  }
                } catch (error) {
                  console.error("Failed to download and open file:", error);
                  showSnackbar("Failed to open file in Word", "danger");
                }
              }}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit in Word
            </UiButton>
          ) : null}

          <UiButton onClick={handleDeleteDocument} variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </UiButton>
        </div>
      </div>

      {/* Sidebar with proper overflow handling */}
      <aside className="w-96 border-l bg-background flex flex-col overflow-hidden">
        <Tabs defaultValue="details" className="flex-1 flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="details" className="h-full overflow-auto">
              <div className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <UiLabel htmlFor="documentName">Document Name</UiLabel>
                      <UiInput
                        id="documentName"
                        value={document.filename || ""}
                        onChange={(e) =>
                          handleMetadataChange("filename", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <UiLabel htmlFor="documentType">Document Type</UiLabel>
                      <UiSelect
                        value={currentDocTypeId || ""}
                        onValueChange={handleDocumentTypeChange}
                      >
                        <SelectTrigger id="documentType">
                          <SelectValue placeholder="Select a document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem
                              key={type.id}
                              value={type.id.toString()}
                            >
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </UiSelect>
                    </div>

                    {/* Metadata Section with Matching Styles */}
                    {selectedDocType && (
                      <div className="mt-4 p-4 border rounded-md bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-700">
                          Metadata
                        </h3>
                        <ScrollArea className="h-auto max-h-60 pr-2">
                          {Object.entries(metadata).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2 mb-2"
                            >
                              <Input
                                value={key}
                                disabled
                                className="w-1/3 text-sm font-medium bg-gray-100"
                              />
                              <Input
                                value={value}
                                onChange={(e) =>
                                  handleMetadataChange(key, e.target.value)
                                }
                                className="w-2/3 text-sm font-normal"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleDeleteMetadata(key)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}

                    <div className="space-y-2">
                      <UiLabel>Created Date</UiLabel>
                      <p className="text-sm">
                        {new Date(document.createdDate).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <UiLabel>Last Modified</UiLabel>
                      <p className="text-sm">
                        {new Date(
                          document.lastModifiedDateTime,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <UiLabel>Version</UiLabel>
                      <p className="text-sm">{document.version}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="h-full overflow-auto">
              <div className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showMetadataUpdate ? (
                      <div className="space-y-4">
                        <ScrollArea className="h-[400px] pr-4">
                          {Object.entries(metadata).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2 mb-2"
                            >
                              <Input value={key} disabled className="w-1/3" />
                              <Input
                                value={value}
                                onChange={(e) =>
                                  handleMetadataChange(key, e.target.value)
                                }
                                className="w-2/3"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleDeleteMetadata(key)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </ScrollArea>
                        <Separator className="my-4" />
                        <div className="flex items-end space-x-2">
                          <div className="flex-1 space-y-2">
                            <Label component="label" htmlFor="newMetadataName">
                              New Field Name
                            </Label>
                            <Input
                              id="newMetadataName"
                              value={newMetadata.name}
                              onChange={(e) =>
                                setNewMetadata({
                                  ...newMetadata,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label component="label" htmlFor="newMetadataValue">
                              New Field Value
                            </Label>
                            <Input
                              id="newMetadataValue"
                              value={newMetadata.value}
                              onChange={(e) =>
                                setNewMetadata({
                                  ...newMetadata,
                                  value: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Button onClick={handleAddMetadata}>
                            <Plus className="mr-2 h-4 w-4" /> Add
                          </Button>
                        </div>
                        <Button className="w-full mt-4" onClick={handleSubmit}>
                          <Edit className="mr-2 h-4 w-4" /> Update Metadata
                        </Button>
                        <Button
                          className="mt-4"
                          onClick={() => setShowMetadataUpdate(false)}
                        >
                          Cancel Metadata Update
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ScrollArea className="h-[400px]">
                          <DocumentTypeCreation
                            onCreate={(newDocType) => {
                              setDocumentTypes([...documentTypes, newDocType]);
                              setShowDocTypeDialog(false);
                            }}
                            onCancel={() => setShowDocTypeDialog(false)}
                          />
                        </ScrollArea>
                        <Button
                          className="w-full"
                          onClick={() => setShowMetadataUpdate(true)}
                        >
                          Update Metadata
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="h-full overflow-auto">
              <div className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <ScrollArea className="h-[400px] pr-4">
                        {document?.comments?.map((comment: Comment) => (
                          <div key={comment.id} className="mb-4">
                            <p className="text-sm font-medium">
                              {comment.text}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()} -{" "}
                              {comment.user}
                            </p>
                          </div>
                        ))}
                      </ScrollArea>
                      <Separator className="my-4" />
                      <div className="flex items-end space-x-2">
                        <div className="flex-1 space-y-2">
                          <UiLabel htmlFor="newComment">New Comment</UiLabel>
                          <Textarea
                            id="newComment"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <UiButton onClick={handleAddComment}>
                          Add Comment
                        </UiButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </aside>
    </div>
  );
};

export default FileViewPage;
