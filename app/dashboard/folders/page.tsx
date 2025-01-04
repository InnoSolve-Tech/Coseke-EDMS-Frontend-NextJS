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
  Snackbar,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import FileUploadDialog from "@/components/folder/FileUploadDialog";
import SearchBar from "@/components/folder/SearchBar";
import {
  getFiles,
  getFolders,
  addDocumentsByFolderId,
  createFolders,
  deleteFile,
  deleteFolder,
  DirectoryData,
  createSubFolders,
  fetchChildFolders,
  getFilesByFolderID,
  getDocumentTypes,
  getFilesByHash,
  editFolder,
} from "@/components/files/api";
import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import axios from "axios";
import { ColorPaletteProp } from "@mui/joy/styles";

interface FileNode {
  id: string;
  label: string;
  type: "file" | "folder";
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
  type: "string" | "select" | "number" | "date";
  value: string | null;
  options?: string[];
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState<FileNode[]>([
    { id: "0", label: "Root", type: "folder", folderID: 0 },
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuTarget, setMenuTarget] = useState<FileNode | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [fileData, setFileData] = useState<FileNode[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showFoldersOnly, setShowFoldersOnly] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const router = useRouter();
  const [folderCount, setFolderCount] = useState<string>("...");
  const [currentFolderID, setCurrentFolderID] = useState<number | null>(null);
  const [isSubfolderMode, setIsSubfolderMode] = useState(false);
  const [folderStructure, setFolderStructure] = useState<FileNode[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [fileCount, setFileCount] = useState<string>("...");
  const [renameFolderName, setRenameFolderName] = useState("");
  const [folderToRename, setFolderToRename] = useState<FileNode | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    color: ColorPaletteProp;
    message: string;
  }>({
    open: false,
    message: "",
    color: "success",
  });

  const loadFoldersAndFiles = async () => {
    try {
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
          type: "folder",
          folderID: folder.folderID,
          parentFolderID: folder.parentFolderID || 0,
        };

        // Add files directly from the folder
        const fileNodes = (folder.files || []).map(
          (file: FileData): FileNode => ({
            id: file.id.toString(),
            label: file.filename || "Unnamed File",
            type: "file",
            folderID: folder.folderID,
            fileId: file.id,
            parentFolderID: folder.folderID,
            metadata: file,
          }),
        );

        // Add folder and its files to the list
        folderNodesWithFiles.push(folderNode, ...fileNodes);
      }

      return folderNodesWithFiles;
    } catch (error) {
      console.error("Failed to load folders and files:", error);
      return [];
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const data = await loadFoldersAndFiles();
      setFileData(data);
      setFolderCount(
        data.filter((node) => node.type === "folder").length.toString(),
      );
    };

    initializeData();
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

  const handleAction = async (action: string) => {
    if (!menuTarget) return;

    switch (action) {
      case "Rename":
        try {
          if (menuTarget?.type === "folder" && menuTarget.folderID) {
            setFolderToRename(menuTarget); // Set the folder to rename
            setRenameFolderName(menuTarget.label || ""); // Pre-fill the current folder name
            setIsRenameModalOpen(true); // Open the rename dialog
          }
        } catch (error) {
          console.error("Failed to open rename dialog:", error);
          showSnackbar("Failed to open rename dialog.", "danger");
        }
        break;
      case "CreateSubfolder":
        // Set the context for subfolder creation
        setCurrentFolderID(menuTarget.folderID ?? null);
        setIsSubfolderMode(true);
        setIsCreateFolderModalOpen(true);
        break;
      case "UploadFile":
        // Pass the current folder's ID when opening the upload dialog
        setCurrentFolderID(menuTarget.folderID ?? null);
        setUploadDialogOpen(true);
        break;
      case "View":
        if (menuTarget.type === "file" && menuTarget.fileId) {
          router.push(`/dashboard/folders/file/${menuTarget.fileId}`);
        }
        break;
      case "Delete":
        try {
          if (menuTarget.type === "folder" && menuTarget.folderID) {
            await deleteFolder(menuTarget.folderID);
            setFileData((prev) =>
              prev.filter((item) => item.id !== menuTarget.id),
            );
            showSnackbar("Folder deleted successfully", "success");
          } else if (menuTarget.type === "file" && menuTarget.fileId) {
            await deleteFile(menuTarget.fileId);
            setFileData((prev) =>
              prev.filter((item) => item.id !== menuTarget.id),
            );
            showSnackbar("File deleted successfully", "success");
          }
        } catch (error) {
          console.error("Action failed:", error);
          const actionName = action.toLowerCase();
          showSnackbar(`Failed to ${actionName} ${menuTarget.type}`, "danger");
        }
        break;
    }
    handleCloseMenu();
  };

  const handleRename = async () => {
    try {
      if (folderToRename && renameFolderName.trim()) {
        const folderId = folderToRename.folderID; // Extract folder ID
        if (folderId) {
          await editFolder(folderId, renameFolderName.trim()); // Pass the folder ID
          setIsRenameModalOpen(false);
          setRenameFolderName("");
          setFolderToRename(null);
          showSnackbar("Folder renamed successfully.", "success");
        } else {
          throw new Error("Folder ID is missing");
        }
      }
    } catch (error) {
      console.error("Failed to rename folder:", error);
      showSnackbar("Failed to rename folder.", "danger");
    }
  };

  const showSnackbar = (message: string, color: ColorPaletteProp) => {
    setSnackbar({ open: true, message, color });
  };

  const handleCreateFolder = async () => {
    try {
      const parentFolderID = currentPath[currentPath.length - 1]?.folderID || 0;

      const newFolder: Omit<DirectoryData, "id"> = {
        name: newFolderName,
        folderID: parentFolderID,
      };

      const createdFolder = await createFolders(newFolder);

      if (createdFolder?.data?.id && createdFolder?.data?.name) {
        const newFolderNode: FileNode = {
          id: createdFolder.data.id.toString(),
          label: createdFolder.data.name,
          type: "folder",
          folderID: createdFolder.data.id,
          parentFolderID: parentFolderID,
        };

        setFileData((prev) => [...prev, newFolderNode]);

        // Ensure the parent folder is expanded
        setExpanded((prev) => ({
          ...prev,
          [parentFolderID.toString()]: true,
        }));

        showSnackbar("Folder created successfully", "success");
      }

      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
      showSnackbar("Failed to create folder", "danger");
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
        // Reload all folders and files to ensure correct hierarchy
        const updatedData = await loadFoldersAndFiles();
        setFileData(updatedData);
        setFolderCount(
          updatedData
            .filter((node) => node.type === "folder")
            .length.toString(),
        );

        // Ensure the parent folder is expanded
        setExpanded((prev) => ({
          ...prev,
          [currentFolderID.toString()]: true,
        }));

        showSnackbar("Subfolder created successfully", "success");
      }

      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
      setMenuTarget(null);
    } catch (error) {
      console.error("Failed to create subfolder:", error);
      showSnackbar("Failed to create subfolder", "danger");
    }
  };

  const handleUpload = async (
    file: File,
    documentType: string,
    metadata: Record<string, any>,
  ) => {
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
        mimeType: file.type,
      };

      // Create form data
      const formData = new FormData();
      formData.append(
        "fileData",
        new Blob([JSON.stringify(fileData)], { type: "application/json" }),
      );
      formData.append("file", file);

      // Make the API call
      const response = await axios.post(
        `/api/v1/files/${currentFolder.folderID}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.status === 200) {
        // Attempt to refresh the entire file list for the current folder
        const filesResponse = await getFilesByFolderID(currentFolder.folderID);
        const newFiles = filesResponse.data || [];

        // Convert the new files to FileNode format
        const newFileNodes = newFiles.map(
          (item: FileData): FileNode => ({
            id: item.id.toString(),
            label: item.name || item.filename || "Unnamed",
            type: "file",
            folderID: currentFolder.folderID,
            fileId: item.id,
            metadata: item,
          }),
        );

        // Update the file data state
        setFileData((prev) => {
          // Remove previous files from this folder and add newly fetched files
          const filteredData = prev.filter(
            (item) =>
              item.type === "folder" ||
              item.folderID !== currentFolder.folderID,
          );
          return [...filteredData, ...newFileNodes];
        });

        // Ensure the current folder is expanded to show new files
        setExpanded((prev) => ({
          ...prev,
          [currentFolder.id]: true,
        }));
        showSnackbar("File uploaded successfully", "success");
      }

      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Failed to upload file:", error);
      showSnackbar("Failed to upload file", "danger");
    }
  };

  const handleSearch = (
    query: string,
    searchType: string,
    metadata: Record<string, unknown>,
  ) => {
    // Implement search logic here
    console.log("Search:", { query, searchType, metadata });
  };

  const navigateToFolder = async (folderId: number) => {
    try {
      // Start with root
      const newPath = [
        { id: "0", label: "Root", type: "folder" as const, folderID: 0 },
      ];

      if (folderId !== 0) {
        // Get all folders to build the path
        const foldersResponse = await getFolders();
        const folders = Array.isArray(foldersResponse)
          ? foldersResponse
          : foldersResponse.data || [];

        // Find the target folder and its ancestors
        const buildFolderPath = (folders: any[], targetId: number): any[] => {
          const folder = folders.find((f) => f.folderID === targetId);
          if (!folder) return [];

          const path = [];
          if (folder.parentFolderID) {
            path.push(...buildFolderPath(folders, folder.parentFolderID));
          }
          path.push({
            id: folder.folderID.toString(),
            label: folder.name,
            type: "folder" as const,
            folderID: folder.folderID,
            parentFolderID: folder.parentFolderID,
          });
          return path;
        };

        // Build path from root to target folder
        const folderPath = buildFolderPath(folders, folderId);
        newPath.push(...folderPath);
      }

      // Update current path
      setCurrentPath(newPath);

      // Fetch and display children of the target folder
      const childFolders = fileData.filter(
        (node) => node.parentFolderID === folderId,
      );

      // Expand the target folder
      setExpanded((prev) => ({
        ...prev,
        [folderId.toString()]: true,
      }));

      return childFolders;
    } catch (error) {
      console.error("Error navigating to folder:", error);
      return [];
    }
  };

  const handleNodeClick = async (node: FileNode) => {
    if (node.type === "folder") {
      const folderId = node.folderID ?? 0;
      await navigateToFolder(folderId);
    } else if (node.type === "file") {
      router.push(`/dashboard/folders/file/${node.fileId}`);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    const targetCrumb = currentPath[index];
    if (!targetCrumb) return;

    // If clicking root or any folder, navigate to that folder
    await navigateToFolder(targetCrumb.folderID ?? 0);
  };

  // Modify the renderTree function to only show children of current folder
  const renderTree = (nodes: FileNode[]) => {
    const currentFolderId = currentPath[currentPath.length - 1]?.folderID ?? 0;

    // Filter nodes to only show direct children of current folder
    const visibleNodes = nodes.filter(
      (node) => node.parentFolderID === currentFolderId,
    );

    const renderNode = (node: FileNode) => {
      const isFolder = node.type === "folder";
      const isOpen = expanded[node.id] || false;

      // Get direct children for folders
      const children = isFolder
        ? nodes.filter((child) => child.parentFolderID === node.folderID)
        : [];

      return (
        <ListItem key={node.id} nested={isFolder} sx={{ my: 0.5 }}>
          <ListItemButton
            onClick={() => handleNodeClick(node)}
            onContextMenu={(e) => handleRightClick(e, node)}
            sx={{
              display: "flex",
              alignItems: "center",
              padding: "8px",
              "&:hover": { backgroundColor: "action.hover" },
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((prev) => ({
                      ...prev,
                      [node.id]: !prev[node.id],
                    }));
                  }}
                >
                  {isOpen ? <ChevronDown /> : <ChevronRight />}
                </IconButton>
              )}
              <span className="mr-2">{isFolder ? <Folder /> : <File />}</span>
            </span>
            <Typography>{node.label}</Typography>
          </ListItemButton>

          {isFolder && isOpen && children.length > 0 && (
            <List>{children.map((child) => renderNode(child))}</List>
          )}
        </ListItem>
      );
    };

    return <List>{visibleNodes.map((node) => renderNode(node))}</List>;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Card
        variant="outlined"
        sx={{
          height: "calc(100vh - 2rem)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Breadcrumbs
            size="lg"
            sx={{
              "--Breadcrumbs-gap": "8px",
              "--Icon-fontSize": "var(--joy-fontSize-xl2)",
            }}
          >
            {currentPath.map((crumb, index) => (
              <Typography
                key={crumb.id}
                fontSize="inherit"
                color={index === currentPath.length - 1 ? "primary" : "neutral"}
                onClick={() => handleBreadcrumbClick(index)}
                sx={{
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {crumb.label}
              </Typography>
            ))}
          </Breadcrumbs>

          <div style={{ display: "flex", gap: "16px" }}>
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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

          <Card variant="outlined" sx={{ flexGrow: 1, overflow: "auto" }}>
            <CardContent>{renderTree(fileData)}</CardContent>
          </Card>

          <Menu
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleCloseMenu}
            size="sm"
            placement="bottom-start"
          >
            {menuTarget && menuTarget.type === "folder" ? (
              <>
                <MenuItem onClick={() => handleAction("CreateSubfolder")}>
                  Create Subfolder
                </MenuItem>
                <MenuItem onClick={() => handleAction("UploadFile")}>
                  Upload File
                </MenuItem>
                <MenuItem onClick={() => handleAction("Rename")}>Edit</MenuItem>
                <MenuItem onClick={() => handleAction("Delete")}>
                  Delete
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem onClick={() => handleAction("View")}>View</MenuItem>
                <MenuItem onClick={() => handleAction("Download")}>
                  Download
                </MenuItem>
                <MenuItem onClick={() => handleAction("Delete")}>
                  Delete
                </MenuItem>
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
              setNewFolderName("");
              setIsSubfolderMode(false);
              setMenuTarget(null);
            }}
            slotProps={{
              backdrop: {
                ref: undefined,
              },
            }}
          >
            <Card sx={{ maxWidth: 400, margin: "auto", mt: 8 }}>
              <CardContent>
                <Typography level="h4">
                  {isSubfolderMode
                    ? `Create Subfolder in ${menuTarget?.label || "Current Folder"}`
                    : "Create New Folder"}
                </Typography>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder Name"
                  sx={{ mt: 2, mb: 2 }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <Button
                    onClick={() => {
                      setIsCreateFolderModalOpen(false);
                      setNewFolderName("");
                      setIsSubfolderMode(false);
                      setMenuTarget(null);
                    }}
                    variant="outlined"
                    color="neutral"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      isSubfolderMode
                        ? handleCreateSubFolder
                        : handleCreateFolder
                    }
                    disabled={!newFolderName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Modal>

          {isRenameModalOpen && folderToRename && (
            <Modal
              open={isRenameModalOpen}
              onClose={() => {
                setIsRenameModalOpen(false);
                setRenameFolderName("");
                setFolderToRename(null);
              }}
            >
              <Card
                sx={{
                  maxWidth: 400,
                  margin: "auto",
                  mt: 8,
                  padding: 3,
                  borderRadius: "12px",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Typography level="h4" sx={{ fontWeight: "bold", mb: 2 }}>
                  Rename Folder
                </Typography>
                <Input
                  value={renameFolderName}
                  onChange={(e) => setRenameFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  sx={{
                    mb: 3,
                    border: "1px solid rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                    padding: "10px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                  }}
                >
                  <Button
                    onClick={() => {
                      setIsRenameModalOpen(false);
                      setRenameFolderName("");
                      setFolderToRename(null);
                    }}
                    variant="outlined"
                    color="neutral"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRename}
                    disabled={!renameFolderName.trim()}
                    color="primary"
                  >
                    Rename
                  </Button>
                </div>
              </Card>
            </Modal>
          )}
        </CardContent>
      </Card>
      <Snackbar
        variant="soft"
        color={snackbar.color}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {snackbar.message}
      </Snackbar>
    </div>
  );
}
