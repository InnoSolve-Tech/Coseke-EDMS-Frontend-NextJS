"use client";

import React, { useState, useEffect } from "react";
import { CreateNewFolder, FileUpload } from "@mui/icons-material";
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
  FormControl,
  Modal,
  Input,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import FileUploadDialog from "@/components/folder/FileUploadDialog";
import SearchBar from "@/components/folder/SearchBar";
import { getFiles, getFolders, addDocumentsByFolderId, createFolders, deleteFile, deleteFolder, DirectoryData, createSubFolders, fetchChildFolders, getFilesByFolderID, getDocumentTypes, getFilesByHash } from "@/components/files/api";
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import axios from 'axios';

interface FileNode {
  id: string;
  label: string;
  type: 'file' | 'folder';
  metadata?: Record<string, unknown>;
  children?: FileNode[];
  folderID?: number;
  fileId?: number;
  parentFolderID?: number; // New field to track parent folder
}

interface FileData {
  id: number;
  name?: string;
  filename?: string;
  folderID?: number;
  fileId?: number;
  documentType?: string;
  documentName?: string;
  hashName?: string;
  fileLink?: string | null;
  mimeType?: string;
  metadata?: {
    author?: string;
    version?: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  createdDate?: string;
  lastModifiedDateTime?: string;
  lastModifiedBy?: number;
  createdBy?: number;
  [key: string]: unknown;
}

interface DocumentType {
  id: number;
  name: string;
  metadata: MetadataField[];
}

interface MetadataField {
  name: string;
  type: 'string' | 'select' | 'number' | 'date';
  value: string | null;
  options?: string[];
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState<FileNode[]>([
    { id: "0", label: "Root", type: 'folder', folderID: 0 },
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuTarget, setMenuTarget] = useState<FileNode | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [fileData, setFileData] = useState<FileNode[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showFoldersOnly, setShowFoldersOnly] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const router = useRouter();
  const [folderCount, setFolderCount] = useState<string>("...");
  const [currentFolderID, setCurrentFolderID] = useState<number | null>(null);
  const [isSubfolderMode, setIsSubfolderMode] = useState(false);
  const [folderStructure, setFolderStructure] = useState<FileNode[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [fileCount, setFileCount] = useState<string>("...");


  useEffect(() => {
    const loadFoldersAndFiles = async () => {
      try {
        // Fetch folders with their files
        const foldersResponse = await getFolders();
        const folders = Array.isArray(foldersResponse)
          ? foldersResponse
          : foldersResponse.data || [];

        const folderNodesWithFiles: FileNode[] = [];

        for (const folder of folders) {
          // Convert folder to FileNode
          const folderNode: FileNode = {
            id: folder.folderID?.toString() || "",
            label: folder.name,
            type: 'folder',
            folderID: folder.folderID,
            parentFolderID: folder.parentFolderID || 0,
          };

          // Add files directly from the folder
          const fileNodes = (folder.files || []).map((file: FileData): FileNode => ({
            id: file.id.toString(),
            label: file.filename || "Unnamed File",
            type: "file",
            folderID: folder.folderID,
            fileId: file.id,
            parentFolderID: folder.folderID,
            metadata: file
          }));

          // Add folder and its files to the list
          folderNodesWithFiles.push(folderNode, ...fileNodes);
        }

        // Update state with folders and their files
        setFileData(folderNodesWithFiles);
        setFolderCount(folders.length.toString());
      } catch (error) {
        console.error("Failed to load folders and files:", error);
        setFolderCount("0");
      }
    };

    loadFoldersAndFiles();
  }, []);

  useEffect(() => {
    const fetchFolderCount = async () => {
      try {
        const foldersResponse = await getFolders();
        console.log("Raw response:", foldersResponse);

        const folders = Array.isArray(foldersResponse)
          ? foldersResponse
          : foldersResponse.data || [];

        console.log("Parsed folders:", folders);
        setFolderCount(folders.length > 0 ? folders.length.toString() : "0");
      } catch (error) {
        console.error("Error fetching folder data:", error);
        setFolderCount("---");
      }
    };

    fetchFolderCount();
  }, []);



  useEffect(() => {
    const fetchFileCount = async () => {
      try {
        const filesResponse = await getFiles();
        const files = filesResponse.data || [];
        setFileCount(files.length > 0 ? files.length.toLocaleString() : "0");
      } catch (error) {
        console.error("Error fetching file data:", error);
        setFileCount("---");
      }
    };

    fetchFileCount();
  }, []);

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        const types = await getDocumentTypes();
        setDocumentTypes(types);
      } catch (error) {
        console.error("Error fetching document types:", error);
      }
    };

    fetchDocumentTypes();
  }, []);

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


  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleAction = async (action: string) => {
    if (!menuTarget || !menuTarget.metadata) return;
  
    const fileMetadata = menuTarget.metadata as FileData;
  
    if (!fileMetadata.hashName) {
      alert('File cannot be processed. Hash name is missing.');
      return;
    }
  
    try {
      const blob = await getFilesByHash(fileMetadata.hashName);
      const mimeType = fileMetadata.mimeType || blob.type || 'application/octet-stream';
      const url = window.URL.createObjectURL(blob);
  
      if (action === "View") {
        // View logic based on MIME type
        if (mimeType === 'application/pdf') {
          window.open(url, '_blank');
        } else if (mimeType.startsWith('image/')) {
          const img = new Image();
          img.src = url;
          img.style.maxWidth = '100%';
          document.body.appendChild(img);
        } else {
          alert(`Unsupported file type for viewing: ${mimeType}`);
        }
      } else if (action === "Download") {
        // Download logic
        const link = document.createElement('a');
        link.href = url;
        link.download = fileMetadata.filename || fileMetadata.name || 'downloaded-file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
  
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to retrieve file:', error);
      alert('Unable to retrieve file. Please try again.');
    }
  };
  
  
  const handleCreateFolder = async () => {
    try {
      // For root-level folder creation
      const parentFolderID = currentPath[currentPath.length - 1]?.folderID || 0;

      const newFolder: Omit<DirectoryData, 'id'> = {
        name: newFolderName,
        folderID: parentFolderID,
      };

      const createdFolder = await createFolders(newFolder);

      if (createdFolder?.data?.id && createdFolder?.data?.name) {
        const folderId = createdFolder.data.id.toString();
        const folderData: FileNode = {
          id: folderId,
          label: createdFolder.data.name,
          type: 'folder',
          folderID: createdFolder.data.folderID,
        };

        setFileData((prev) => [...prev, folderData]);
      }

      setIsCreateFolderModalOpen(false);
      setNewFolderName('');
      setIsSubfolderMode(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleCreateSubFolder = async () => {
    try {
      if (!currentFolderID) {
        throw new Error("No parent folder selected.");
      }

      const newFolder: DirectoryData = {
        name: newFolderName.trim(),
        parentFolderID: currentFolderID,
      };

      const createdFolder = await createSubFolders(newFolder);

      if (createdFolder.id && createdFolder.name) {
        const newFolderNode: FileNode = {
          id: createdFolder.id.toString(),
          label: createdFolder.name,
          type: "folder",
          folderID: createdFolder.id,
          parentFolderID: createdFolder.parentFolderID,
        };

        setFileData((prev) => [...prev, newFolderNode]);
        setExpanded((prev) => ({
          ...prev,
          [currentFolderID.toString()]: true, // Expand parent folder
        }));
      }

      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
      setMenuTarget(null);
    } catch (error) {
      console.error("Failed to create folder:", error);
      alert("Failed to create folder. Please try again.");
    }
  };


  const handleUpload = async (file: File, documentType: string, metadata: Record<string, any>) => {
    try {
      const currentFolder = currentPath[currentPath.length - 1];
      if (!currentFolder?.folderID) {
        throw new Error("No folder selected for upload");
      }

      // Create the file data object
      const fileData = {
        documentName: file.name,
        documentType: documentType,
        metadata: metadata,
        folderID: currentFolder.folderID,
        mimeType: file.type
      };

      // Create form data
      const formData = new FormData();
      formData.append('fileData', new Blob([JSON.stringify(fileData)], { type: 'application/json' }));
      formData.append('file', file);

      // Make the API call
      const response = await axios.post(
        `/api/v1/files/${currentFolder.folderID}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        // Attempt to refresh the entire file list for the current folder
        const filesResponse = await getFilesByFolderID(currentFolder.folderID);
        const newFiles = filesResponse.data || [];

        // Convert the new files to FileNode format
        const newFileNodes = newFiles.map((item: FileData): FileNode => ({
          id: item.id.toString(),
          label: item.name || item.filename || "Unnamed",
          type: "file",
          folderID: currentFolder.folderID,
          fileId: item.id,
          metadata: item
        }));

        // Update the file data state
        setFileData(prev => {
          // Remove previous files from this folder and add newly fetched files
          const filteredData = prev.filter(
            item => item.type === 'folder' || item.folderID !== currentFolder.folderID
          );
          return [...filteredData, ...newFileNodes];
        });

        // Ensure the current folder is expanded to show new files
        setExpanded(prev => ({
          ...prev,
          [currentFolder.id]: true
        }));
      }

      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file. Please try again.");
    }
  };


  const handleSearch = (query: string, searchType: string, metadata: Record<string, unknown>) => {
    // Implement search logic here
    console.log('Search:', { query, searchType, metadata });
  };

  const handleNodeClick = (node: FileNode) => {
    if (node.type === 'folder') {
      // Toggle folder expansion
      setExpanded((prev) => ({
        ...prev,
        [node.id]: !prev[node.id]
      }));
    } else if (node.type === 'file') {
      // Navigate to file view
      router.push(`/dashboard/folders/file/${node.fileId}`);
    }
  };


  const renderTree = (nodes: FileNode[]) => {
    const renderNode = (node: FileNode, level: number = 0) => {
      const isFolder = node.type === 'folder';
      const isFile = node.type === 'file';
      const isOpen = expanded[node.id] || false;

      // Find direct children (sub-folders and files)
      const subFolders = nodes.filter(child =>
        child.type === 'folder' && child.parentFolderID === node.folderID
      );
      console.log('subfolders', subFolders)

      const directFiles = nodes.filter(child =>
        child.type === 'file' && child.folderID === node.folderID
      );
      console.log('files', directFiles)

      const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded((prev) => ({
          ...prev,
          [node.id]: !prev[node.id]
        }));
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
            onClick={() => handleNodeClick(node)}
            onContextMenu={(e) => handleRightClick(e, node)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            {/* Node Icon and Expansion Logic */}
            <span className="mr-2" style={{ display: 'flex', alignItems: 'center' }}>
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

              <span className="mr-2">
                {isFolder ? <Folder /> : <File />}
              </span>
            </span>

            <Typography>{node.label}</Typography>
          </ListItemButton>

          {/* Render children if folder is open */}
          {isFolder && isOpen && (
            <List>
              {/* Render sub-folders */}
              {subFolders.map(folder => renderNode(folder, level + 1))}

              {/* Render direct files */}
              {directFiles.map(file => renderNode(file, level + 1))}


            </List>
          )}
        </ListItem>
      );
    };

    // Find root-level folders (no parent or parent is 0/null)
    const rootFolders = nodes.filter(node =>
      node.type === 'folder' &&
      (node.parentFolderID === 0 || node.parentFolderID == null)
    );

    // Find root-level files (no parent or parent is 0/null)
    const rootFiles = nodes.filter(node =>
      node.type === 'file' &&
      (node.parentFolderID === 0 || node.parentFolderID == null)
    );

    return (
      <List>
        {/* Render root folders */}
        {rootFolders.map(folder => renderNode(folder))}

        {/* Render root files separately */}
        {rootFiles.map(file => (
          <ListItem
            key={file.id}
            sx={{
              my: 0.5,
            }}
          >
            <ListItemButton
              onClick={() => handleNodeClick(file)}
              onContextMenu={(e) => handleRightClick(e, file)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <span className="mr-2">
                <File />
              </span>
              <Typography>{file.label}</Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };


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
                  {folderCount}
                </Typography>
                <Typography level="body-sm">Total Folders</Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="success" sx={{ flexGrow: 1 }}>
              <CardContent>
                <Typography level="h4" fontWeight="lg">
                  {fileCount}
                </Typography>
                <Typography level="body-sm">Total Files</Typography>
              </CardContent>
            </Card>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Button
                onClick={() => setIsCreateFolderModalOpen(true)}
                startDecorator={<CreateNewFolder />}
              >
                New Folder
              </Button>
            </div>
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
              {renderTree(fileData)}
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
                <MenuItem onClick={() => handleAction("CreateSubfolder")}>
                  Create Subfolder
                </MenuItem>
                <MenuItem onClick={() => handleAction("UploadFile")}>
                  Upload File
                </MenuItem>
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
            folderID={currentFolderID}
          />

          <Modal
            open={isCreateFolderModalOpen}
            onClose={() => {
              setIsCreateFolderModalOpen(false);
              setNewFolderName('');
              setIsSubfolderMode(false);
              setMenuTarget(null);
            }}
            slotProps={{
              backdrop: {
                ref: undefined
              }
            }}
          >
            <Card sx={{ maxWidth: 400, margin: 'auto', mt: 8 }}>
              <CardContent>
                <Typography level="h4">
                  {isSubfolderMode
                    ? `Create Subfolder in ${menuTarget?.label || 'Current Folder'}`
                    : "Create New Folder"}
                </Typography>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder Name"
                  sx={{ mt: 2, mb: 2 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button
                    onClick={() => {
                      setIsCreateFolderModalOpen(false);
                      setNewFolderName('');
                      setIsSubfolderMode(false);
                      setMenuTarget(null);
                    }}
                    variant="outlined"
                    color="neutral"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={isSubfolderMode ? handleCreateSubFolder : handleCreateFolder}
                    disabled={!newFolderName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Modal>

        </CardContent>
      </Card>
    </div>
  );
}

function setNodes(arg0: (prevNodes: any) => any[]) {
  throw new Error("Function not implemented.");
}
