"use client";

import { Download, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFilesByHash } from "@/components/files/api";

interface DocumentActionsProps {
  document: any;
  handleDownload: () => Promise<void>;
  handleDeleteDocument: () => Promise<void>;
}

export function DocumentActions({
  document,
  handleDownload,
  handleDeleteDocument,
}: DocumentActionsProps) {
  const openInWord = async () => {
    if (!document || !document.hashName || !document.filename) {
      console.error("Invalid document object");
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
          const wordUrl = `ms-word:ofe|u|file:///${encodeURIComponent(trustedPath)}`;
          window.location.href = wordUrl;
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to download and open file:", error);
    }
  };

  const isWordDocument =
    document.mimeType === "application/msword" ||
    document.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <div className="flex justify-end space-x-2 p-4 border-t">
      <Button onClick={handleDownload} variant="outline">
        <Download className="mr-2 h-4 w-4" /> Download
      </Button>

      {isWordDocument && (
        <Button variant="outline" onClick={openInWord}>
          <Edit className="mr-2 h-4 w-4" /> Edit in Word
        </Button>
      )}

      <Button onClick={handleDeleteDocument} variant="destructive">
        <Trash className="mr-2 h-4 w-4" /> Delete
      </Button>
    </div>
  );
}
