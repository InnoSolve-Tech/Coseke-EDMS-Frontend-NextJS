import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DirectoryData } from "@/components/files/api";

const FolderTreeSelector = ({
  folders,
  onSelect,
  selectedFolderId,
  triggerButtonText = "Select Folder",
}: {
  folders: DirectoryData[];
  onSelect: (folderId: number) => void;
  selectedFolderId?: number;
  triggerButtonText?: string;
}) => {
  const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Get selected folder name for display
  const getSelectedFolderName = () => {
    if (!selectedFolderId) return null;
    return folders.find((f) => f.folderID === selectedFolderId)?.name;
  };

  // Create a map of parent folders to their children
  const getFolderHierarchy = (parentId: number = 0): DirectoryData[] => {
    return folders.filter((folder) => folder.parentFolderID === parentId);
  };

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId],
    );
  };

  const handleSelect = (folderId: number) => {
    onSelect(folderId);
    setIsOpen(false);
  };

  const renderFolder = (folder: DirectoryData, level: number = 0) => {
    const children = getFolderHierarchy(folder.folderID);
    const isExpanded = expandedFolders.includes(folder.folderID!);
    const hasChildren = children.length > 0;
    const isSelected = selectedFolderId === folder.folderID;

    return (
      <div key={folder.folderID} className="w-full">
        <div
          className={`
            flex items-center px-2 py-1 hover:bg-gray-100 rounded-md cursor-pointer
            ${isSelected ? "bg-blue-50 hover:bg-blue-100" : ""}
          `}
          style={{ paddingLeft: `${level * 20}px` }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={() => hasChildren && toggleFolder(folder.folderID!)}
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
          </Button>
          <Button
            variant="ghost"
            className={`flex items-center gap-2 h-8 px-2 justify-start ${isSelected ? "text-blue-600" : ""}`}
            onClick={() => handleSelect(folder.folderID!)}
          >
            <Folder className="h-4 w-4" />
            <span className="truncate">{folder.name}</span>
          </Button>
        </div>
        {isExpanded && children.map((child) => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-2">
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left">
            <Folder className="mr-2 h-4 w-4" />
            {getSelectedFolderName() || triggerButtonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Folder</DialogTitle>
          </DialogHeader>
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {getFolderHierarchy().map((folder) => renderFolder(folder))}
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default FolderTreeSelector;
