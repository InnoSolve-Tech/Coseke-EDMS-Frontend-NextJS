"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Type, Hash, List, FileText, ToggleLeft } from "lucide-react";
import type { MetadataItem } from "./api";

interface MetadataFormProps {
  fields: MetadataItem[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function MetadataForm({ fields, values, onChange }: MetadataFormProps) {
  const getFieldIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />;
      case "number":
        return <Hash className="h-4 w-4" />;
      case "select":
        return <List className="h-4 w-4" />;
      case "textarea":
        return <FileText className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "boolean":
        return <ToggleLeft className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const renderField = (field: MetadataItem) => {
    const value = values[field.name] || field.value || "";

    switch (field.type) {
      case "text":
        return (
          <Input
            placeholder={`Enter ${field.name.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={`Enter ${field.name.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={`Enter ${field.name.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="min-h-[80px] transition-all duration-200 focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        );

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => onChange(field.name, val)}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === "true" || value === true}
              onCheckedChange={(checked) => onChange(field.name, checked)}
            />
            <Label className="text-sm text-gray-600">
              {value === "true" || value === true ? "Yes" : "No"}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            placeholder={`Enter ${field.name.toLowerCase()}`}
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  if (fields.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No metadata fields configured</p>
          <p className="text-xs">
            This document type doesn't have any custom fields
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Document Metadata
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {fields.length} field{fields.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-blue-600">{getFieldIcon(field.type)}</div>
              <Label className="text-sm font-medium flex items-center gap-1">
                {field.name}
              </Label>
              <Badge variant="outline" className="text-xs capitalize">
                {field.type}
              </Badge>
            </div>
            {renderField(field)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
