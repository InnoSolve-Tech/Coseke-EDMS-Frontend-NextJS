"use client";

import type React from "react";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Box, Typography } from "@mui/joy";
import type { ColorPaletteProp } from "@mui/joy/styles";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "@/components/document-viewer/document-viewer";
import { useToast } from "@/hooks/use-toast";
import { FileSidebar } from "@/components/file-view/file-sidebar";
import { DocumentActions } from "@/components/file-view/document-actions";
import {
  getFilesByHash,
  getFilesById,
  updateMetadata,
  deleteMetadata,
  deleteFile,
  getDocumentTypes,
} from "@/components/files/api";
import { updateFileWithDocumentType } from "@/components/folder/api";

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
  version: React.ReactNode;
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

interface IDocumentType {
  id: number;
  name: string;
  metadata: MetadataItem[];
}

const FileViewPage = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);
  const [currentDocTypeId, setCurrentDocTypeId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true); // Always show sidebar by default
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    color: ColorPaletteProp;
    message: string;
  }>({
    open: false,
    message: "",
    color: "success",
  });

  // Fetch document data
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
            comments: res.comments || [], // Ensure comments is initialized
          };
          setDocument(fileData as unknown as Document);
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

  // Fetch document types
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
            setCurrentDocTypeId(matchingType.id.toString());
          }
        }
      } catch (error) {
        console.error("Failed to fetch document types:", error);
      }
    };

    fetchDocumentTypes();
  }, [document]);

  // Ensure sidebar visibility is restored from localStorage
  useEffect(() => {
    // Check if we have a stored preference for sidebar visibility
    const storedSidebarState = localStorage.getItem("document-sidebar-visible");
    if (storedSidebarState !== null) {
      setShowSidebar(storedSidebarState === "true");
    }
  }, []);

  // Save sidebar visibility state
  useEffect(() => {
    localStorage.setItem("document-sidebar-visible", String(showSidebar));
  }, [showSidebar]);

  // Handlers
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
      await deleteMetadata(document.id, [key]);

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
      await deleteFile(document.id);
      showSnackbar("Document deleted successfully", "success");
      router.back();
    } catch (error) {
      console.error("Error deleting document:", error);
      showSnackbar("Failed to delete document", "danger");
    }
  };

  const handleSubmit = async () => {
    if (!document) return;

    try {
      await updateMetadata(document.id, document.metadata);
      showSnackbar("Document metadata updated successfully", "success");
    } catch (error) {
      console.error("Error updating metadata:", error);
      showSnackbar("Failed to update metadata", "danger");
    }
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

  const handleDocumentTypeChange = async (value: string) => {
    const docType = documentTypes.find((dt) => dt.id.toString() === value);
    setCurrentDocTypeId(value);

    if (docType && document) {
      const initialMetadata = docType.metadata.reduce(
        (acc, field) => {
          const existingValue = document?.metadata?.[field.name];
          acc[field.name] = Array.isArray(existingValue)
            ? existingValue.join(", ")
            : existingValue || field.value || "";
          return acc;
        },
        {} as Record<string, string>,
      );

      const updatedDocument = {
        ...document,
        documentType: docType.name,
        metadata: initialMetadata,
      };

      setDocument(updatedDocument);

      try {
        await updateFileWithDocumentType(document.id, docType.name); // 👈 persist
      } catch (error) {
        console.error("Failed to update document type:", error);
      }
    }
  };

  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  const showSnackbar = (message: string, color: ColorPaletteProp) => {
    setSnackbar({ open: true, message, color });
    toast({
      title: color === "success" ? "Success" : "Error",
      description: message,
      variant: color === "success" ? "default" : "destructive",
    });
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* File viewer with proper overflow handling */}
        <div className="flex-1 relative overflow-hidden">
          <DocumentViewer
            url={document.fileLink}
            mimeType={document.mimeType}
            filename={document.filename}
            fileId={document.id}
          />
        </div>

        {/* Action buttons */}
        <DocumentActions
          document={document}
          handleDownload={handleDownload}
          handleDeleteDocument={handleDeleteDocument}
        />
      </div>

      {/* Sidebar toggle button - fixed position */}
      <div className="fixed top-20 right-0 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSidebar}
          className="rounded-l-md rounded-r-none border-r-0 h-8 px-2 shadow-md"
        >
          {showSidebar ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar - conditionally rendered based on showSidebar state */}
      {showSidebar && (
        <FileSidebar
          document={document}
          setDocument={setDocument}
          documentTypes={documentTypes}
          setDocumentTypes={setDocumentTypes}
          handleMetadataChange={handleMetadataChange}
          handleDeleteMetadata={handleDeleteMetadata}
          handleSubmit={handleSubmit}
          currentDocTypeId={currentDocTypeId}
          handleDocumentTypeChange={handleDocumentTypeChange}
        />
      )}
    </div>
  );
};

export default FileViewPage;
