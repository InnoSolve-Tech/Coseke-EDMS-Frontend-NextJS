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

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewURL(url);

      // Handle rendering of .docx files
      if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        file.arrayBuffer().then((buffer) => {
          if (docxContainerRef.current) {
            renderAsync(buffer, docxContainerRef.current);
          }
        });
      }
    } else {
      setPreviewURL(null);
    }
  }, [file]);

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
      // Find the original document type
      const originalDocType = documentTypes.find(
        (docType) => docType.id === id,
      );
      if (!originalDocType) {
        setError("Document type not found");
        return;
      }

      // Merge the updated fields with the original document type
      const updatedDocTypeData: IDocumentTypeForm = {
        ...originalDocType,
        ...updatedFields,
      };

      // Call the API to update the document type
      const updatedDocType = await updateDocumentType(id, updatedDocTypeData);

      // Update the local state
      setDocumentTypes((prev) =>
        prev.map((docType) =>
          docType.id === id ? { ...docType, ...updatedDocType } : docType,
        ),
      );

      // Update selected document type if it was the one being edited
      if (selectedDocType?.id === id) {
        setSelectedDocType({ ...selectedDocType, ...updatedDocType });
      }

      // Reset editing state
      setEditingDocType(null);
      setEditedName("");
    } catch (error) {
      console.error("Failed to update document type:", error);
      setError("Failed to update document type. Please try again.");
    }
  };

  const handleDeleteDocumentType = async (id: number) => {
    try {
      await deleteDocumentType(id);
      setDocumentTypes((prev) => prev.filter((docType) => docType.id !== id));
    } catch (error) {
      console.error("Failed to delete document type:", error);
      setError("Failed to delete document type. Please try again.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (validateFile(file)) {
        setFile(file);
        simulateUploadProgress();
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
    if (!file || !selectedDocType || !folderID) {
      setError("Missing required information");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Prepare the data object for the API
      const uploadData = {
        documentType: selectedDocType.name,
        metadata: metadata,
        mimeType: file.type,
        fileName: file.name,
      };

      // Call the parent onUpload for any additional handling
      await onUpload(file, selectedDocType.name, metadata);

      // Reset the dialog state
      setFile(null);
      setPreviewURL(null);
      setSelectedDocType(null);
      setMetadata({});
      setUploadProgress(100);
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
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
    setFile(null);
    setPreviewURL(null);
    setUploadProgress(0);
    setMetadata({});
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
          <div className="flex flex-col flex-grow basis-2/3 space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!file ? (
              <div className="relative border-2 border-dashed rounded-lg p-6 text-center min-h-[400px] flex flex-col items-center justify-center border-gray-300 overflow-y-auto">
                <Upload className="h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer rounded-md bg-white font-semibold text-blue-600"
                  >
                    <span>Upload a file</span>
                    <Input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept={ALLOWED_TYPES.join(",")}
                    />
                  </Label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, DOCX, TXT, JPG, or PNG up to 10MB
                </p>
              </div>
            ) : (
              <Card className="flex flex-col shadow-md overflow-y-auto max-h-[400px]">
                <CardContent className="p-4 space-y-4">
                  {/* File Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setPreviewURL(null);
                        setUploadProgress(0);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Preview */}
                  {previewURL && (
                    <div className="h-64 border border-gray-300 rounded-md overflow-hidden">
                      {renderPreview()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                  disabled={
                    !file ||
                    !selectedDocType ||
                    selectedDocType.metadata.some(
                      (field) =>
                        field.type === "select" && !metadata[field.name],
                    ) ||
                    uploadProgress < 100
                  }
                  className={`${
                    !file || !selectedDocType || uploadProgress < 100
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
