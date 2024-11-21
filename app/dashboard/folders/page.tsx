"use client";

import React, { useState, useMemo, useRef } from "react";
import { Folder, Description } from "@mui/icons-material";
import { Breadcrumbs, Typography, Card, CardContent, Menu, MenuItem } from "@mui/joy";

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

const Page: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<FileNode[]>([
    { id: "home", label: "Home" },
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuTarget, setMenuTarget] = useState<FileNode | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

const handleRightClick = (event: React.MouseEvent, node: FileNode) => {
  event.preventDefault();
  setAnchorEl(event.currentTarget as HTMLElement);
  setMenuTarget(node);
};

const handleCloseMenu = () => {
  setAnchorEl(null); // Close the menu
  setMenuTarget(null);
};

  const menuRef = useRef<HTMLDivElement>(null);

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
      const isFolder = !!node.children;
      const isOpen = expanded[node.id] || false;

      return (
        <div key={node.id} className="ml-4">
          <div
            className="flex items-center space-x-2"
            onContextMenu={(e) => handleRightClick(e, node)}
          >
            {isFolder && (
              <button
                onClick={() => toggleNode(node.id)}
                className="text-blue-500 focus:outline-none"
              >
                {isOpen ? "-" : "+"}
              </button>
            )}
            {isFolder && <Folder className="w-5 h-5 text-yellow-500" />}
            {!isFolder && <Description className="w-5 h-5 text-gray-500" />}
            <span
              className={`cursor-pointer ${
                isFolder ? "font-semibold text-gray-800" : "text-gray-600"
              }`}
              onClick={() => handleNodeClick(node, parentPath)}
            >
              {node.label}
            </span>
          </div>
          {isOpen && node.children && (
            <div className="ml-4 border-l border-gray-300 pl-2">
              {renderTree(node.children, [...parentPath, node])}
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
        if (node.children) {
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

  const menuStyles = anchorEl ? {
    position: 'absolute',
    left: `${anchorEl.getBoundingClientRect().left}px`, // Align to the left of the right-click position
    top: `${anchorEl.getBoundingClientRect().top + anchorEl.offsetHeight}px`, // Place the menu below the click
    transform: 'none',
  } : {};

  return (
    <div className="p-5 space-y-5">
                  <Breadcrumbs className="mb-5 text-lg">
            {currentPath.map((crumb, index) => (
              <Typography
                key={crumb.id}
                color={index === currentPath.length - 1 ? "primary" : "neutral"}
                onClick={() => handleBreadcrumbClick(index)}
                className={`cursor-pointer ${
                  index === currentPath.length - 1
                    ? "font-bold text-blue-700"
                    : "text-gray-500 hover:text-blue-500"
                }`}
              >
                {crumb.label}
              </Typography>
            ))}
          </Breadcrumbs>
      {/* Total Folders and Files Cards */}
      <div className="flex space-x-4">
        <Card className="w-full">
          <CardContent>
            <Typography  className="font-semibold">
              Total Folders
            </Typography>
            <Typography className="text-2xl font-bold text-blue-600">
              {totalFolders}
            </Typography>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent>
            <Typography className="font-semibold">
              Total Files
            </Typography>
            <Typography className="text-2xl font-bold text-green-600">
              {totalFiles}
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Tree View and Breadcrumbs Card */}
      <Card>
        <CardContent>
          {/* File Explorer */}
          <div>{renderTree(fileData, [{ id: "home", label: "Home" }])}</div>
        </CardContent>
      </Card>

      {/* Context Menu */}
      {anchorEl && (
  <Menu
    open={Boolean(anchorEl)}
    anchorEl={anchorEl}
    onClose={handleCloseMenu}
    sx={menuStyles}
    
  >
    {menuTarget?.children ? (
      <>
        <MenuItem onClick={() => handleAction("Edit")}>Edit</MenuItem>
        <MenuItem onClick={() => handleAction("Delete")}>Delete</MenuItem>
      </>
    ) : (
      <>
        <MenuItem onClick={() => handleAction("View")}>View</MenuItem>
        <MenuItem onClick={() => handleAction("Download")}>Download</MenuItem>
        <MenuItem onClick={() => handleAction("Delete")}>Delete</MenuItem>
      </>
    )}
  </Menu>
)}

    </div>
  );
};

export default Page;
