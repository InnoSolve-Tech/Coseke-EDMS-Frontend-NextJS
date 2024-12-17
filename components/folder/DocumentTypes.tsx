import React, { useState } from "react";
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
import {
  IDocumentTypeForm,
  MetadataItem,
  createDocumentType,
  IDocumentType,
} from "./api";
import { X, Plus } from "lucide-react";

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

  const defaultDocumentType: IDocumentTypeForm = {
    name: "",
    metadata: [],
  };

  const { control, handleSubmit, reset } = useForm<IDocumentTypeForm>({
    defaultValues: defaultDocumentType,
  });

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

    setMetadataOptions((prev) => [...prev, newField]);

    // Reset input fields
    setInputValue("");
    setSelectOptions("");
    setTextValue("");
    setIsSelectField(false);
  };

  const handleCreateNewDocType = async (formData: IDocumentTypeForm) => {
    try {
      // First handle any pending metadata field
      if (inputValue) {
        handleAddMetadataField();
      }

      // Create the payload with the accumulated metadata
      const payload = {
        name: formData.name,
        metadata: metadataOptions.map((field) => ({
          name: field.name,
          type: field.type,
          value: field.type === "text" ? field.value : "",
          options: field.type === "select" ? field.options : [],
        })),
      };

      // Call the API
      const newDocType = await createDocumentType(payload);

      // Handle success
      onCreate(newDocType);

      // Reset the form
      reset(defaultDocumentType);
      setMetadataOptions([]);
      setInputValue("");
      setSelectOptions("");
      setTextValue("");
      setIsSelectField(false);
    } catch (error) {
      console.error("Failed to create document type:", error);
    }
  };

  const handleCancel = () => {
    reset(defaultDocumentType);
    setMetadataOptions([]);
    setInputValue("");
    setSelectOptions("");
    setIsSelectField(false);
    onCancel();
  };

  return (
    <Card className="w-full max-w-2xl transition-all duration-200 hover:shadow-lg">
      <CardHeader className="border-b bg-secondary/10">
        <CardTitle className="text-2xl font-bold text-primary">
          Create New Document Type
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="docTypeName" className="text-sm font-semibold">
            Document Type Name
          </Label>
          <Controller
            control={control}
            name="name"
            rules={{ required: true }}
            render={({ field }) => (
              <Input
                id="docTypeName"
                placeholder="Enter new document type name"
                className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
                {...field}
              />
            )}
          />
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-semibold">Metadata Fields</Label>
          <div className="grid gap-4 rounded-lg bg-secondary/5 p-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Enter metadata field name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Select
                value={isSelectField ? "select" : "text"}
                onValueChange={(value) => setIsSelectField(value === "select")}
              >
                <SelectTrigger className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isSelectField && (
              <Input
                placeholder="Enter value for text field"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
              />
            )}

            {isSelectField && (
              <Input
                placeholder="Enter options (comma-separated)"
                value={selectOptions}
                onChange={(e) => setSelectOptions(e.target.value)}
                className="transition-all duration-200 hover:border-primary focus:ring-2 focus:ring-primary/20"
              />
            )}

            <Button
              onClick={handleAddMetadataField}
              className="w-full transition-all duration-200 hover:bg-primary/90"
              disabled={!inputValue}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Metadata Field
            </Button>
          </div>
        </div>

        {metadataOptions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Added Metadata Fields
            </Label>
            <div className="grid gap-2">
              {metadataOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-secondary/10 p-3 rounded-md transition-all duration-200 hover:bg-secondary/20"
                >
                  <div>
                    <span className="font-medium text-primary">
                      {option.name}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({option.type}
                      {option.type === "select" &&
                        option.options &&
                        `: ${option.options.join(", ")}`}
                      )
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMetadataOptions((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="transition-all duration-200 hover:bg-secondary/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handleCreateNewDocType)}
            className="transition-all duration-200 hover:bg-primary/90"
          >
            Create Document Type
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
