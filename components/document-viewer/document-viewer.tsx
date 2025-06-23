"use client";

import { useState, useEffect } from "react";
import PdfViewer from "./pdf-viewer";
import { PdfAnnotator } from "./pdf-annotator";
import { VersionHistory } from "./version-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FileIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  Eye,
  PenSquare,
  History,
  Download,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFilesById, getFilesByHash } from "../files/api";

interface DocumentViewerProps {
  url: string | null;
  mimeType: string;
  filename: string;
  documentId?: number;
  fileId?: number;
}

// OpenOffice/LibreOffice supported formats
const OFFICE_FORMATS = {
  // Writer (Word processor) - OpenOffice/LibreOffice Writer
  "application/vnd.oasis.opendocument.text": {
    app: "writer",
    office: "openoffice",
  },
  "application/vnd.oasis.opendocument.text-template": {
    app: "writer",
    office: "openoffice",
  },
  "application/msword": { app: "writer", office: "libreoffice" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    app: "writer",
    office: "libreoffice",
  },
  "application/rtf": { app: "writer", office: "libreoffice" },
  "text/plain": { app: "writer", office: "libreoffice" },

  // Calc (Spreadsheet) - OpenOffice/LibreOffice Calc
  "application/vnd.oasis.opendocument.spreadsheet": {
    app: "calc",
    office: "openoffice",
  },
  "application/vnd.oasis.opendocument.spreadsheet-template": {
    app: "calc",
    office: "openoffice",
  },
  "application/vnd.ms-excel": { app: "calc", office: "libreoffice" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    app: "calc",
    office: "libreoffice",
  },
  "text/csv": { app: "calc", office: "libreoffice" },

  // Impress (Presentation) - OpenOffice/LibreOffice Impress
  "application/vnd.oasis.opendocument.presentation": {
    app: "impress",
    office: "openoffice",
  },
  "application/vnd.oasis.opendocument.presentation-template": {
    app: "impress",
    office: "openoffice",
  },
  "application/vnd.ms-powerpoint": { app: "impress", office: "libreoffice" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    app: "impress",
    office: "libreoffice",
  },

  // Draw (Graphics) - OpenOffice/LibreOffice Draw
  "application/vnd.oasis.opendocument.graphics": {
    app: "draw",
    office: "openoffice",
  },
  "application/vnd.oasis.opendocument.graphics-template": {
    app: "draw",
    office: "openoffice",
  },

  // Base (Database) - OpenOffice/LibreOffice Base
  "application/vnd.oasis.opendocument.database": {
    app: "base",
    office: "openoffice",
  },

  // Additional LibreOffice-compatible formats
  "application/vnd.ms-excel.sheet.macroEnabled.12": {
    app: "calc",
    office: "libreoffice",
  },
  "application/vnd.ms-powerpoint.presentation.macroEnabled.12": {
    app: "impress",
    office: "libreoffice",
  },
  "application/vnd.ms-word.document.macroEnabled.12": {
    app: "writer",
    office: "libreoffice",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    app: "writer",
    office: "libreoffice",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    app: "calc",
    office: "libreoffice",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template": {
    app: "impress",
    office: "libreoffice",
  },
};

interface OfficeViewerProps {
  url: string;
  filename: string;
  hashName: string; // Optional, used for blob URLs
  mimeType: string;
  officeApp: string;
  officeType: "openoffice" | "libreoffice";
}

function OfficeViewer({
  url,
  filename,
  hashName,
  mimeType,
  officeApp,
  officeType,
}: OfficeViewerProps) {
  const [conversionUrl, setConversionUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to convert document to PDF for web viewing using LibreOffice online conversion
  const convertToPdf = async () => {
    setIsConverting(true);
    setError(null);

    try {
      // Get the file data
      const fileData = await getFilesByHash(hashName);

      // Create FormData to send the file properly
      const formData = new FormData();

      // Convert ArrayBuffer to Blob if needed
      let documentBlob = new Blob([fileData], { type: mimeType });

      // Append the file and other data to FormData
      formData.append("file", documentBlob, filename);
      formData.append("filename", filename);
      formData.append("mimeType", mimeType);
      formData.append("officeType", officeType);

      const response = await fetch("/api/convert-to-pdf", {
        method: "POST",
        body: formData, // Send FormData instead of JSON
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
      }

      const result = await response.json();
      setConversionUrl(result.pdfUrl);
    } catch (err) {
      setError(
        "Failed to convert document for viewing. Please download to view in OpenOffice.",
      );
      console.error("Conversion error:", err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Office Suite branding and controls */}
      <div className="border-b p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center ${
                  officeType === "openoffice" ? "bg-blue-600" : "bg-green-600"
                }`}
              >
                <span className="text-white font-bold text-xs">
                  {officeType === "openoffice" ? "OO" : "LO"}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {officeType === "openoffice" ? "OpenOffice" : "LibreOffice"}{" "}
                  {officeApp.charAt(0).toUpperCase() + officeApp.slice(1)}
                </h3>
                <p className="text-sm text-gray-600">{filename}</p>
                {officeType === "libreoffice" && (
                  <p className="text-xs text-green-600">
                    Enhanced compatibility mode
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, "_blank")}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Original
            </Button>

            {!conversionUrl && !isConverting && (
              <Button onClick={convertToPdf} size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View in Browser
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isConverting && (
          <div className="flex flex-col items-center justify-center h-full bg-muted/20">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                officeType === "openoffice"
                  ? "border-blue-600"
                  : "border-green-600"
              }`}
            ></div>
            <p className="mt-4 text-muted-foreground">
              Converting document for web viewing...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Using {officeType === "openoffice" ? "OpenOffice" : "LibreOffice"}{" "}
              conversion engine
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full bg-muted/20">
            <AlertCircle className="h-16 w-16 text-orange-500 mb-4" />
            <p className="text-muted-foreground text-center max-w-md">
              {error}
            </p>
            <div className="mt-4 space-x-2">
              <Button
                variant="outline"
                onClick={() => window.open(url, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
              <Button onClick={convertToPdf} disabled={isConverting}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {conversionUrl && (
          <div className="h-full">
            <PdfViewer url={conversionUrl} />
          </div>
        )}

        {!conversionUrl && !isConverting && !error && (
          <div className="flex flex-col items-center justify-center h-full bg-muted/20">
            <div className="mb-6">
              {officeApp === "writer" && (
                <FileTextIcon
                  className={`h-16 w-16 ${officeType === "openoffice" ? "text-blue-600" : "text-green-600"}`}
                />
              )}
              {officeApp === "calc" && (
                <FileSpreadsheetIcon
                  className={`h-16 w-16 ${officeType === "openoffice" ? "text-blue-600" : "text-green-600"}`}
                />
              )}
              {officeApp === "impress" && (
                <FileIcon
                  className={`h-16 w-16 ${officeType === "openoffice" ? "text-orange-600" : "text-green-600"}`}
                />
              )}
              {officeApp === "draw" && (
                <FileIcon
                  className={`h-16 w-16 ${officeType === "openoffice" ? "text-purple-600" : "text-green-600"}`}
                />
              )}
              {officeApp === "base" && (
                <FileIcon
                  className={`h-16 w-16 ${officeType === "openoffice" ? "text-red-600" : "text-green-600"}`}
                />
              )}
            </div>

            <h3 className="text-lg font-semibold mb-2">
              {officeType === "openoffice" ? "OpenOffice" : "LibreOffice"}{" "}
              {officeApp.charAt(0).toUpperCase() + officeApp.slice(1)} Document
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {officeType === "openoffice"
                ? "This document is optimized for OpenOffice. You can view it in your browser after conversion or download it to open in OpenOffice directly."
                : "This document will be handled by LibreOffice for enhanced compatibility. You can view it in your browser after conversion or download it for desktop viewing."}
            </p>

            <div className="flex space-x-3">
              <Button onClick={convertToPdf}>
                <Eye className="h-4 w-4 mr-2" />
                Convert & View
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(url, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download for{" "}
                {officeType === "openoffice" ? "OpenOffice" : "LibreOffice"}
              </Button>
            </div>

            <div
              className={`mt-6 p-4 rounded-lg max-w-md ${
                officeType === "openoffice" ? "bg-blue-50" : "bg-green-50"
              }`}
            >
              <h4
                className={`font-medium mb-2 ${
                  officeType === "openoffice"
                    ? "text-blue-900"
                    : "text-green-900"
                }`}
              >
                Best Experience with{" "}
                {officeType === "openoffice" ? "OpenOffice" : "LibreOffice"}
              </h4>
              <ul
                className={`text-sm space-y-1 ${
                  officeType === "openoffice"
                    ? "text-blue-800"
                    : "text-green-800"
                }`}
              >
                <li>• Full editing capabilities</li>
                <li>• Native format support</li>
                <li>• Advanced formatting preserved</li>
                <li>
                  •{" "}
                  {officeType === "libreoffice"
                    ? "Enhanced Microsoft Office compatibility"
                    : "Collaborative features available"}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  const [hashName, setHashName] = useState<string | null>(null);
  const { toast } = useToast();

  // Load document using the same method as version history
  useEffect(() => {
    const loadDocument = async () => {
      if (fileId) {
        setIsLoading(true);
        try {
          const fileMeta = await getFilesById(fileId);
          const blob = await getFilesByHash(fileMeta.hashName);
          setHashName(fileMeta.hashName);

          // For OpenOffice documents, preserve original MIME type
          const documentBlob = new Blob([blob], { type: mimeType });
          const blobUrl = URL.createObjectURL(documentBlob);
          setCurrentUrl(blobUrl);
          setViewingVersionId(null);
        } catch (error) {
          console.error("Failed to load document:", error);
          toast({
            title: "Error",
            description: "Failed to load document",
            variant: "destructive",
          });
          if (url) {
            setCurrentUrl(url);
          }
        } finally {
          setIsLoading(false);
        }
      } else if (url) {
        setCurrentUrl(url);
        setViewingVersionId(null);
      }
    };

    loadDocument();

    return () => {
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [fileId, url, toast, mimeType]);

  const handleSaveAnnotations = async (annotatedPdfBlob: Blob) => {
    try {
      toast({
        title: "Success",
        description: "New version created successfully",
      });
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

    if (!fileUrl) {
      toast({
        title: "Error",
        description: "No file URL provided for this version",
        variant: "destructive",
      });
      return;
    }

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

  // Check if this is an Office Suite supported format
  const officeFormat = OFFICE_FORMATS[mimeType as keyof typeof OFFICE_FORMATS];

  if (officeFormat) {
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
              {mimeType === "application/pdf" && (
                <TabsTrigger value="annotate">
                  <PenSquare className="h-4 w-4 mr-2" />
                  Annotate
                </TabsTrigger>
              )}
              <TabsTrigger value="versions">
                <History className="h-4 w-4 mr-2" />
                Versions
              </TabsTrigger>
            </TabsList>
            {viewingVersionId !== null && (
              <button
                className="text-sm text-primary hover:underline"
                onClick={async () => {
                  if (fileId) {
                    setIsLoading(true);
                    try {
                      const fileMeta = await getFilesById(fileId);
                      const blob = await getFilesByHash(fileMeta.hashName);
                      const documentBlob = new Blob([blob], { type: mimeType });
                      const blobUrl = URL.createObjectURL(documentBlob);

                      if (currentUrl && currentUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(currentUrl);
                      }

                      setCurrentUrl(blobUrl);
                    } catch (error) {
                      console.error("Failed to load original document:", error);
                      if (url) {
                        setCurrentUrl(url);
                      }
                    } finally {
                      setIsLoading(false);
                    }
                  } else if (url) {
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
            <OfficeViewer
              url={currentUrl}
              filename={filename}
              hashName={hashName!}
              mimeType={mimeType}
              officeApp={officeFormat.app}
              officeType={
                officeFormat.office === "openoffice"
                  ? "openoffice"
                  : "libreoffice"
              }
            />
          </TabsContent>

          {mimeType === "application/pdf" && (
            <TabsContent value="annotate" className="flex-1 overflow-hidden">
              <PdfAnnotator
                url={currentUrl}
                onSave={handleSaveAnnotations}
                version={viewingVersionId?.toString() || "original"}
              />
            </TabsContent>
          )}

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

  // PDF files that aren't OpenOffice formats
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
                  if (fileId) {
                    setIsLoading(true);
                    try {
                      const fileMeta = await getFilesById(fileId);
                      const blob = await getFilesByHash(fileMeta.hashName);
                      const pdfBlob = new Blob([blob], {
                        type: "application/pdf",
                      });
                      const blobUrl = URL.createObjectURL(pdfBlob);

                      if (currentUrl && currentUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(currentUrl);
                      }

                      setCurrentUrl(blobUrl);
                    } catch (error) {
                      console.error("Failed to load original document:", error);
                      if (url) {
                        setCurrentUrl(url);
                      }
                    } finally {
                      setIsLoading(false);
                    }
                  } else if (url) {
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
      <p className="text-sm text-muted-foreground text-center max-w-md">
        This file format isn't supported by OpenOffice or LibreOffice. Consider
        converting it to an open format (.odt, .ods, .odp) for better
        compatibility.
      </p>
      <Button
        className="mt-4"
        variant="outline"
        onClick={() => window.open(currentUrl, "_blank")}
      >
        <Download className="h-4 w-4 mr-2" />
        Download File
      </Button>
    </div>
  );
}
