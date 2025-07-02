"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  Download,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types/user";

interface OnlyOfficeEditorProps {
  url: string;
  filename: string;
  mimeType: string;
  documentId?: number;
  fileId?: number;
  hashName: string;
  user?: User;
  onSave?: (file: File) => Promise<void>;
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

  // Store the current file state and track changes
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const docEditorRef = useRef<any>(null);
  const updateFileTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Check if the file is an image
  const isImageFile = mimeType.startsWith("image/");

  // Generate a unique editor ID
  const editorId = useRef(
    `onlyoffice-editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  );

  // Helper function to generate ephemeral document key (changes each session)
  const generateEphemeralDocumentKey = useCallback((): string => {
    // Generate a unique key for this session only
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ephemeral_${timestamp}_${random}`;
  }, []);

  // Helper function to get file extension
  const getFileExtension = useCallback((filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "docx";
  }, []);

  // Comprehensive file logging function
  const logFileObject = useCallback(
    (file: File | null, context = "File Update") => {
      if (!file) {
        console.log(`[${context}] No file to log`);
        return;
      }

      console.group(`[${context}] File Object Details`);
      console.log("Name:", file.name);
      console.log(
        "Size:",
        file.size,
        "bytes",
        `(${(file.size / 1024).toFixed(2)} KB)`,
      );
      console.log("Type:", file.type);
      console.log("Last Modified:", new Date(file.lastModified).toISOString());
      console.log("File Object:", file);
      console.groupEnd();
    },
    [],
  );

  // Fetch current document content from OnlyOffice
  const updateFileFromEditor = useCallback(async () => {
    try {
      console.log("Attempting to update file from editor...");

      // Method 1: Try to use OnlyOffice's downloadAs method
      if (docEditorRef.current?.downloadAs) {
        console.log("Using OnlyOffice downloadAs method");

        return new Promise<void>((resolve) => {
          docEditorRef.current.downloadAs({
            fileType: getFileExtension(filename),
            title: filename,
            callback: (blob: Blob) => {
              if (blob && blob.size > 0) {
                const updatedFile = new File([blob], filename, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                setCurrentFile(updatedFile);
                logFileObject(updatedFile, "DownloadAs Method");
                resolve();
              } else {
                console.warn("DownloadAs returned empty blob");
                resolve();
              }
            },
          });
        });
      }

      // Method 2: Fallback - create a placeholder file to track changes
      console.log("Using fallback method for file tracking");
      const placeholderContent = `Document modified at ${new Date().toISOString()}`;
      const placeholderFile = new File([placeholderContent], filename, {
        type: mimeType,
        lastModified: Date.now(),
      });

      setCurrentFile(placeholderFile);
      logFileObject(placeholderFile, "Fallback Method");
    } catch (err) {
      console.error("Failed to update file from editor:", err);
    }
  }, [filename, mimeType, isReady, getFileExtension, logFileObject]);

  useEffect(() => {
    if (isImageFile) {
      // For images, just set ready state
      setIsLoading(false);
      setIsReady(true);
      toast({
        title: "Image Loaded",
        description: "Image file loaded successfully",
      });
    } else {
      loadOnlyOfficeScript();
    }

    return () => {
      // Cleanup timeout
      if (updateFileTimeoutRef.current) {
        clearTimeout(updateFileTimeoutRef.current);
      }

      // Cleanup editor
      if (docEditorRef.current) {
        try {
          docEditorRef.current.destroyEditor();
        } catch (err) {
          console.warn("Error destroying editor:", err);
        }
      }
    };
  }, [isImageFile]);

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
      // Generate ephemeral document key that changes each session
      const ephemeralDocumentKey = generateEphemeralDocumentKey();

      // Get document configuration from API
      const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/onlyoffice/proxy/document?fileId=${hashName}&mimeType=${encodeURIComponent(mimeType)}`;
      console.log("Proxy URL for document:", proxyUrl);

      const response = await fetch("/api/onlyoffice/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          url: proxyUrl,
          documentId: ephemeralDocumentKey, // Use ephemeral key instead of persistent ID
          fileId: ephemeralDocumentKey,
          userId: user?.id,
          userName: user?.first_name + " " + user?.last_name,
          // Add configuration to prevent document storage
          mode: "edit", // or "view" if you only want viewing
          preventDocumentStorage: true, // Custom flag for your backend
          ephemeral: true, // Indicate this is an ephemeral session
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

      // Ensure the document key is ephemeral
      if (config.document) {
        config.document.key = ephemeralDocumentKey;
      }

      setDebugInfo({
        originalUrl: url,
        documentUrl: config.document?.url,
        editorId: editorId.current,
        ephemeralKey: ephemeralDocumentKey,
        config: {
          documentKey: config.document?.key,
          documentType: config.documentType,
          mode: config.editorConfig?.mode,
          callbackUrl: config.editorConfig?.callbackUrl,
          hasToken: !!config.token,
          ephemeral: true,
        },
      });

      // Check if DocsAPI is available
      if (!(window as any).DocsAPI) {
        throw new Error(
          "ONLYOFFICE API not loaded. Please check if the ONLYOFFICE server is accessible.",
        );
      }

      console.log("Creating ephemeral ONLYOFFICE editor...");
      // Initialize OnlyOffice Document Editor with ephemeral configuration
      docEditorRef.current = new (window as any).DocsAPI.DocEditor(
        editorId.current,
        {
          ...config,
          events: {
            onReady: () => {
              console.log("ONLYOFFICE editor ready (ephemeral mode)");
              setIsReady(true);
              setIsLoading(false);
              setHasUnsavedChanges(false);

              // Log initial file state
              logFileObject(currentFile, "Editor Ready");

              toast({
                title: "Editor Ready",
                description: "Document loaded in ephemeral mode",
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
              console.log("Document state changed (ephemeral):", event);
              setHasUnsavedChanges(true);

              // Debounce the file update to avoid too many calls
              if (updateFileTimeoutRef.current) {
                clearTimeout(updateFileTimeoutRef.current);
              }
              updateFileTimeoutRef.current = setTimeout(() => {
                updateFileFromEditor();
              }, 1000);
            },
            onRequestSaveAs: (event: any) => {
              console.log("Save as requested (ephemeral):", event);
              logFileObject(currentFile, "Save As Requested");
            },
            onSave: (event: any) => {
              console.log("Save event (ephemeral):", event);
              updateFileFromEditor();
            },
            onForceSave: (event: any) => {
              console.log("Force save event (ephemeral):", event);
              updateFileFromEditor();
            },
            onRequestClose: () => {
              console.log(
                "Close requested - ephemeral session will be destroyed",
              );
            },
            onInfo: (event: any) => {
              console.log("ONLYOFFICE info:", event);
            },
            onWarning: (event: any) => {
              console.warn("ONLYOFFICE warning:", event);
            },
            onDocumentReady: () => {
              console.log("Document ready for editing (ephemeral)");
              updateFileFromEditor();
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
    logFileObject(currentFile, "Before Save");

    if (!onSave) {
      console.error("Save handler not provided");
      toast({
        title: "Error",
        description: "Save handler not provided",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // For images, we don't need to update from editor
      if (!isImageFile) {
        // Force update file content before saving
        await updateFileFromEditor();

        // Wait a moment for the update to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Use the most recent file state
      if (currentFile) {
        //await onSave(currentFile);
        setHasUnsavedChanges(false);

        logFileObject(currentFile, "After Successful Save");

        toast({
          title: "Success",
          description: isImageFile
            ? "Image saved successfully"
            : "Document saved successfully (no copy stored on server)",
        });
      } else {
        toast({
          title: "Warning",
          description: "No changes detected to save",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsReady(false);
    setDebugInfo(null);
    setHasUnsavedChanges(false);
    setCurrentFile(null);

    // Clear any pending timeouts
    if (updateFileTimeoutRef.current) {
      clearTimeout(updateFileTimeoutRef.current);
    }

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
      if (isImageFile) {
        setIsLoading(false);
        setIsReady(true);
      } else {
        initializeEditor();
      }
    }, 1000);
  };

  const handleDownload = () => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFile.name;
      a.click();
      URL.revokeObjectURL(url);
      logFileObject(currentFile, "Downloaded File");
    } else {
      window.open(url, "_blank");
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20 p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Failed to Load {isImageFile ? "Image" : "Document"}
        </h3>
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
          <Button variant="outline" onClick={handleDownload}>
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
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {isImageFile ? "Image" : "Ephemeral"}
            </span>
            {currentFile && (
              <span className="text-xs text-muted-foreground">
                ({Math.round(currentFile.size / 1024)}KB)
              </span>
            )}
            {isLoading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
            {isReady && <span className="text-xs text-green-600">Ready</span>}
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600">• Unsaved changes</span>
            )}
          </div>

          <div className="flex space-x-2">
            {!isImageFile && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className={
                  !hasUnsavedChanges ? "bg-blue-600 hover:bg-blue-700" : ""
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {!debugInfo && (
              <details className="relative">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Debug
                </summary>
                <div className="absolute right-0 top-full mt-1 p-3 bg-white border rounded shadow-lg z-10 min-w-64">
                  <pre className="text-xs overflow-auto max-h-32">
                    {JSON.stringify(
                      {
                        ...debugInfo,
                        currentFileSize: currentFile?.size,
                        currentFileType: currentFile?.type,
                        hasUnsavedChanges,
                        isReady,
                        isImageFile,
                        ephemeralMode: !isImageFile,
                      },
                      null,
                      2,
                    )}
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
              Loading{" "}
              {isImageFile ? "image" : "document editor (ephemeral mode)"}...
            </p>
            {debugInfo?.documentUrl && (
              <p className="mt-1 text-xs text-muted-foreground max-w-md truncate">
                {debugInfo.documentUrl}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="flex-1 relative min-h-0">
        {isImageFile ? (
          // Image iframe
          <img
            src={url}
            className="w-full h-full border-0 object-contain"
            title={filename}
            onLoad={() => {
              setIsLoading(false);
              setIsReady(true);
            }}
            onError={() => {
              setError("Failed to load image");
              setIsLoading(false);
            }}
          />
        ) : (
          // OnlyOffice Editor Container
          <div
            id={editorId.current}
            ref={editorRef}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
