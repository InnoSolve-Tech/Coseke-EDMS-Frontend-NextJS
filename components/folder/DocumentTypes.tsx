import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Edit3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createDocumentType,
  getDocumentTypes,
  IDocumentType,
  IDocumentTypeForm,
  MetadataItem,
} from "./api";

interface DocumentTypeCreationProps {
  onCreate: (newDocType: IDocumentType) => void;
  onCancel: () => void;
}

export function DocumentTypeCreation({
  onCreate,
  onCancel,
}: DocumentTypeCreationProps) {
  const [inputValue, setInputValue] = useState("");
  const [metadataOptions, setMetadataOptions] = useState<MetadataItem[]>([]);
  const [isSelectField, setIsSelectField] = useState(false);
  const [selectOptions, setSelectOptions] = useState<string>("");
  const [textValue, setTextValue] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [existingDocTypes, setExistingDocTypes] = useState<IDocumentType[]>([]);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameExists, setNameExists] = useState(false);

  const defaultDocumentType: IDocumentTypeForm = {
    name: "",
    metadata: [],
  };

  const { control, handleSubmit, reset, watch } = useForm<IDocumentTypeForm>({
    defaultValues: defaultDocumentType,
  });

  const formValues = watch();

  useEffect(() => {
    const checkDuplicateName = async () => {
      const trimmedName = formValues.name.trim();

      if (!trimmedName) {
        setNameExists(false);
        return;
      }

      const currentDocTypes = await fetchDocTypes();

      // Check for duplicates (case-insensitive)
      const exists = currentDocTypes.some(
        (docType) => docType.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      setNameExists(exists);
    };

    checkDuplicateName();
  }, [formValues.name]);

  const fetchDocTypes = async () => {
    try {
      const types = await getDocumentTypes();
      setExistingDocTypes(types);
      return types;
    } catch (error) {
      console.error("Failed to fetch document types:", error);
      setError("Failed to fetch existing document types");
      return [];
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const handleAddMetadataField = () => {
    if (!inputValue) return;

    const newField: MetadataItem = {
      name: inputValue,
      type: isSelectField ? "select" : "text",
      value: isSelectField ? "" : textValue,
      options: isSelectField
        ? selectOptions
            .split(",")
            .map((opt) => opt.trim())
            .filter((opt) => opt)
        : [],
    };

    if (editingIndex !== null) {
      setMetadataOptions((prev) =>
        prev.map((field, index) => (index === editingIndex ? newField : field)),
      );
      setEditingIndex(null);
    } else {
      setMetadataOptions((prev) => [...prev, newField]);
    }

    setInputValue("");
    setSelectOptions("");
    setTextValue("");
    setIsSelectField(false);
  };

  const handleEditMetadataField = (index: number) => {
    const field = metadataOptions[index];
    setInputValue(field.name);
    setIsSelectField(field.type === "select");
    setTextValue(field.type === "text" ? field.value : "");
    setSelectOptions(
      field.type === "select" ? field.options?.join(", ") || "" : "",
    );
    setEditingIndex(index);
  };

  const handleCreateNewDocType = async (formData: IDocumentTypeForm) => {
    try {
      setError("");
      setIsSubmitting(true);

      const trimmedName = formData.name.trim();

      if (!trimmedName) {
        setError("Document type name is required");
        setIsSubmitting(false);
        return;
      }

      if (nameExists) {
        setError(`Document type "${trimmedName}" already exists.`);
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: trimmedName,
        metadata: metadataOptions.map((field) => ({
          name: field.name,
          type: field.type,
          value: field.type === "text" ? field.value : "",
          options: field.type === "select" ? field.options : [],
        })),
      };

      const newDocType = await createDocumentType(payload);
      await fetchDocTypes(); // Refresh the list of document types
      onCreate(newDocType);

      reset(defaultDocumentType);
      setMetadataOptions([]);
      setInputValue("");
      setSelectOptions("");
      setTextValue("");
      setIsSelectField(false);
    } catch (error) {
      console.error("Failed to create document type:", error);
      setError((error as Error).message || "Failed to create document type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset(defaultDocumentType);
    setMetadataOptions([]);
    setInputValue("");
    setSelectOptions("");
    setIsSelectField(false);
    setEditingIndex(null);
    setError("");
    onCancel();
  };

  return (
    <Card className="w-full max-w-3xl p-6 shadow-md rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Create New Document Type
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="docTypeName">Document Type Name</Label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  id="docTypeName"
                  placeholder="Enter document type name"
                  className="mt-1"
                  {...field}
                />
              )}
            />
            {nameExists && (
              <p className="text-sm text-red-500 mt-1">
                A document type with this name already exists.
              </p>
            )}
          </div>

          <div>
            <Label>Metadata Fields</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metadataFieldName">Metadata Field Name</Label>
                <Input
                  id="metadataFieldName"
                  placeholder="Enter Metadata Field Name"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadataFieldType">Field Type</Label>
                <Select
                  value={isSelectField ? "select" : "text"}
                  onValueChange={(value) =>
                    setIsSelectField(value === "select")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Field Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isSelectField ? (
                <div className="space-y-2">
                  <Label htmlFor="selectOptions">
                    Options (Comma-Separated)
                  </Label>
                  <Input
                    id="selectOptions"
                    placeholder="Enter options (comma-separated)"
                    value={selectOptions}
                    onChange={(e) => setSelectOptions(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="defaultValue">Default Value</Label>
                  <Input
                    id="defaultValue"
                    placeholder="Enter Default Value"
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                  />
                </div>
              )}

              <Button className="w-full mt-4" onClick={handleAddMetadataField}>
                <Plus className="mr-1 h-4 w-4" />
                {editingIndex !== null ? "Update Field" : "Add Field"}
              </Button>
            </div>

            {metadataOptions.length > 0 && (
              <div className="mt-6">
                <Label>Added Metadata Fields</Label>
                <div className="mt-4 space-y-4">
                  {metadataOptions.map((field, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">{field.name}</p>
                        <p className="text-sm text-gray-500">
                          Type: {field.type}
                          {field.type === "select" &&
                            ` (Options: ${field.options?.join(", ")})`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMetadataField(index)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setMetadataOptions((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleCreateNewDocType)}
              disabled={nameExists || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
