"use client";

import React, { useState, useMemo } from "react";
import { Folder, Notebook } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface FileNode {
  id: string;
  label: string;
  children?: FileNode[];
}

const fileData: FileNode[] = [
  {
    id: "folder1",
    label: "Folder 1",
    children: [
      { id: "file1", label: "File 1.txt" },
      { id: "file2", label: "File 2.txt" },
    ],
  },
  {
    id: "folder2",
    label: "Folder 2",
    children: [
      {
        id: "subfolder1",
        label: "Subfolder 1",
        children: [{ id: "file3", label: "File 3.txt" }],
      },
      { id: "file4", label: "File 4.txt" },
    ],
  },
];

const Page = () => {
  const [currentPath, setCurrentPath] = useState<FileNode[]>([
    { id: "home", label: "Home" },
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuTarget, setMenuTarget] = useState<FileNode | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleRightClick = (event: React.MouseEvent, node: FileNode) => {
    event.preventDefault();
    setMenuTarget(node);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setIsMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    setMenuTarget(null);
  };

  const toggleNode = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNodeClick = (node: FileNode, parentPath: FileNode[]) => {
    setCurrentPath([...parentPath, node]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleAction = (action: string) => {
    if (!menuTarget) return;
    alert(`Action: ${action} on ${menuTarget.label}`);
    handleCloseMenu();
  };

  const renderTree = (nodes: FileNode[], parentPath: FileNode[]) =>
    nodes.map((node) => {
      const isFolder = Array.isArray(node.children) && node.children.length > 0;
      const isOpen = expanded[node.id] || false;

      return (
        <div key={node.id} className="ml-4">
          <div
            className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded"
            onContextMenu={(e) => handleRightClick(e, node)}
          >
            {isFolder && (
              <button
                onClick={() => toggleNode(node.id)}
                className="text-blue-500 focus:outline-none w-4"
              >
                {isOpen ? "-" : "+"}
              </button>
            )}
            {isFolder ? (
              <Folder className="w-4 h-4 text-yellow-500" />
            ) : (
              <Notebook className="w-4 h-4 text-gray-500" />
            )}
            <span
              className={`cursor-pointer ${
                isFolder ? "font-semibold text-gray-800" : "text-gray-600"
              }`}
              onClick={() => handleNodeClick(node, parentPath)}
            >
              {node.label}
            </span>
          </div>
          {isOpen && isFolder && (
            <div className="ml-4 border-l border-gray-300 pl-2">
              {renderTree(node.children!, [...parentPath, node])}
            </div>
          )}
        </div>
      );
    });

  const { folders: totalFolders, files: totalFiles } = useMemo(() => {
    const countNodes = (nodes: FileNode[]) => {
      let folders = 0;
      let files = 0;

      nodes.forEach((node) => {
        if (Array.isArray(node.children) && node.children.length > 0) {
          folders++;
          const counts = countNodes(node.children);
          folders += counts.folders;
          files += counts.files;
        } else {
          files++;
        }
      });

      return { folders, files };
    };

    return countNodes(fileData);
  }, []);

  return (
    <div className="p-5 space-y-5">
      <nav className="flex mb-5" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          {currentPath.map((crumb, index) => (
            <li key={crumb.id} className="inline-flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`inline-flex items-center ${
                  index === currentPath.length - 1
                    ? "font-bold text-blue-700"
                    : "text-gray-500 hover:text-blue-500"
                }`}
              >
                {crumb.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex space-x-4">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="font-semibold">Total Folders</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalFolders}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="font-semibold">Total Files</div>
            <div className="text-2xl font-bold text-green-600">
              {totalFiles}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div>{renderTree(fileData, [{ id: "home", label: "Home" }])}</div>
        </CardContent>
      </Card>

      {menuTarget && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div 
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: `translate(${menuPosition.x}px, ${menuPosition.y}px)`,
                visibility: 'hidden'
              }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {Array.isArray(menuTarget.children) && menuTarget.children.length > 0 ? (
              <>
                <DropdownMenuItem onClick={() => handleAction("Edit")}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("Delete")}>
                  Delete
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handleAction("View")}>
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("Download")}>
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("Delete")}>
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default Page;