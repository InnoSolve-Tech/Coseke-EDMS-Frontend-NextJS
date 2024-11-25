"use client";

import React, { useState, useMemo } from "react";
import { Add } from "@mui/icons-material";
import {
  Breadcrumbs,
  Typography,
  Card,
  CardContent,
  Menu,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Button,
  Checkbox,
  FormControl
} from "@mui/joy";
import { useRouter } from "next/navigation";
import FileUploadDialog from "@/components/folder/FileUploadDialog";
import SearchBar from "@/components/folder/SearchBar";

// Import custom icons since we can't use MUI Icons directly
const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="currentColor"/>
  </svg>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.29 6.71L14.59 12L9.29 17.29L10.7 18.7L17.41 12L10.7 5.29L9.29 6.71Z" fill="currentColor"/>
  </svg>
);

const ExpandMoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.59 8.59L12 13.17L7.41 8.59L6 10L12 16L18 10L16.59 8.59Z" fill="currentColor"/>
  </svg>
);

interface FileNode {
  id: string;
  label: string;
  type: 'file' | 'folder';
  metadata?: Record<string, string>;
  children?: FileNode[];
}

const initialFileData: FileNode[] = [
  {
    id: "folder1",
    label: "Folder 1",
    type: 'folder',
    children: [
      { id: "file1", label: "File 1.txt", type: 'file', metadata: { author: 'John Doe', version: '1.0' } },
      { id: "file2", label: "File 2.txt", type: 'file', metadata: { author: 'Jane Smith', version: '2.0' } },
    ],
  },
  {
    id: "folder2",
    label: "Folder 2",
    type: 'folder',
    children: [
      {
        id: "subfolder1",
        label: "Subfolder 1",
        type: 'folder',
        children: [{ id: "file3", label: "File 3.txt", type: 'file', metadata: { author: 'Bob Johnson', version: '1.5' } }],
      },
      { id: "file4", label: "File 4.txt", type: 'file', metadata: { author: 'Alice Brown', version: '3.0' } },
    ],
  },
];

export default function Page() {
  const [currentPath, setCurrentPath] = useState<FileNode[]>([
    { id: "home", label: "Home", type: 'folder' },
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuTarget, setMenuTarget] = useState<FileNode | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [fileData, setFileData] = useState<FileNode[]>(initialFileData);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showFoldersOnly, setShowFoldersOnly] = useState(false);
  const router = useRouter();

  const handleRightClick = (event: React.MouseEvent, node: FileNode) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget as HTMLElement);
    setMenuTarget(node);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
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
    if (action === "View" && menuTarget) {
      router.push(`/dashboard/folders/file/${menuTarget.id}`);
    } else {
      if (!menuTarget) return;
      alert(`Action: ${action} on ${menuTarget.label}`);
      handleCloseMenu();
    }
  };

  const handleUpload = (file: File, metadata: Record<string, string>) => {
    const newFile: FileNode = {
      id: `file${Date.now()}`,
      label: file.name,
      type: 'file',
      metadata,
    };
    setFileData((prev) => [...prev, newFile]);
  };

  const handleSearch = (query: string, searchType: string, metadata: Record<string, string>) => {
    const searchInNode = (node: FileNode): boolean => {
      if (searchType === 'simple') {
        return node.label.toLowerCase().includes(query.toLowerCase());
      } else if (searchType === 'fullText') {
        return node.label.toLowerCase().includes(query.toLowerCase()) ||
          (node.metadata && Object.values(node.metadata).some(value => value.toLowerCase().includes(query.toLowerCase())))!;
      } else if (searchType === 'metadata') {
        return node.metadata! && Object.entries(metadata).every(([key, value]) => 
          node.metadata![key]?.toLowerCase().includes(value.toLowerCase())
        );
      }
      return false;
    };

    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce((acc: FileNode[], node) => {
        if (searchInNode(node)) {
          acc.push(node);
        } else if (node.children) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0) {
            acc.push({ ...node, children: filteredChildren });
          }
        }
        return acc;
      }, []);
    };

    const filteredData = filterNodes(fileData);
    setFileData(filteredData);
  };

  const renderTree = (nodes: FileNode[], parentPath: FileNode[]) => (
    <List>
      {nodes.map((node) => {
        if (showFoldersOnly && node.type !== 'folder') return null;
        const isFolder = node.type === 'folder';
        const isOpen = expanded[node.id] || false;

        return (
          <ListItem
            key={node.id}
            nested={isFolder}
            sx={{ my: 0.5 }}
          >
            <ListItemButton
              onClick={() => isFolder ? toggleNode(node.id) : handleNodeClick(node, parentPath)}
              onContextMenu={(e) => handleRightClick(e, node)}
            >
              <span className="mr-2">
                {isFolder ? (
                  <IconButton
                    size="sm"
                    variant="plain"
                    color="neutral"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode(node.id);
                    }}
                  >
                    {isOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                  </IconButton>
                ) : null}
              </span>
              <span className="mr-2">
                {isFolder ? (
                  <FolderIcon />
                ) : (
                  <FileIcon />
                )}
              </span>
              <Typography>{node.label}</Typography>
            </ListItemButton>
            {isOpen && isFolder && node.children && (
              <List sx={{ pl: 3 }}>
                {renderTree(node.children, [...parentPath, node])}
              </List>
            )}
          </ListItem>
        );
      })}
    </List>
  );

  const { folders: totalFolders, files: totalFiles } = useMemo(() => {
    const countNodes = (nodes: FileNode[]) => {
      let folders = 0;
      let files = 0;

      nodes.forEach((node) => {
        if (node.type === 'folder') {
          folders++;
          if (node.children) {
            const counts = countNodes(node.children);
            folders += counts.folders;
            files += counts.files;
          }
        } else {
          files++;
        }
      });

      return { folders, files };
    };

    return countNodes(fileData);
  }, [fileData]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Card variant="outlined" sx={{ height: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Breadcrumbs
            size="lg"
            sx={{
              '--Breadcrumbs-gap': '8px',
              '--Icon-fontSize': 'var(--joy-fontSize-xl2)',
            }}
          >
            {currentPath.map((crumb, index) => (
              <Typography
                key={crumb.id}
                fontSize="inherit"
                color={index === currentPath.length - 1 ? "primary" : "neutral"}
                onClick={() => handleBreadcrumbClick(index)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {crumb.label}
              </Typography>
            ))}
          </Breadcrumbs>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Card variant="soft" color="primary" sx={{ flexGrow: 1 }}>
              <CardContent>
                <Typography level="h4" fontWeight="lg">
                  {totalFolders}
                </Typography>
                <Typography level="body-sm">Total Folders</Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="success" sx={{ flexGrow: 1 }}>
              <CardContent>
                <Typography level="h4" fontWeight="lg">
                  {totalFiles}
                </Typography>
                <Typography level="body-sm">Total Files</Typography>
              </CardContent>
            </Card>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              startDecorator={<Add />}
            >
              Upload File
            </Button>
            <FormControl>
              <Checkbox
                label="Show Folders Only"
                checked={showFoldersOnly}
                onChange={(e) => setShowFoldersOnly(e.target.checked)}
              />
            </FormControl>
          </div>

          <SearchBar onSearch={handleSearch} />

          <Card variant="outlined" sx={{ flexGrow: 1, overflow: 'auto' }}>
            <CardContent>
              {renderTree(fileData, [{ id: "home", label: "Home", type: 'folder' }])}
            </CardContent>
          </Card>

          <Menu
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleCloseMenu}
            size="sm"
            placement="bottom-start"
          >
            {menuTarget && menuTarget.type === 'folder' ? (
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

          <FileUploadDialog
            open={uploadDialogOpen}
            onClose={() => setUploadDialogOpen(false)}
            onUpload={handleUpload}
          />
        </CardContent>
      </Card>
    </div>
  );
}