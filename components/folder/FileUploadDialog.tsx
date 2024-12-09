import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, Save, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useForm, Controller } from "react-hook-form";
import { IDocumentType, IDocumentTypeForm, MetadataItem, getDocumentTypes } from './api';
import { DocumentTypeCreation } from './DocumentTypes';
import { addDocument, addDocumentByFolderId } from '../files/api';
import { FileManagerData } from '../files/api';
import { base64ToFile, fileToBase64 } from '../helpers';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, documentType: string, metadata: Record<string, any>) => Promise<void>;
  folderID?: number | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['.pdf', '.doc', '.docx', '.txt'];

interface MetadataField {
  name: string;
  type: 'text' | 'select';
  options?: string[];  // For select fields
  value?: string;
}

interface MetadataPayload {
  author: string;
  version: string;
  description: string;
  tags: string[];
  [key: string]: string | string[];
}

export default function FileUploadDialog({ open, onClose, onUpload, folderID }: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<IDocumentType | null>(null);
  const [showNewDocTypeForm, setShowNewDocTypeForm] = useState(false);
  const [newMetadata, setNewMetadata] = useState<MetadataItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [metadataOptions, setMetadataOptions] = useState<MetadataField[]>([]);
  const [isSelectField, setIsSelectField] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string>('');
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);

  const defaultDocumentType: IDocumentTypeForm = {
    name: "",
    metadata: [],
  };

  const { control, handleSubmit, formState, reset } = useForm<IDocumentTypeForm>({
    defaultValues: defaultDocumentType,
  });

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  useEffect(() => {
    if (selectedDocType) {
      reset({
        name: selectedDocType.name,
        metadata: selectedDocType.metadata,
      });
      setMetadataOptions(selectedDocType.metadata.map(item => ({
        name: item.name,
        type: item.type as 'text' | 'select',
        options: item.options,
        value: item.value
      })));
    } else {
      reset(defaultDocumentType);
      setMetadataOptions([]);
    }
  }, [selectedDocType, reset]);

  const fetchDocumentTypes = async () => {
    try {
      const types = await getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error('Failed to fetch document types:', error);
    }
  };

  const handleCreateNewDocType = (newDocType: IDocumentType) => {
    setDocumentTypes(prev => [...prev, newDocType]);
    setSelectedDocType(newDocType);
    setShowNewDocTypeForm(false);
    reset(defaultDocumentType);
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 10MB limit");
      return false;
    }
    
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED_TYPES.includes(fileExtension)) {
      setError("Invalid file type. Please upload PDF, DOC, DOCX, or TXT files");
      return false;
    }
    
    return true;
  };

  const handleFile = async (file: File) => {
    if (validateFile(file)) {
      try {
        // Create a proper blob from the file
        const fileBlob = await file.arrayBuffer().then(buffer => 
          new Blob([buffer], { type: file.type })
        );
        const fileObject = new File([fileBlob], file.name, { type: file.type });
        setFile(fileObject);

        // Create preview if needed
        if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
          const url = URL.createObjectURL(fileObject);
          setPreviewUrl(url);
        }
        
        // Progress simulation
        setUploadProgress(0);
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process file. Please try again.');
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFile(event.target.files[0]);
    }
  };

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }
  
    try {
      const formData = new FormData();

       // Append the file directly to FormData
    formData.append('file', file);
    console.log("File appended:", file);
      
      // Append metadata
      const metadataString = JSON.stringify({
        author: metadata.author || '',
        version: metadata.version || '',
        description: metadata.description || '',
        tags: metadata.tags || '',
        ...Object.fromEntries(
          Object.entries(metadata).filter(([key]) => 
            !['author', 'version', 'description', 'tags'].includes(key)
          )
        )
      });
      formData.append('metadata', metadataString);
  
      // Debugging: Log the formData entries
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }
  
      // Perform upload
      await addDocument(formData);
      console.log("Upload successful");
      onClose(); // Close the modal
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Failed to upload file. Please try again.");
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Document Upload & Preview</DialogTitle>
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
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center min-h-[400px] flex flex-col items-center justify-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                  >
                    <span>Upload a file</span>
                    <Input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept={ALLOWED_TYPES.join(',')}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Progress value={uploadProgress} className="h-2 mb-4" />
                  
                  {previewUrl && (
                    <div className="flex-1 w-full h-[400px] border rounded">
                      <iframe
                        src={previewUrl}
                        className="w-full h-full"
                        title="File preview"
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
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedDocType?.id.toString()}
                      onValueChange={(value) => {
                        const docType = documentTypes.find(dt => dt.id.toString() === value);
                        setSelectedDocType(docType || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map(type => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowDocTypeDialog(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    placeholder="Enter author name"
                    value={metadata.author || ''}
                    onChange={(e) => handleMetadataChange('author', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input
                    placeholder="Enter version number"
                    value={metadata.version || ''}
                    onChange={(e) => handleMetadataChange('version', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter document description"
                    rows={4}
                    value={metadata.description || ''}
                    onChange={(e) => handleMetadataChange('description', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input
                    placeholder="Enter tags (comma-separated)"
                    value={metadata.tags || ''}
                    onChange={(e) => handleMetadataChange('tags', e.target.value)}
                  />
                </div>

                {selectedDocType?.metadata.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.name}</Label>
                    {field.type === 'select' ? (
                      <Select
                        value={metadata[field.name] || ''}
                        onValueChange={(value) => handleMetadataChange(field.name, value)}
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
                      <Input
                        placeholder={`Enter ${field.name}`}
                        value={metadata[field.name] || ''}
                        onChange={(e) => handleMetadataChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploadProgress < 100}
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

      {/* Add the DocumentTypeCreation dialog */}
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