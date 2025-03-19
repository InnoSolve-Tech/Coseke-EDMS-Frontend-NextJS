"use client";

import { useState } from "react";
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

interface DocumentViewerProps {
  url: string | null;
  mimeType: string;
  filename: string;
  documentId?: number;
}

interface Version {
  id: string;
  timestamp: string;
  author: string;
  fileUrl: string;
}

export function DocumentViewer({
  url,
  mimeType,
  filename,
  documentId,
}: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState("view");
  const [versions, setVersions] = useState<Version[]>([
    {
      id: "v1",
      timestamp: new Date().toISOString(),
      author: "Current User",
      fileUrl: url || "",
    },
  ]);
  const [selectedVersion, setSelectedVersion] = useState<string>("v1");
  const { toast } = useToast();

  const handleSaveAnnotations = async (annotatedPdfBlob: Blob) => {
    try {
      // In a real implementation, you would upload the blob to your server
      // and create a new version in your database

      // For this example, we'll just create a new version locally
      const newVersionId = `v${versions.length + 1}`;
      const newVersion: Version = {
        id: newVersionId,
        timestamp: new Date().toISOString(),
        author: "Current User", // Replace with actual user info
        fileUrl: URL.createObjectURL(annotatedPdfBlob),
      };

      setVersions([...versions, newVersion]);
      setSelectedVersion(newVersionId);

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

  const currentVersion =
    versions.find((v) => v.id === selectedVersion) || versions[0];
  const currentUrl = currentVersion.fileUrl;

  if (!url) {
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
          </div>

          <TabsContent value="view" className="flex-1 overflow-hidden">
            <PdfViewer url={currentUrl} />
          </TabsContent>

          <TabsContent value="annotate" className="flex-1 overflow-hidden">
            <PdfAnnotator
              url={currentUrl}
              onSave={handleSaveAnnotations}
              version={selectedVersion}
            />
          </TabsContent>

          <TabsContent value="versions" className="flex-1 overflow-auto p-4">
            <VersionHistory
              documentId={documentId || 0}
              initialVersions={versions}
              initialComments={{}}
              onVersionSelect={(versionId) => {
                setSelectedVersion(versionId);
                setActiveTab("view");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Handle Image files
  if (mimeType.startsWith("image/")) {
    return <ImageViewer url={url} alt={filename} />;
  }

  // Handle Excel files
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return <ExcelViewer url={url} />;
  }

  // Handle Word files (.doc, .docx)
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <WordViewer url={url} />;
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
        <a href={url} className="text-primary underline" download={filename}>
          download the file
        </a>{" "}
        to view it.
      </p>
    </div>
  );
}
