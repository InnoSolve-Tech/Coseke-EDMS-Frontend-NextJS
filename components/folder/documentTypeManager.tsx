"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { IDocumentType, IDocumentTypeForm, MetadataItem } from "./api";

interface DocumentTypeManagerProps {
  documentTypes: IDocumentType[];
  onCreateDocumentType: (docType: IDocumentTypeForm) => void;
  onUpdateDocumentType: (
    id: number,
    docType: Partial<IDocumentTypeForm>,
  ) => void;
  onDeleteDocumentType: (id: number) => void;
  selectedDocType: IDocumentType | null;
  onSelectDocumentType: (docType: IDocumentType | null) => void;
}

export function DocumentTypeManager({
  documentTypes,
  onCreateDocumentType,
  onUpdateDocumentType,
  onDeleteDocumentType,
  selectedDocType,
  onSelectDocumentType,
}: DocumentTypeManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newDocType, setNewDocType] = useState<IDocumentTypeForm>({
    name: "",
    metadata: [],
  });

  const addMetadataField = () => {
    const newField: MetadataItem = {
      name: "",
      type: "text",
      value: "",
      options: [],
    };
    setNewDocType((prev) => ({
      ...prev,
      metadata: [...prev.metadata, newField],
    }));
  };

  const updateMetadataField = (index: number, field: Partial<MetadataItem>) => {
    setNewDocType((prev) => ({
      ...prev,
      metadata: prev.metadata.map((f, i) =>
        i === index ? { ...f, ...field } : f,
      ),
    }));
  };

  const removeMetadataField = (index: number) => {
    setNewDocType((prev) => ({
      ...prev,
      metadata: prev.metadata.filter((_, i) => i !== index),
    }));
  };

  const handleCreateDocumentType = () => {
    if (newDocType.name.trim()) {
      onCreateDocumentType(newDocType);
      setNewDocType({ name: "", metadata: [] });
      setIsCreating(false);
    }
  };

  const renderMetadataFieldEditor = (field: MetadataItem, index: number) => (
    <Card key={index} className="border-l-4 border-l-blue-500">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Field name"
            value={field.name}
            onChange={(e) =>
              updateMetadataField(index, { name: e.target.value })
            }
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeMetadataField(index)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600">Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value: string) =>
                updateMetadataField(index, { type: value })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="boolean">Yes/No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-600">Default Value</Label>
            <Input
              placeholder="Default value..."
              value={field.value || ""}
              onChange={(e) =>
                updateMetadataField(index, { value: e.target.value })
              }
              className="h-8"
            />
          </div>
        </div>

        {field.type === "select" && (
          <div>
            <Label className="text-xs text-gray-600">
              Options (comma-separated)
            </Label>
            <Input
              placeholder="Option 1, Option 2, Option 3"
              value={field.options?.join(", ") || ""}
              onChange={(e) =>
                updateMetadataField(index, {
                  options: e.target.value
                    .split(",")
                    .map((opt) => opt.trim())
                    .filter(Boolean),
                })
              }
              className="h-8"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Document Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Document Types
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Type
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-2 max-h-32 overflow-y-auto">
            {documentTypes.map((type) => (
              <div
                key={type.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDocType?.id === type.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onSelectDocumentType(type)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{type.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {type.metadata.length} fields
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(type.id);
                      setNewDocType({
                        name: type.name,
                        metadata: type.metadata,
                      });
                    }}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocumentType(type.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Document Type */}
      {(isCreating || editingId) && (
        <Card className="border-2 border-dashed border-blue-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {editingId ? "Edit Document Type" : "Create New Document Type"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Name *</Label>
              <Input
                placeholder="e.g., Invoice, Contract, Report"
                value={newDocType.name}
                onChange={(e) =>
                  setNewDocType((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Metadata Fields</Label>
                <Button size="sm" variant="outline" onClick={addMetadataField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {newDocType.metadata.map((field, index) =>
                  renderMetadataFieldEditor(field, index),
                )}
                {newDocType.metadata.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No metadata fields yet</p>
                    <p className="text-xs">
                      Click "Add Field" to create custom fields for this
                      document type
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setNewDocType({ name: "", metadata: [] });
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingId) {
                    onUpdateDocumentType(editingId, newDocType);
                    setEditingId(null);
                  } else {
                    handleCreateDocumentType();
                  }
                }}
                disabled={!newDocType.name.trim()}
              >
                <Save className="h-4 w-4 mr-1" />
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
