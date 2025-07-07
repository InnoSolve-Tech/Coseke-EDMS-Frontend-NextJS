"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Save,
  Download,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { useToast } from "@/core/hooks/use-toast";
import type { User } from "@/lib/types/user";
import { updateDocument } from "@/core/files/api";
import type { FileData, FileVersions } from "@/types/file";

interface OnlyOfficeEditorProps {
  url: string;
  filename: string;
  mimeType: string;
  documentId?: number;
  fileId?: number;
  version: string;
  hashName: string;
  oneDocument: FileData;
  user?: User;
  onSave?: (file: File) => Promise<void>;
}

interface VersionInfo {
  major: number;
  minor: number;
}

export function OnlyOfficeEditor({
  url,
  filename,
  mimeType,
  documentId,
  hashName,
  user,
  fileId,
  oneDocument,
  version,
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

  // Version management state
  const [currentVersion, setCurrentVersion] = useState<VersionInfo>({
    major: Number.parseInt(version.slice(1)?.[0] || "1"),
    minor: Number.parseInt(version.slice(1)?.[2] || "0"),
  });
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [pendingFileToSave, setPendingFileToSave] = useState<File | null>(null);
  const [selectedVersionType, setSelectedVersionType] = useState<
    "major" | "minor"
  >("minor");

  const editorRef = useRef<HTMLDivElement>(null);
  const docEditorRef = useRef<any>(null);
  const updateFileTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Check if the file is an image
  const isImageFile = mimeType.startsWith("image/");

  // Generate a unique editor ID that changes when props change
  const editorId = useRef(
    `onlyoffice-editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  );

  // Helper function to generate ephemeral document key (changes each session)
  const generateEphemeralDocumentKey = useCallback((): string => {
    // Generate a unique key for this session only
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const urlHash = btoa(url).slice(0, 8); // Include URL in the key to make it unique per version
    return `ephemeral_${timestamp}_${random}_${urlHash}`;
  }, [url]);

  // Helper function to get file extension
  const getFileExtension = useCallback((filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "docx";
  }, []);

  // Helper function to calculate next version
  const getNextVersion = useCallback(
    (type: "major" | "minor", current: VersionInfo): VersionInfo => {
      if (type === "major") {
        return { major: current.major + 1, minor: 0 };
      } else {
        return { major: current.major, minor: current.minor + 1 };
      }
    },
    [],
  );

  // Helper function to format version string
  const formatVersion = useCallback((version: VersionInfo): string => {
    return `${version.major}.${version.minor}`;
  }, []);

  // Mock function to save file to backend
  const saveFileToBackend = useCallback(
    async (file: File, version: VersionInfo) => {
      const res = await updateDocument(
        file,
        {
          versionName: `v${formatVersion(version)}`,
          fileManager: oneDocument,
        } as FileVersions,
        fileId!,
      );
    },
    [user, documentId, fileId, hashName, formatVersion, oneDocument],
  );

  // Handle version save confirmation
  const handleVersionSave = useCallback(async () => {
    if (!pendingFileToSave) return;
    setIsSaving(true);
    try {
      const nextVersion = getNextVersion(selectedVersionType, currentVersion);
      // Mock save to backend
      const result = await saveFileToBackend(pendingFileToSave, nextVersion);
      // Update current version and file state
      setCurrentVersion(nextVersion);
      setCurrentFile(pendingFileToSave);
      setHasUnsavedChanges(false);
      toast({
        title: "Document Saved",
        description: `Successfully saved version ${formatVersion(nextVersion)} (${selectedVersionType} update)`,
      });
      // Call the optional onSave callback
      if (onSave) {
        await onSave(pendingFileToSave);
      }
    } catch (error) {
      console.error("Failed to save file:", error);
      toast({
        title: "Save Failed",
        description:
          error instanceof Error ? error.message : "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setShowVersionDialog(false);
      setPendingFileToSave(null);
      setSelectedVersionType("minor");
    }
  }, [
    pendingFileToSave,
    selectedVersionType,
    currentVersion,
    getNextVersion,
    saveFileToBackend,
    formatVersion,
    onSave,
    toast,
  ]);

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

  // Cleanup function
  const cleanupEditor = useCallback(() => {
    if (updateFileTimeoutRef.current) {
      clearTimeout(updateFileTimeoutRef.current);
    }
    if (docEditorRef.current) {
      try {
        docEditorRef.current.destroyEditor();
      } catch (err) {
        console.warn("Error destroying editor:", err);
      }
      docEditorRef.current = null;
    }
  }, []);

  // Initialize editor function
  const initializeEditor = useCallback(async () => {
    if (!editorRef.current) {
      setError("Editor container not found");
      setIsLoading(false);
      return;
    }

    try {
      // Generate ephemeral document key that changes each session
      const ephemeralDocumentKey = generateEphemeralDocumentKey();

      // Get document configuration from API
      const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/onlyoffice/proxy/document?fileId=${hashName}&mimeType=${encodeURIComponent(mimeType)}&version=${version}`;
      console.log("Proxy URL for document:", proxyUrl);
      console.log("Initializing editor with URL:", url);

      const response = await fetch("/api/onlyoffice/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          url: proxyUrl,
          documentId: ephemeralDocumentKey,
          fileId: ephemeralDocumentKey,
          userId: user?.id,
          userName: user?.first_name + " " + user?.last_name,
          mode: "edit",
          preventDocumentStorage: true,
          ephemeral: true,
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
        version: version,
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

      console.log("Creating ephemeral ONLYOFFICE editor for version:", version);

      // Initialize OnlyOffice Document Editor with ephemeral configuration
      docEditorRef.current = new (window as any).DocsAPI.DocEditor(
        editorId.current,
        {
          ...config,
          events: {
            onReady: () => {
              console.log(
                "ONLYOFFICE editor ready (ephemeral mode) for version:",
                version,
              );
              setIsReady(true);
              setIsLoading(false);
              setHasUnsavedChanges(false);
              logFileObject(currentFile, "Editor Ready");
              toast({
                title: "Editor Ready",
                description: `Document loaded in ephemeral mode - Version ${version}`,
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
              if (event && event.data) {
                if (event.data === true) {
                  setHasUnsavedChanges(true);
                } else {
                  setHasUnsavedChanges(false);
                }
              }
            },
            onRequestSaveAs: (event: any) => {
              console.log("Save as requested (ephemeral):", event);
              const url = event.data?.url;
              if (url) {
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                console.log("File saved as:", filename);
              } else {
                console.warn("Save as event data is empty");
              }
            },
            onSaveDocument: (event: any) => {
              console.log("Save event (ephemeral):", event);
              const arraybuffer: ArrayBuffer = event.data;
              console.log("Received arraybuffer:", arraybuffer.byteLength > 0);
              if (arraybuffer.byteLength > 0) {
                const blob = new Blob([arraybuffer], {
                  type: mimeType,
                });
                const updatedFile = new File([blob], filename, {
                  type: mimeType,
                  lastModified: Date.now(),
                });
                setPendingFileToSave(updatedFile);
                setShowVersionDialog(true);
                logFileObject(updatedFile, "Document Save Event");
              } else {
                console.warn("Save event data is empty");
              }
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
            onDocumentReady: (event: any) => {
              console.log("Document ready for editing (ephemeral)");
              logFileObject(event, "On Document Ready");
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
      }, 10000); // Increased timeout for version switching
    } catch (err) {
      console.error("Failed to initialize editor:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to initialize document editor",
      );
      setIsLoading(false);
    }
  }, [
    url,
    filename,
    mimeType,
    hashName,
    user,
    version,
    generateEphemeralDocumentKey,
    currentFile,
    logFileObject,
    toast,
  ]);

  const loadOnlyOfficeScript = useCallback(() => {
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
  }, [initializeEditor]);

  // Effect for initial load and when key props change
  useEffect(() => {
    console.log(
      "OnlyOfficeEditor effect triggered - URL:",
      url,
      "Version:",
      version,
    );

    // Reset states
    setIsLoading(true);
    setError(null);
    setIsReady(false);
    setHasUnsavedChanges(false);

    // Generate new editor ID for each initialization
    editorId.current = `onlyoffice-editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Cleanup previous editor
    cleanupEditor();

    if (isImageFile) {
      // For images, just set ready state
      setIsLoading(false);
      setIsReady(true);
      toast({
        title: "Image Loaded",
        description: "Image file loaded successfully",
      });
    } else {
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        loadOnlyOfficeScript();
      }, 100);
    }

    return cleanupEditor;
  }, [
    url,
    version,
    hashName,
    isImageFile,
    loadOnlyOfficeScript,
    cleanupEditor,
    toast,
  ]);

  // Update version info when version prop changes
  useEffect(() => {
    const versionParts = version.replace("v", "").split(".");
    setCurrentVersion({
      major: Number.parseInt(versionParts[0] || "1"),
      minor: Number.parseInt(versionParts[1] || "0"),
    });
  }, [version]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIsReady(false);
    setDebugInfo(null);
    setHasUnsavedChanges(false);
    setCurrentFile(null);
    setShowVersionDialog(false);
    setPendingFileToSave(null);

    // Clear any pending timeouts
    if (updateFileTimeoutRef.current) {
      clearTimeout(updateFileTimeoutRef.current);
    }

    // Generate new editor ID for retry
    editorId.current = `onlyoffice-editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Destroy existing editor
    cleanupEditor();

    // Retry initialization
    setTimeout(() => {
      if (isImageFile) {
        setIsLoading(false);
        setIsReady(true);
      } else {
        loadOnlyOfficeScript();
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
      {/* Version Selection Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Save Document Version
            </DialogTitle>
            <DialogDescription>
              Choose the type of version update for your document save.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-medium">
                Current Version: {formatVersion(currentVersion)}
              </p>
              <p className="text-muted-foreground">
                {pendingFileToSave &&
                  `File size: ${(pendingFileToSave.size / 1024).toFixed(2)} KB`}
              </p>
            </div>
            <RadioGroup
              value={selectedVersionType}
              onValueChange={(value: "major" | "minor") =>
                setSelectedVersionType(value)
              }
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor" className="flex-1 cursor-pointer">
                  <div className="font-medium">Minor Update</div>
                  <div className="text-sm text-muted-foreground">
                    {formatVersion(currentVersion)} →{" "}
                    {formatVersion(getNextVersion("minor", currentVersion))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Small changes, bug fixes, or content updates
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="major" id="major" />
                <Label htmlFor="major" className="flex-1 cursor-pointer">
                  <div className="font-medium">Major Update</div>
                  <div className="text-sm text-muted-foreground">
                    {formatVersion(currentVersion)} →{" "}
                    {formatVersion(getNextVersion("major", currentVersion))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Significant changes, new features, or major revisions
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVersionDialog(false);
                setPendingFileToSave(null);
                setSelectedVersionType("minor");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleVersionSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              {version}
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
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading {isImageFile ? "image" : `document editor (${version})`}
              ...
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
            src={url || "/placeholder.svg"}
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
