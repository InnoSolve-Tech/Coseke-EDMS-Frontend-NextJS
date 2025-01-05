"use client";

import {
  List,
  ListItem,
  ListItemButton,
  IconButton,
  Typography,
} from "@mui/joy";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { FileNode } from "@/types/file";

interface FileTreeProps {
  nodes: FileNode[];
  expanded: Record<string, boolean>;
  onNodeClick: (node: FileNode) => void;
  onRightClick: (e: React.MouseEvent, node: FileNode) => void;
  onToggleExpand: (nodeId: string) => void;
}

export function FileTree({
  nodes,
  expanded,
  onNodeClick,
  onRightClick,
  onToggleExpand,
}: FileTreeProps) {
  const renderNode = (node: FileNode, level: number = 0) => {
    const isFolder = node.type === "folder";
    const isOpen = expanded[node.id] || false;

    const subFolders = nodes.filter(
      (child) =>
        child.type === "folder" && child.parentFolderID === node.folderID,
    );

    const directFiles = nodes.filter(
      (child) => child.type === "file" && child.folderID === node.folderID,
    );

    const handleToggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand(node.id);
    };

    return (
      <ListItem
        key={node.id}
        nested={isFolder}
        sx={{
          my: 0.5,
          ml: level * 2,
        }}
      >
        <ListItemButton
          onClick={() => onNodeClick(node)}
          onContextMenu={(e) => onRightClick(e, node)}
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "8px",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <span
            className="mr-2"
            style={{ display: "flex", alignItems: "center" }}
          >
            {isFolder && (
              <IconButton
                size="sm"
                variant="plain"
                color="neutral"
                onClick={handleToggleExpand}
              >
                {isOpen ? <ChevronDown /> : <ChevronRight />}
              </IconButton>
            )}
            <span className="mr-2">{isFolder ? <Folder /> : <File />}</span>
          </span>
          <Typography>{node.label}</Typography>
        </ListItemButton>

        {isFolder && isOpen && (
          <List>
            {subFolders.map((folder) => renderNode(folder, level + 1))}
            {directFiles.map((file) => renderNode(file, level + 1))}
          </List>
        )}
      </ListItem>
    );
  };

  const rootFolders = nodes.filter(
    (node) =>
      node.type === "folder" &&
      (node.parentFolderID === 0 || node.parentFolderID == null),
  );

  const rootFiles = nodes.filter(
    (node) =>
      node.type === "file" &&
      (node.parentFolderID === 0 || node.parentFolderID == null),
  );

  return (
    <List>
      {rootFolders.map((folder) => renderNode(folder))}
      {rootFiles.map((file) => renderNode(file))}
    </List>
  );
}
