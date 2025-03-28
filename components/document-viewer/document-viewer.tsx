"use client";

import { useState, useEffect } from "react";
import { PdfViewer } from "./pdf-viewer";
import { PdfAnnotator } from "./pdf-annotator";
import { ImageViewer } from "./image-viewer";
import { ExcelViewer } from "./excel-viewer";
import { WordViewer } from "./word-viewer";
import { VersionHistory } from "./version-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  Eye,
  PenSquare,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFilesById, getFilesByHash } from "../files/api";

interface DocumentViewerProps {
  url: string | null;
  mimeType: string;
  filename: string;
  documentId?: number;
  fileId?: number; // Add fileId to support direct file loading
}

export function DocumentViewer({
  url,
  mimeType,
  filename,
  documentId,
  fileId,
}: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState("view");
  const [currentUrl, setCurrentUrl] = useState<string>(url || "");
  const [viewingVersionId, setViewingVersionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load document using the same method as version history
  useEffect(() => {
    const loadDocument = async () => {
      // If we have a fileId, use the same approach as version history
      if (fileId) {
        setIsLoading(true);
        try {
          // Step 1: Get file metadata
          const fileMeta = await getFilesById(fileId);

          // Step 2: Use hashName to fetch blob
          const blob = await getFilesByHash(fileMeta.hashName);

          // Step 3: Create blob URL with the correct content type
          // Create a new blob with the correct MIME type to ensure it displays in the viewer
          const pdfBlob = new Blob([blob], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(pdfBlob);

          console.log(
            `Document loaded from fileId=${fileId}, Blob URL: ${blobUrl}`,
          );

          // Set the current URL to the blob URL
          setCurrentUrl(blobUrl);
          setViewingVersionId(null);
        } catch (error) {
          console.error("Failed to load document:", error);
          toast({
            title: "Error",
            description: "Failed to load document",
            variant: "destructive",
          });
          // Fallback to direct URL if available
          if (url) {
            setCurrentUrl(url);
          }
        } finally {
          setIsLoading(false);
        }
      } else if (url) {
        // If no fileId but we have a URL, use it directly
        setCurrentUrl(url);
        setViewingVersionId(null);
      }
    };

    loadDocument();

    // Cleanup function to revoke blob URLs when component unmounts
    return () => {
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [fileId, url, toast]);

  const handleSaveAnnotations = async (annotatedPdfBlob: Blob) => {
    try {
      // In a real implementation, you would upload the blob to your server
      // and create a new version in your database

      toast({
        title: "Success",
        description: "New version created successfully",
      });

      // Switch to view tab to see the new version
      setActiveTab("view");
    } catch (error) {
      console.error("Error saving annotations:", error);
      toast({
        title: "Error",
        description: "Failed to save annotations",
        variant: "destructive",
      });
    }
  };

  const handleVersionSelect = async (versionId: number, fileUrl: string) => {
    console.log(
      `Document viewer received: versionId=${versionId}, fileUrl=${fileUrl}`,
    );

    // Ensure we have a valid URL
    if (!fileUrl) {
      toast({
        title: "Error",
        description: "No file URL provided for this version",
        variant: "destructive",
      });
      return;
    }

    // If the current URL is a blob URL, revoke it to prevent memory leaks
    if (currentUrl && currentUrl.startsWith("blob:")) {
      URL.revokeObjectURL(currentUrl);
    }

    setCurrentUrl(fileUrl);
    setViewingVersionId(versionId);
    setActiveTab("view");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted/20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (!currentUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted/20">
        <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No document available</p>
      </div>
    );
  }

  // PDF files get the full annotation treatment
  if (mimeType === "application/pdf") {
    return (
      <div className="flex flex-col h-full">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="flex justify-between items-center border-b px-4">
            <TabsList>
              <TabsTrigger value="view">
                <Eye className="h-4 w-4 mr-2" />
                View
              </TabsTrigger>
              <TabsTrigger value="annotate">
                <PenSquare className="h-4 w-4 mr-2" />
                Annotate
              </TabsTrigger>
              <TabsTrigger value="versions">
                <History className="h-4 w-4 mr-2" />
                Versions
              </TabsTrigger>
            </TabsList>
            {viewingVersionId !== null && (
              <button
                className="text-sm text-primary hover:underline"
                onClick={async () => {
                  // If we have a fileId, reload the original document
                  if (fileId) {
                    setIsLoading(true);
                    try {
                      // Get file metadata
                      const fileMeta = await getFilesById(fileId);

                      // Use hashName to fetch blob
                      const blob = await getFilesByHash(fileMeta.hashName);

                      // Create a new blob with the correct MIME type
                      const pdfBlob = new Blob([blob], {
                        type: "application/pdf",
                      });
                      const blobUrl = URL.createObjectURL(pdfBlob);

                      // Revoke the current blob URL if it exists
                      if (currentUrl && currentUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(currentUrl);
                      }

                      setCurrentUrl(blobUrl);
                    } catch (error) {
                      console.error("Failed to load original document:", error);
                      // Fallback to direct URL if available
                      if (url) {
                        setCurrentUrl(url);
                      }
                    } finally {
                      setIsLoading(false);
                    }
                  } else if (url) {
                    // If no fileId but we have a URL, use it directly
                    setCurrentUrl(url);
                  }

                  setViewingVersionId(null);
                }}
              >
                Return to Original
              </button>
            )}
          </div>

          <TabsContent value="view" className="flex-1 overflow-hidden">
            <PdfViewer url={currentUrl} />
          </TabsContent>

          <TabsContent value="annotate" className="flex-1 overflow-hidden">
            <PdfAnnotator
              url={currentUrl}
              onSave={handleSaveAnnotations}
              version={viewingVersionId?.toString() || "original"}
            />
          </TabsContent>

          <TabsContent value="versions" className="flex-1 overflow-auto p-4">
            {documentId && (
              <VersionHistory
                documentId={documentId}
                onVersionSelect={handleVersionSelect}
                onClose={() => setActiveTab("view")}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Handle Image files
  if (mimeType.startsWith("image/")) {
    return <ImageViewer url={currentUrl} alt={filename} />;
  }

  // Handle Excel files
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return <ExcelViewer url={currentUrl} />;
  }

  // Handle Word files (.doc, .docx)
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <WordViewer url={currentUrl} />;
  }

  // Fallback for unsupported file types
  return (
    <div className="flex flex-col items-center justify-center h-[500px] bg-muted/20">
      <div className="mb-4">
        {mimeType.includes("spreadsheet") ? (
          <FileSpreadsheetIcon className="h-16 w-16 text-muted-foreground" />
        ) : mimeType.includes("word") ? (
          <FileTextIcon className="h-16 w-16 text-muted-foreground" />
        ) : (
          <FileIcon className="h-16 w-16 text-muted-foreground" />
        )}
      </div>
      <p className="text-muted-foreground mb-2">
        Unsupported file type: {mimeType}
      </p>
      <p className="text-sm text-muted-foreground">
        You can{" "}
        <a
          href={currentUrl}
          className="text-primary underline"
          download={filename}
        >
          download the file
        </a>{" "}
        to view it.
      </p>
    </div>
  );
}
