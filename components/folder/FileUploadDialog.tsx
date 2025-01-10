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
import { AlertCircle, FileText, Plus, Save, Upload, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { addDocument } from "../files/api";
import { IDocumentType, getDocumentTypes } from "./api";
import { DocumentTypeCreation } from "./DocumentTypes";

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
const ALLOWED_TYPES = [".pdf", ".doc", ".docx", ".txt", ".jpg", ".png"];

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

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewURL(url);
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
    if (!file) {
      setError("No file selected");
      return;
    }

    if (!selectedDocType) {
      setError("No document type selected");
      return;
    }

    try {
      const payload = {
        documentName: file.name,
        mimeType: file.type,
        documentType: selectedDocType.name,
        metadata: selectedDocType.metadata.reduce(
          (acc, field) => {
            acc[field.name] = metadata[field.name] || "";
            return acc;
          },
          {} as Record<string, string>,
        ),
      };

      console.log("Payload being sent to API:", payload);

      try {
        await onUpload(file, selectedDocType.name, metadata);
        onClose();
      } catch (apiError: any) {
        setError(
          apiError.message || "Failed to upload file. Please try again.",
        );
      }
    } catch (error: any) {
      setError("Failed to prepare upload. Please try again.");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl p-0 max-h-[90vh] overflow-hidden flex flex-col bg-opacity-100 bg-white rounded-lg shadow-lg">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-lg font-semibold">
            Upload Document
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto">
          {/* Left Column - File Upload & Preview */}
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!file ? (
              <div className="relative border-2 border-dashed rounded-lg p-6 text-center min-h-[400px] flex flex-col items-center justify-center border-gray-300">
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
                  PDF, DOC, DOCX or TXT up to 10MB
                </p>
              </div>
            ) : (
              <Card className="flex flex-col">
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
                    <Button variant="ghost" size="sm" onClick={handleClose}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Preview */}
                  {previewURL && (
                    <div className="h-64 border border-gray-300 rounded-md overflow-hidden">
                      <iframe
                        src={previewURL}
                        className="w-full h-full"
                        title="File Preview"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Metadata */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Document Type Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Document Type
                  </Label>
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
                      <SelectTrigger className="bg-white border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-primary focus:ring-opacity-50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 shadow-lg rounded-lg border border-gray-300">
                        {documentTypes.map((type) => (
                          <SelectItem
                            key={type.id}
                            value={type.id.toString()}
                            className="bg-white px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100"
                          >
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowDocTypeDialog(true)}
                      className="hover:bg-gray-200"
                    >
                      <Plus className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>

                {/* Metadata Section */}
                {selectedDocType && (
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">
                      Metadata
                    </Label>
                    <div className="space-y-2 bg-gray-50 rounded-md p-4 border border-gray-200">
                      {selectedDocType.metadata.map((field) => (
                        <div
                          key={field.name}
                          className="flex justify-between items-center py-2 border-b border-gray-200 last:border-none"
                        >
                          <span className="font-medium text-gray-700">
                            {field.name}
                          </span>
                          {field.type === "select" ? (
                            <div className="w-1/2">
                              <Select
                                value={metadata[field.name] || ""}
                                onValueChange={(value) =>
                                  handleMetadataChange(field.name, value)
                                }
                              >
                                <SelectTrigger className="bg-white border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-primary focus:ring-opacity-50">
                                  <SelectValue
                                    placeholder={`Select ${field.name}`}
                                  />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50 shadow-lg rounded-lg border border-gray-300">
                                  {field.options?.map((option: string) => (
                                    <SelectItem
                                      key={option}
                                      value={option}
                                      className="bg-white px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100"
                                    >
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {field.value || "Not Provided"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save/Cancel Actions */}
                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200 rounded-md px-6 py-2 font-medium"
                  >
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
                    } focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 rounded-md px-6 py-2 font-medium`}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Document Type Creation Dialog */}
      <Dialog
        open={showDocTypeDialog}
        onOpenChange={() => setShowDocTypeDialog(false)}
      >
        <DialogContent className="max-w-md bg-white rounded-md shadow-lg p-6">
          <DocumentTypeCreation
            onCreate={handleCreateNewDocType}
            onCancel={() => setShowDocTypeDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
