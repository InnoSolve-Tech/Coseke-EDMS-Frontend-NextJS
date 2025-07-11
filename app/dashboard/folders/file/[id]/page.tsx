"use client";

import { FileSidebar } from "@/components/fileView/file-sidebar";
import { updateFileWithDocumentType } from "@/components/folder/api";
import { OnlyOfficeEditor } from "@/components/OnlyOfficeEditor";
import { Button } from "@/components/ui/button";
import {
  deleteFile,
  deleteMetadata,
  getDocumentTypes,
  getFilesByHash,
  getFilesById,
  updateMetadata,
} from "@/core/files/api";
import { useToast } from "@/core/hooks/use-toast";
import type { User } from "@/lib/types/user";
import type { FileData, FileVersions } from "@/types/file";
import { Box, Typography } from "@mui/joy";
import type { ColorPaletteProp } from "@mui/joy/styles";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MetadataItem {
  name: string;
  type: string;
  value: string;
  options?: any;
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
  const [document, setDocument] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);
  const [currentDocTypeId, setCurrentDocTypeId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [user, setUser] = useState<User>();
  const [currentVersion, setCurrentVersion] = useState<FileVersions | null>(
    null,
  );
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
        const user = JSON.parse(
          sessionStorage.getItem("current-user") || "null",
        );
        if (!user) {
          throw new Error("User not found in localStorage");
        }
        setUser(user);

        const res = await getFilesById(Number.parseInt(id as string));
        const response = await getFilesByHash(res.hashName);

        if (response) {
          const fileData = {
            ...res,
            fileLink: URL.createObjectURL(
              new Blob([response], { type: res.mimeType }),
            ),
          };
          setDocument(fileData as unknown as FileData);

          // Set initial version (latest)
          const sortedVersions =
            res.fileVersions?.sort(
              (a: FileVersions, b: FileVersions) => b.id - a.id,
            ) || [];
          if (sortedVersions.length > 0) {
            setCurrentVersion(sortedVersions[0]);
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
      showSnackbar("File deleted successfully", "success");
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
      showSnackbar("File metadata updated successfully", "success");
    } catch (error) {
      console.error("Error updating metadata:", error);
      showSnackbar("Failed to update metadata", "danger");
    }
  };

  const handleChangeVersion = async (version: FileVersions) => {
    setCurrentVersion(version);

    // If you need to fetch specific file content for the version, do it here
    try {
      // Optional: Fetch the file content for the specific version if needed
      // const versionContent = await getFilesByHash(version.hashName || document.hashName)
      // if (versionContent) {
      //   // Update document with version-specific content
      // }

      console.log("Changed to version:", version);
      toast({
        title: "Version Changed",
        description: `Switched to version ${version.versionName}`,
      });
    } catch (error) {
      console.error("Error loading version:", error);
      showSnackbar("Failed to load version", "danger");
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
            : existingValue ||
              (typeof field.value === "string" ? field.value : "");
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
        await updateFileWithDocumentType(document.id, docType.name);
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
          <OnlyOfficeEditor
            key={`${document.id}-${currentVersion?.id || "latest"}`} // This forces re-render when version changes
            url={
              currentVersion?.filePath ||
              document.fileVersions.sort((a, b) => b.id - a.id)[0]?.filePath ||
              ""
            }
            mimeType={document.mimeType!}
            filename={document.filename!}
            hashName={document.hashName!}
            oneDocument={document}
            version={currentVersion?.versionName!}
            user={user}
            fileId={document.id}
          />
        </div>
      </div>

      {/* Sidebar toggle button - fixed position */}
      <div className="fixed top-20 right-0 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSidebar}
          className="rounded-l-md rounded-r-none border-r-0 h-8 px-2 shadow-md bg-transparent"
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
          handleChangeVersion={handleChangeVersion}
          currentDocTypeId={currentDocTypeId}
          handleDocumentTypeChange={handleDocumentTypeChange}
        />
      )}
    </div>
  );
};

export default FileViewPage;
