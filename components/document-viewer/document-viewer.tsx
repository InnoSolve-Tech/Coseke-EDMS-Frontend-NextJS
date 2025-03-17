"use client";

import { PdfViewer } from "./pdf-viewer";
import { ImageViewer } from "./image-viewer";
import { ExcelViewer } from "./excel-viewer";
import { WordViewer } from "./word-viewer";
import { FileIcon, FileTextIcon, FileSpreadsheetIcon } from "lucide-react";

interface DocumentViewerProps {
  url: string | null;
  mimeType: string;
  filename: string;
}

export function DocumentViewer({
  url,
  mimeType,
  filename,
}: DocumentViewerProps) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-muted/20">
        <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No document available</p>
      </div>
    );
  }

  // Handle PDF files
  if (mimeType === "application/pdf") {
    return <PdfViewer url={url} />;
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
