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
const ALLOWED_TYPES = [".pdf", ".doc", ".docx", ".txt"];

export default function FileUploadDialog({
  open,
  onClose,
  onUpload,
  folderID,
}: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
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
        simulateUploadProgress(); // Simulate upload progress
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
      setError("Invalid file type. Please upload PDF, DOC, DOCX, or TXT files");
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

      // Add more detailed error logging
      try {
        await addDocument(payload, file, folderID || 0);
        console.log("Upload successful");
        onClose();
      } catch (apiError: any) {
        console.error("Detailed API Error:", {
          message: apiError.message,
          response: apiError.response,
          stack: apiError.stack,
        });
        setError(
          apiError.message || "Failed to upload file. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Payload preparation error:", error);
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
      <DialogContent className="max-w-5xl p-0 max-h-[90vh] overflow-hidden flex flex-col bg-opacity-100 bg-white">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Document Upload & Preview</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto">
          {/* Left Column - File Upload & Progress */}
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
              <Card className="min-h-[400px] flex flex-col">
                <CardContent className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-4">
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
                  <Progress value={uploadProgress} className="h-2 mb-4" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Metadata */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={selectedDocType?.id.toString()}
                    onValueChange={(value) => {
                      const docType = documentTypes.find(
                        (dt) => dt.id.toString() === value,
                      );
                      setSelectedDocType(docType || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setShowDocTypeDialog(true)}
                  >
                    <Plus />
                  </Button>
                </div>

                {selectedDocType?.metadata.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.name}</Label>
                    {field.type === "select" ? (
                      <Select
                        value={metadata[field.name] || ""}
                        onValueChange={(value) =>
                          handleMetadataChange(field.name, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-gray-600">{metadata[field.name]}</p>
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-2 pt-4">
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

      <Dialog open={showDocTypeDialog} onOpenChange={setShowDocTypeDialog}>
        <DialogContent>
          <DocumentTypeCreation
            onCreate={(newDocType) => {
              handleCreateNewDocType(newDocType);
              setShowDocTypeDialog(false);
            }}
            onCancel={() => setShowDocTypeDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
