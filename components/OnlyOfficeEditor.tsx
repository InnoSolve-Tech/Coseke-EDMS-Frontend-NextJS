// components/OnlyOfficeEditor.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  Download,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types/user";

interface OnlyOfficeEditorProps {
  url: string;
  filename: string;
  mimeType: string;
  documentId?: number;
  fileId?: number;
  hashName: string;
  user?: User;
  onSave?: (blob: Blob) => Promise<void>;
}

export function OnlyOfficeEditor({
  url,
  filename,
  mimeType,
  documentId,
  hashName,
  user,
  fileId,
  onSave,
}: OnlyOfficeEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const docEditorRef = useRef<any>(null);
  const { toast } = useToast();

  // Generate a unique editor ID
  const editorId = useRef(
    `onlyoffice-editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  );

  useEffect(() => {
    loadOnlyOfficeScript();

    return () => {
      if (docEditorRef.current) {
        try {
          docEditorRef.current.destroyEditor();
        } catch (err) {
          console.warn("Error destroying editor:", err);
        }
      }
    };
  }, []);

  const loadOnlyOfficeScript = () => {
    // Check if script is already loaded
    if ((window as any).DocsAPI) {
      initializeEditor();
      return;
    }

    // Load OnlyOffice API script
    const script = document.createElement("script");
    const onlyOfficeUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_URL;

    if (!onlyOfficeUrl) {
      setError(
        "ONLYOFFICE URL not configured. Please set NEXT_PUBLIC_ONLYOFFICE_URL environment variable.",
      );
      setIsLoading(false);
      return;
    }

    script.src = `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`;
    script.onload = () => {
      console.log("ONLYOFFICE API script loaded successfully");
      initializeEditor();
    };
    script.onerror = (err) => {
      console.error("Failed to load ONLYOFFICE API script:", err);
      setError(
        `Failed to load ONLYOFFICE API from ${onlyOfficeUrl}. Please check if the ONLYOFFICE server is running and accessible.`,
      );
      setIsLoading(false);
    };
    document.head.appendChild(script);
  };

  const initializeEditor = async () => {
    if (!editorRef.current) {
      setError("Editor container not found");
      setIsLoading(false);
      return;
    }

    try {
      const docIdString = documentId?.toString() || `temp_${Date.now()}`;
      const fileIdString = fileId?.toString();

      // Get document configuration from API
      const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/onlyoffice/proxy/document?fileId=${hashName}&mimeType=${encodeURIComponent(mimeType)}`;

      const response = await fetch("/api/onlyoffice/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          url: proxyUrl,
          documentId: docIdString,
          fileId: fileIdString,
          userId: user?.id,
          userName: user?.first_name + " " + user?.last_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Config API error:", errorData);
        throw new Error(
          errorData.error || `Configuration failed: ${response.statusText}`,
        );
      }

      const config = await response.json();
      console.log("ONLYOFFICE configuration received:", config);

      setDebugInfo({
        originalUrl: url,
        documentUrl: config.document?.url, // This will be the temp URL for blobs
        editorId: editorId.current,
        config: {
          documentKey: config.document?.key,
          documentType: config.documentType,
          mode: config.editorConfig?.mode,
          callbackUrl: config.editorConfig?.callbackUrl,
          hasToken: !!config.token,
        },
      });

      // Check if DocsAPI is available
      if (!(window as any).DocsAPI) {
        throw new Error(
          "ONLYOFFICE API not loaded. Please check if the ONLYOFFICE server is accessible.",
        );
      }

      console.log("Creating ONLYOFFICE editor...");

      // Initialize OnlyOffice Document Editor using the unique ID
      docEditorRef.current = new (window as any).DocsAPI.DocEditor(
        editorId.current, // Use the generated unique ID
        {
          ...config,
          events: {
            onReady: () => {
              console.log("ONLYOFFICE editor ready");
              setIsReady(true);
              setIsLoading(false);
              toast({
                title: "Editor Ready",
                description: "Document loaded successfully",
              });
            },
            onError: (event: any) => {
              console.error("ONLYOFFICE editor error:", event);

              let errorMessage = "Document editor error";
              if (event?.data) {
                switch (event.data) {
                  case -4:
                    errorMessage =
                      "Download failed. The document URL is not accessible from ONLYOFFICE server.";
                    break;
                  case -3:
                    errorMessage = "Document conversion failed.";
                    break;
                  case -2:
                    errorMessage = "Document conversion timeout.";
                    break;
                  case -1:
                    errorMessage = "Unknown error occurred.";
                    break;
                  default:
                    errorMessage = `Error code: ${event.data}`;
                }
              }

              setError(errorMessage);
              setIsLoading(false);
            },
            onDocumentStateChange: (event: any) => {
              console.log("Document state changed:", event);
            },
            onRequestSaveAs: (event: any) => {
              console.log("Save as requested:", event);
            },
            onRequestClose: () => {
              console.log("Close requested");
            },
            onInfo: (event: any) => {
              console.log("ONLYOFFICE info:", event);
            },
            onWarning: (event: any) => {
              console.warn("ONLYOFFICE warning:", event);
            },
          },
        },
      );

      // Timeout fallback
      setTimeout(() => {
        if (!isReady) {
          console.warn(
            "Editor did not become ready within timeout, hiding loader",
          );
          setIsLoading(false);
        }
      }, 5000);
    } catch (err) {
      console.error("Failed to initialize editor:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initialize document editor",
      );
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!docEditorRef.current) {
      toast({
        title: "Error",
        description: "Editor not ready",
        variant: "destructive",
      });
      return;
    }

    try {
      const docIdString = documentId?.toString();
      const fileIdString = fileId?.toString();

      const response = await fetch("/api/onlyoffice/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docIdString,
          fileId: fileIdString,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save document");
      }

      const result = await response.json();

      if (onSave && result.blob) {
        await onSave(result.blob);
      }

      toast({
        title: "Success",
        description: "Document saved successfully",
      });
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save document",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsReady(false);
    setDebugInfo(null);

    // Generate new editor ID for retry
    editorId.current = `onlyoffice-editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Destroy existing editor
    if (docEditorRef.current) {
      try {
        docEditorRef.current.destroyEditor();
      } catch (err) {
        console.warn("Error destroying editor:", err);
      }
      docEditorRef.current = null;
    }

    // Retry initialization
    setTimeout(() => {
      initializeEditor();
    }, 1000);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20 p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Document</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          {error}
        </p>

        {debugInfo && (
          <details className="mb-4 p-3 bg-muted rounded text-sm">
            <summary className="cursor-pointer font-medium">
              Debug Information
            </summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.open(url, "_blank")}>
            <Download className="h-4 w-4 mr-2" />
            Download Original
          </Button>
          {debugInfo?.documentUrl && debugInfo.documentUrl !== url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(debugInfo.documentUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test Temp URL
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="border-b p-2 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className="text-sm font-medium truncate max-w-xs"
              title={filename}
            >
              {filename}
            </span>
            {isLoading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
            {isReady && <span className="text-xs text-green-600">Ready</span>}
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleSave} disabled={!isReady}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, "_blank")}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {debugInfo && (
              <details className="relative">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Debug
                </summary>
                <div className="absolute right-0 top-full mt-1 p-3 bg-white border rounded shadow-lg z-10 min-w-64">
                  <pre className="text-xs overflow-auto max-h-32">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading document editor...
            </p>
            {debugInfo?.documentUrl && (
              <p className="mt-1 text-xs text-muted-foreground max-w-md truncate">
                {debugInfo.documentUrl}
              </p>
            )}
          </div>
        </div>
      )}

      {/* OnlyOffice Editor Container */}
      <div className="flex-1 relative min-h-0">
        <div id={editorId.current} ref={editorRef} className="w-full h-full" />
      </div>
    </div>
  );
}
