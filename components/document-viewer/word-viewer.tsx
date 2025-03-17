"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { renderAsync } from "docx-preview";

interface WordViewerProps {
  url: string;
  filename?: string;
}

export function WordViewer({
  url,
  filename = "document.docx",
}: WordViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!url) {
      toast({
        title: "No document",
        description: "No Word document provided.",
        variant: "destructive",
      });
      return;
    }

    const loadDocument = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch document");
        const blob = await response.blob();

        if (viewerRef.current) {
          viewerRef.current.innerHTML = ""; // Clear previous content
          await renderAsync(blob, viewerRef.current);
        }
      } catch (error) {
        console.error("Error loading DOCX:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [url, toast]);

  return (
    <div className="flex flex-col items-center p-4 min-h-[500px] bg-muted/20 w-full">
      {isLoading && (
        <Skeleton className="h-[500px] w-full max-w-3xl rounded-lg" />
      )}

      {hasError ? (
        <Alert variant="destructive" className="mb-4 w-full max-w-3xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading document</AlertTitle>
          <AlertDescription>
            The document could not be loaded. It may be inaccessible or in an
            unsupported format.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="w-full max-w-3xl">
          {/* Scrollable Container for DOCX Preview */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border p-4">
            <div
              ref={viewerRef}
              className="docx-preview-container overflow-auto"
              style={{ maxHeight: "500px", overflowY: "auto", padding: "10px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
