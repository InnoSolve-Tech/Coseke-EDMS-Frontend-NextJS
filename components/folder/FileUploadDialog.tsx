import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  FileText,
  Pencil,
  Plus,
  Save,
  Trash,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  IDocumentType,
  IDocumentTypeForm,
  deleteDocumentType,
  getDocumentTypes,
  updateDocumentType,
} from "./api";
import { DocumentTypeCreation } from "./DocumentTypes";
import { renderAsync } from "docx-preview";
import { useToast } from "@/hooks/use-toast";
import { WebViewerInstance } from "@pdftron/webviewer";

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (
    file: File,
    documentType: string,
    metadata: Record<string, any>,
  ) => Promise<void>;
  folderID?: number | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".jpg",
  ".png",
  ".xls",
  ".xlsx",
];

export default function FileUploadDialog({
  open,
  onClose,
  onUpload,
  folderID,
}: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<IDocumentType | null>(
    null,
  );
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<IDocumentType | null>(
    null,
  );
  const [editedName, setEditedName] = useState("");
  const viewerRef = useRef<HTMLDivElement>(null);
  const webViewerInstance = useRef<WebViewerInstance | null>(null);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false); // State to track viewer load
  const [currentDoc, setCurrentDoc] = useState<any>(null);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setIsViewerLoaded(false);
      webViewerInstance.current = null;
      if (viewerRef.current) {
        viewerRef.current.innerHTML = "";
      }
    }
  }, [open]);

  const loadWebViewer = async () => {
    if (!viewerRef.current || webViewerInstance.current) return;

    try {
      const viewer = await import("@pdftron/webviewer");
      const instance = await (window as any).WebViewer(
        {
          path: "/lib",
          enableOfficeEditing: true,
          enableFilePicker: true,
          apiKey:
            "demo:1738607170548:616f59ff03000000007a9bceb1ad873e0fd71f2b4fb84257cc6dd11033",
        },
        viewerRef.current,
      );

      webViewerInstance.current = instance;
      setIsViewerLoaded(true);

      // Listen for document loaded event
      instance.UI.addEventListener("documentLoaded", async () => {
        const doc = instance.Core.documentViewer.getDocument();
        const filename = await doc.getFilename();
        setCurrentDoc({
          filename,
          doc,
        });
      });

      // Listen for document unloaded event
      instance.UI.addEventListener("documentUnloaded", () => {
        setCurrentDoc(null);
      });
    } catch (error) {
      console.error("Error loading WebViewer:", error);
    }
  };

  useEffect(() => {
    if (selectedDocType) {
      setMetadata(
        selectedDocType.metadata.reduce(
          (acc, field) => ({
            ...acc,
            [field.name]: field.type === "select" ? "" : field.value || "",
          }),
          {},
        ),
      );
    } else {
      setMetadata({});
    }
  }, [selectedDocType]);

  const fetchDocumentTypes = async () => {
    try {
      const types = await getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error("Failed to fetch document types:", error);
    }
  };

  const handleUpdateDocumentType = async (
    id: number,
    updatedFields: Partial<IDocumentTypeForm>,
  ) => {
    try {
      const originalDocType = documentTypes.find(
        (docType) => docType.id === id,
      );
      if (!originalDocType) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Document type not found",
        });
        return;
      }

      const updatedDocTypeData: IDocumentTypeForm = {
        ...originalDocType,
        ...updatedFields,
      };

      const updatedDocType = await updateDocumentType(id, updatedDocTypeData);

      setDocumentTypes((prev) =>
        prev.map((docType) =>
          docType.id === id ? { ...docType, ...updatedDocType } : docType,
        ),
      );

      if (selectedDocType?.id === id) {
        setSelectedDocType({ ...selectedDocType, ...updatedDocType });
      }

      setEditingDocType(null);
      setEditedName("");
      setEditDialogOpen(false);

      toast({
        title: "Success",
        description: "Document type updated successfully",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Failed to update document type:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update document type. Please try again.",
      });
    }
  };

  const handleDeleteDocumentType = async (id: number) => {
    try {
      await deleteDocumentType(id);

      setDocumentTypes((prev) => prev.filter((docType) => docType.id !== id));

      if (selectedDocType?.id === id) {
        setSelectedDocType(null);
      }

      toast({
        title: "Success",
        description: "Document type deleted successfully",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Failed to delete document type:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document type. Please try again.",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (validateFile(file)) {
        setFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit");
      return false;
    }
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ALLOWED_TYPES.includes(fileExtension)) {
      setError(
        "Invalid file type. Please upload PDF, DOC, DOCX, TXT, JPG, or PNG files",
      );
      return false;
    }
    return true;
  };

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async () => {
    if (!webViewerInstance.current) {
      setError("WebViewer is not initialized");
      console.error("Upload failed: WebViewer not loaded");
      return;
    }

    const instance = webViewerInstance.current;
    const documentViewer = instance.Core.documentViewer;
    const doc = documentViewer.getDocument();

    if (!doc) {
      setError("No document loaded in WebViewer");
      console.error("No document found in WebViewer");
      return;
    }

    // Extract file as Blob
    try {
      const fileData = await doc.getFileData({});
      const fileBlob = new Blob([fileData], { type: doc.getType() });
      const file = new File([fileBlob], doc.getFilename(), {
        type: doc.getType(),
      });

      console.log("Extracted file from WebViewer:", file);

      // Upload the extracted file
      await onUpload(file, selectedDocType?.name || "Unknown", metadata);

      setFile(null);
      setPreviewURL(null);
      setSelectedDocType(null);
      setMetadata({});
      setUploadProgress(100);
      onClose();
    } catch (error) {
      console.error("Error extracting file from WebViewer:", error);
      setError("Failed to extract file from WebViewer.");
    }
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  };

  const handleClose = () => {
    setIsViewerLoaded(false);
    webViewerInstance.current = null;
    if (viewerRef.current) {
      viewerRef.current.innerHTML = "";
    }
    onClose();
  };

  const handleCreateNewDocType = (newDocType: IDocumentType) => {
    setDocumentTypes((prev) => [...prev, newDocType]);
    setSelectedDocType(newDocType);
    setShowDocTypeDialog(false);
  };

  const renderPreview = () => {
    const fileType = file?.type || "";

    if (fileType === "application/pdf") {
      return (
        <iframe
          src={previewURL || undefined}
          className="w-full h-full"
          title="PDF Preview"
        />
      );
    }

    if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return (
        <div ref={docxContainerRef} className="w-full h-full overflow-auto" />
      );
    }

    if (
      fileType === "application/vnd.ms-excel" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
            previewURL || "",
          )}`}
          className="w-full h-full"
          title="Excel File Preview"
        />
      );
    }

    if (fileType.startsWith("image/")) {
      return (
        <img
          src={previewURL || undefined}
          alt="Uploaded File Preview"
          className="w-full h-full"
        />
      );
    }

    if (fileType === "text/plain") {
      return (
        <iframe
          src={previewURL || undefined}
          className="w-full h-full"
          title="Text File Preview"
        />
      );
    }

    return <p>Preview not available for this file type.</p>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl p-0 max-h-[180vh] overflow-hidden flex flex-col bg-opacity-100 bg-white rounded-lg shadow-lg">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-semibold">
            Document Upload & Preview
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-6">
          {/* File Upload Section */}
          <div className="flex flex-col md:w-2/3 bg-gray-50 border p-4 rounded-lg shadow-sm relative min-h-[400px]">
            {!isViewerLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center h-full bg-white">
                <Upload className="h-12 w-12 text-gray-400" />
                <Button
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
                  onClick={loadWebViewer}
                >
                  Load Document Viewer
                </Button>
              </div>
            )}

            <div
              ref={viewerRef}
              className={`w-full h-[400px] border border-gray-300 rounded-md bg-white overflow-hidden ${
                isViewerLoaded ? "block" : "hidden"
              }`}
            />
          </div>

          {/* Metadata Section */}
          <Card className="shadow-md flex-grow basis-1/3 overflow-y-auto max-h-[500px]">
            <CardContent className="p-6 space-y-6">
              <div>
                <Label>Document Type</Label>
                <div className="flex gap-2 items-center">
                  <Select
                    value={selectedDocType?.id.toString()}
                    onValueChange={(value) => {
                      const docType = documentTypes.find(
                        (dt) => dt.id.toString() === value,
                      );
                      setSelectedDocType(docType || null);
                    }}
                  >
                    <SelectTrigger className="bg-white border-gray-300 rounded-md">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-md">
                      <div className="max-h-[200px] overflow-y-auto">
                        {documentTypes.map((type) => (
                          <div
                            key={type.id}
                            className="flex items-center justify-between p-2"
                          >
                            <SelectItem value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDocType(type);
                                  setEditedName(type.name);
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocumentType(type.id);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowDocTypeDialog(!showDocTypeDialog)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>

              {/* Edit Document Type Dialog */}
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Document Type</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter document type name"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingDocType) {
                          handleUpdateDocumentType(editingDocType.id, {
                            ...editingDocType,
                            name: editedName,
                          });
                          setEditDialogOpen(false);
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* DocumentTypeCreation */}
              {showDocTypeDialog && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md">
                  <DocumentTypeCreation
                    onCreate={(newDocType) => {
                      handleCreateNewDocType(newDocType);
                      setShowDocTypeDialog(false);
                    }}
                    onCancel={() => setShowDocTypeDialog(false)}
                  />
                </div>
              )}

              {/* Metadata Fields */}
              {selectedDocType?.metadata.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className="text-sm font-semibold">{field.name}</Label>
                  {field.type === "select" ? (
                    <Select
                      value={metadata[field.name] || ""}
                      onValueChange={(value) =>
                        handleMetadataChange(field.name, value)
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-300 rounded-md h-12">
                        <SelectValue placeholder={`Select ${field.name}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white rounded-md">
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="bg-gray-50 border border-gray-300 rounded-md text-lg h-12 px-4 focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter value for ${field.name}`}
                      value={metadata[field.name] || ""}
                      onChange={(e) =>
                        handleMetadataChange(field.name, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={selectedDocType?.metadata.some(
                    (field) => field.type === "select" && !metadata[field.name],
                  )}
                  className={`${
                    selectedDocType?.metadata.some(
                      (field) =>
                        field.type === "select" && !metadata[field.name],
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
