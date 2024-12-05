import React, { useState, useEffect } from 'react';
import { DocumentTypeCreation } from './DocumentTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IDocumentType, getDocumentTypes } from './api';
import { Plus } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DocumentTypesListProps {
  value?: number;
  onChange?: (docType: IDocumentType) => void;
}

export function DocumentTypesList({ value, onChange }: DocumentTypesListProps) {
  const [showCreation, setShowCreation] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<IDocumentType[]>([]);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const types = await getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error('Failed to fetch document types:', error);
    }
  };

  const handleCreateDocType = async (newDocType: IDocumentType) => {
    setDocumentTypes(prev => [...prev, newDocType]);
    setShowCreation(false);
    await fetchDocumentTypes();
    onChange?.(newDocType);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select
          value={value?.toString()}
          onValueChange={(selectedValue) => {
            const docType = documentTypes.find(dt => dt.id.toString() === selectedValue);
            if (docType && onChange) {
              onChange(docType);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select document type" />
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
          onClick={() => setShowCreation(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showCreation && (
        <Dialog open={showCreation} onOpenChange={setShowCreation}>
          <DialogContent>
            <DocumentTypeCreation
              onCreate={handleCreateDocType}
              onCancel={() => setShowCreation(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 