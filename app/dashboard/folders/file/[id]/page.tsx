"use client";

import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  InsertDriveFileOutlined as DocIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  TableChartOutlined as ExcelIcon,
  PictureAsPdfOutlined as PdfIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Label,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Option,
  Select,
  Snackbar,
  Stack,
  Typography,
  Modal,
  ModalDialog,
  ModalClose,
} from "@mui/joy";
import { ColorPaletteProp } from "@mui/joy/styles";
import { useParams } from "next/navigation";
import {
  useEffect,
  useState,
  useRef,
  ReactNode,
  AwaitedReactNode,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactPortal,
} from "react";
import * as XLSX from "xlsx";
import { DocViewerRenderers } from "react-doc-viewer";
import dynamic from "next/dynamic";
import { renderAsync } from "docx-preview";
import {
  getFilesByHash,
  getFilesById,
  updateMetadata,
  deleteMetadata,
  clearMetadata,
  deleteFile,
  bulkFileUpload,
  bulkUpload,
  updateDocumentType,
  getDocumentTypes,
  deleteDocumentType,
} from "@/components/files/api";
import { useRouter } from "next/navigation";
import { WebViewerInstance } from "@pdftron/webviewer";
import axios from "axios";
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
  const DocViewer = dynamic(() => import("react-doc-viewer"), { ssr: false });
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
  const [previewState, setPreviewState] = useState<{
    excelData?: any[] | null;
  }>({
    excelData: null,
  });
  const [previewMode, setPreviewMode] = useState<
    "default" | "local" | "google"
  >("default");
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [googleFileId, setGoogleFileId] = useState<string | null>(null);
  const [showInstallMessage, setShowInstallMessage] = useState(false);
  const [openNewMetadataModal, setOpenNewMetadataModal] = useState(false);
  const [newMetadata, setNewMetadata] = useState<MetadataItem>({
    name: "",
    type: "text",
    value: "",
    options: null,
  });
  const docxContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const webViewerInstance = useRef<WebViewerInstance | null>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
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

  const handleClose = () => {
    router.back();
  };

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const res = await getFilesById(parseInt(id as string));
        const response = await getFilesByHash(res.hashName);

        if (response) {
          const fileData = {
            ...res,
            fileLink: URL.createObjectURL(
              new Blob([response], { type: res.mimeType }),
            ),
          };
          setDocument(fileData as Document);

          // Log the file content
          console.log("File Content:", response);

          // Load WebViewer immediately after setting document
          if (fileData.fileLink) {
            loadWebViewer();
          }
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

  useEffect(() => {
    const parseExcelFile = async () => {
      if (
        document &&
        (document.mimeType.includes("spreadsheetml") ||
          document.mimeType === "application/vnd.ms-excel")
      ) {
        try {
          const arrayBuffer = await fetch(document.fileLink!).then((res) =>
            res.arrayBuffer(),
          );
          const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          setPreviewState((prev) => ({ ...prev, excelData: data as any[] }));
        } catch (error) {
          console.error("Error parsing Excel file:", error);
        }
      }
    };

    parseExcelFile();
  }, [document?.fileLink, document?.mimeType]);

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

  const loadWebViewer = async () => {
    if (!viewerRef.current) {
      console.warn("⚠️ viewerRef is missing.");
      return;
    }

    try {
      // Cleanup previous instance if it exists
      if (webViewerInstance.current) {
        try {
          webViewerInstance.current.UI.closeDocument();
        } catch (cleanupError) {
          console.warn("Error during previous instance cleanup:", cleanupError);
        }
      }

      console.log("🚀 Initializing WebViewer...");

      const WebViewer = await import("@pdftron/webviewer");
      const instance = await (window as any).WebViewer(
        {
          path: "/lib",
          fullAPI: true,
          enableAnnotations: true,
          enableOfficeEditing: false,
          preloadWorker: "pdf",
        },
        viewerRef.current,
      );

      webViewerInstance.current = instance;
      setIsViewerLoaded(true);

      // Use optional chaining and try-catch for event listeners
      try {
        instance.Core.documentViewer?.addEventListener("documentLoaded", () => {
          console.log("✅ Document loaded successfully in WebViewer.");
        });

        instance.Core.documentViewer?.addEventListener(
          "documentError",
          (error: any) => {
            console.error("❌ Document load error:", error);
            setError("Failed to load document in viewer.");
          },
        );
      } catch (listenerError) {
        console.error("Error setting up event listeners:", listenerError);
      }

      // Load file if available
      if (document?.fileLink) {
        await loadFileIntoViewer();
      }
    } catch (error) {
      console.error("❌ Error initializing WebViewer:", error);
      setError("Failed to initialize document viewer.");
      setIsViewerLoaded(false);
    }
  };

  const loadFileIntoViewer = async () => {
    if (!webViewerInstance.current || !document?.fileLink) {
      console.error("⚠️ WebViewer not initialized or no fileLink available.");
      return;
    }

    try {
      console.log("🔄 Fetching file:", document.fileLink);

      // Fetch the Blob file
      const response = await fetch(document.fileLink);
      const blob = await response.blob();

      let fileType = document.mimeType.toLowerCase();
      console.log("📄 File type detected:", fileType);

      // Ensure PDFs do NOT open in Office Editing Mode
      if (fileType === "application/pdf") {
        console.log("📄 Loading PDF in WebViewer...");
        webViewerInstance.current.UI.loadDocument(blob, {
          filename: document.filename,
        });
      } else if (
        fileType.includes("office") ||
        fileType.includes("doc") ||
        fileType.includes("xls") ||
        fileType.includes("image/png")
      ) {
        console.log(
          "📄 Loading Office document in WebViewer with editing enabled...",
        );
        webViewerInstance.current.UI.loadDocument(blob, {
          filename: document.filename,
          enableOfficeEditing: true, // ✅ Enable Office Editing for DOCX/XLSX
        });
      } else {
        console.warn("⚠️ Unsupported file type:", fileType);
        setError("Unsupported file type.");
      }

      console.log(
        "✅ File successfully loaded into WebViewer:",
        document.filename,
      );
    } catch (error) {
      console.error("❌ Error loading document into WebViewer:", error);
      setError("Failed to load document.");
    }
  };

  useEffect(() => {
    const initializeWebViewer = async () => {
      if (document?.fileLink) {
        if (!isViewerLoaded) {
          await loadWebViewer();
        }

        if (isViewerLoaded) {
          loadFileIntoViewer();
        }
      }
    };

    initializeWebViewer();
  }, [document?.fileLink, document?.mimeType]);

  const renderPreview = () => {
    if (!document || !document.fileLink) {
      return (
        <Typography level="body-lg" textAlign="center">
          No file available to preview.
        </Typography>
      );
    }

    return (
      <Card
        variant="outlined"
        sx={{ height: "calc(100vh - 120px)", overflow: "hidden" }}
      >
        <CardContent
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 0,
          }}
        >
          <Box sx={{ width: "100%", height: "100%", minHeight: "600px" }}>
            <div
              ref={viewerRef}
              className="w-full h-[600px] border border-gray-300 rounded-md bg-white overflow-hidden"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    return () => {
      if (webViewerInstance.current) {
        console.log("🔄 Resetting WebViewer before unmounting...");
        webViewerInstance.current.UI.closeDocument();
        webViewerInstance.current = null;
        setIsViewerLoaded(false);
      }
    };
  }, []);

  useEffect(() => {
    if (document) {
      console.log("Document state:", {
        fileLink: document.fileLink,
        mimeType: document.mimeType,
        filename: document.filename,
      });
    }
  }, [document]);

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
      } catch (error) {
        console.error("Failed to fetch document types:", error);
      }
    };

    fetchDocumentTypes();
  }, []);

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

    // Set metadata based on selected document type
    if (docType) {
      const initialMetadata = docType.metadata.reduce(
        (acc, field) => {
          acc[field.name] = field.value || ""; // Initialize metadata values
          return acc;
        },
        {} as Record<string, string>,
      );
      setMetadata(initialMetadata);
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

  return (
    <div className="flex h-screen bg-background">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">{document.filename}</h1>
          <UiButton variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="h-6 w-6" />
          </UiButton>
        </header>

        {/* File viewer */}
        <div ref={viewerRef} className="flex-1 bg-white">
          {/* WebViewer will be initialized here */}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-2 p-4 border-t">
          <UiButton onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download
          </UiButton>
          <UiButton onClick={handleDeleteDocument} variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </UiButton>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-96 border-l bg-background overflow-y-auto">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="p-4">
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
                    value={selectedDocType?.id.toString()}
                    onValueChange={handleDocumentTypeChange}
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue placeholder="Select a document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </UiSelect>
                </div>
                <div className="space-y-2">
                  <UiLabel>Created Date</UiLabel>
                  <p className="text-sm">
                    {new Date(document.createdDate).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <UiLabel>Last Modified</UiLabel>
                  <p className="text-sm">
                    {new Date(document.lastModifiedDateTime).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <UiLabel>Version</UiLabel>
                  <p className="text-sm">{document.version}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="metadata" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                {showMetadataUpdate ? (
                  <>
                    <ScrollArea className="h-[300px] pr-4">
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
                  </>
                ) : (
                  <>
                    <DocumentTypeCreation
                      onCreate={(newDocType) => {
                        setDocumentTypes([newDocType]); // Refresh document types after creation
                        setShowDocTypeDialog(false);
                      }}
                      onCancel={() => setShowDocTypeDialog(false)}
                    />
                    <Button
                      className="mt-4"
                      onClick={() => setShowMetadataUpdate(true)}
                    >
                      Update Metadata
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="comments" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {document?.comments?.map((comment: Comment) => (
                    <div key={comment.id} className="mb-4">
                      <p className="text-sm font-medium">{comment.text}</p>
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
                  <UiButton onClick={handleAddComment}>Add Comment</UiButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
};

export default FileViewPage;
