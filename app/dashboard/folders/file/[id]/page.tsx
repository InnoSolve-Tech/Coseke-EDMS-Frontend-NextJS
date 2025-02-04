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
import { useEffect, useState, useRef } from "react";
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
} from "@/components/files/api";
import { useRouter } from "next/navigation";
import { WebViewerInstance } from "@pdftron/webviewer";

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
          setDocument(fileData);

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

    // Validate the new metadata field
    const newFieldName = newMetadata.name.trim();
    if (document.metadata.hasOwnProperty(newFieldName)) {
      showSnackbar("Metadata field already exists", "danger");
      return;
    }

    // Append the new metadata field
    setDocument({
      ...document,
      metadata: {
        ...document.metadata,
        [newFieldName]: newMetadata.value,
      },
    });

    // Reset modal state
    setOpenNewMetadataModal(false);
    setNewMetadata({ name: "", type: "text", value: "", options: null });

    // Notify the user
    showSnackbar("New metadata field added", "success");
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
      if (fileType === "pdf") {
        console.log("📄 Loading PDF in WebViewer...");
        webViewerInstance.current.UI.loadDocument(blob, {
          filename: document.filename,
        });
      } else if (
        fileType.includes("office") ||
        fileType.includes("doc") ||
        fileType.includes("xls")
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
    <Card
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        bgcolor: "background.body",
        overflow: "hidden", // Prevents overflow
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Left Section - File Preview */}
      <Card
        sx={{
          flex: 1,
          p: 3,
          overflow: "auto",
          borderRight: { md: "1px solid", xs: "none" }, // Divider for larger screens
          borderColor: "divider",
        }}
      >
        <Typography level="h2" sx={{ mb: 2 }}>
          File Preview
        </Typography>
        {renderPreview()}
      </Card>

      {/* Right Section - Metadata */}
      <Card
        sx={{
          width: { xs: "100%", md: 400 },
          p: 3,
          bgcolor: "background.level1",
          overflow: "auto", // Ensure scrollable content
        }}
        variant="outlined"
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Header Section */}
          <Typography level="h3" startDecorator={<EditIcon />} sx={{ mb: 2 }}>
            Edit Metadata
          </Typography>

          {/* Document Details Section */}
          <Card>
            <CardContent>
              <Typography level="h1" sx={{ mb: 1 }}>
                Document Details
              </Typography>
              <FormControl>
                <FormLabel>Document Name</FormLabel>
                <Input
                  placeholder="Enter document name"
                  value={document.filename || ""}
                  onChange={(e) =>
                    setDocument({ ...document, filename: e.target.value })
                  }
                />
              </FormControl>
            </CardContent>
          </Card>

          {/* Document Type Section */}
          <Card>
            <CardContent>
              <FormControl>
                <FormLabel>Document Type</FormLabel>
                <Input
                  value={document.documentType || "N/A"}
                  readOnly
                  variant="soft"
                />
              </FormControl>
            </CardContent>
          </Card>

          <Divider sx={{ my: 2 }} />

          {/* File Information Section */}
          <Card>
            <CardContent>
              <Typography level="h4" sx={{ mb: 2 }}>
                File Information
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Card>
                    <CardContent>
                      <Typography
                        level="body-sm"
                        sx={{ color: "text.secondary", mb: 0.5 }}
                      >
                        Created Date
                      </Typography>
                      <Typography level="body-md">
                        {new Date(document.createdDate).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <Typography
                        level="body-sm"
                        sx={{ color: "text.secondary", mb: 0.5 }}
                      >
                        Last Modified
                      </Typography>
                      <Typography level="body-md">
                        {new Date(
                          document.lastModifiedDateTime,
                        ).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Stack>

                <FormControl>
                  <FormLabel>MIME Type</FormLabel>
                  <Input value={document.mimeType} readOnly variant="soft" />
                </FormControl>
              </Stack>
            </CardContent>
          </Card>

          <Divider sx={{ my: 2 }} />

          {/* Additional Metadata Section */}
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography level="h2">Additional Metadata</Typography>
                <Button
                  size="sm"
                  startDecorator={<AddIcon />}
                  onClick={() => setOpenNewMetadataModal(true)}
                >
                  Add Field
                </Button>
              </Stack>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {document &&
                  Object.entries(document.metadata).map(([key, value]) => (
                    <FormControl key={key}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Card sx={{ flexGrow: 1 }}>
                          <CardContent>
                            <FormLabel>{key}</FormLabel>
                            <Input
                              placeholder={`Enter value for ${key}`}
                              value={
                                typeof value === "object"
                                  ? value.join(", ")
                                  : value
                              }
                              onChange={(e) =>
                                handleMetadataChange(key, e.target.value)
                              }
                            />
                          </CardContent>
                        </Card>
                        <IconButton
                          size="sm"
                          variant="plain"
                          color="danger"
                          onClick={() => handleDeleteMetadata(key)}
                          sx={{ mt: 2 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </FormControl>
                  ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Actions Section */}
          <Stack direction="row" spacing={2}>
            <Button
              onClick={handleSubmit}
              startDecorator={<EditIcon />}
              variant="soft"
            >
              Update Metadata
            </Button>
            <Button
              onClick={handleDeleteDocument}
              startDecorator={<DeleteIcon />}
              variant="solid"
              color="danger"
            >
              Delete Document
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Add Field Modal */}
      <Modal
        open={openNewMetadataModal}
        onClose={() => setOpenNewMetadataModal(false)}
      >
        <ModalDialog>
          <ModalClose />
          <Typography level="h4">Add New Metadata Field</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl>
              <FormLabel>Field Name</FormLabel>
              <Input
                value={newMetadata.name}
                onChange={(e) =>
                  setNewMetadata({ ...newMetadata, name: e.target.value })
                }
                placeholder="Enter field name"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Field Value</FormLabel>
              <Input
                value={newMetadata.value}
                onChange={(e) =>
                  setNewMetadata({ ...newMetadata, value: e.target.value })
                }
                placeholder="Enter field value"
              />
            </FormControl>
            <Button onClick={handleAddMetadata} disabled={!newMetadata.name}>
              Add Field
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Snackbar Notifications */}
      <Snackbar
        variant="soft"
        color={snackbar.color}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        startDecorator={<DescriptionIcon />}
        endDecorator={
          <IconButton
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            size="sm"
            variant="plain"
            color="neutral"
          >
            <CloseIcon />
          </IconButton>
        }
      >
        {snackbar.message}
      </Snackbar>
    </Card>
  );
};

export default FileViewPage;
