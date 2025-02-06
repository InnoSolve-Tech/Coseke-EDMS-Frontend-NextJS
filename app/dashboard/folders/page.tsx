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
  List,
  ListItem,
  ListItemButton,
  Button,
  Checkbox,
  FormControl,
  Modal,
  Input,
  Snackbar,
  ListItemDecorator,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import FileUploadDialog from "@/components/folder/FileUploadDialog";
import SearchBar from "@/components/folder/SearchBar";
import {
  getFiles,
  getFolders,
  createFolders,
  deleteFile,
  deleteFolder,
  DirectoryData,
  createSubFolders,
  getDocumentTypes,
  editFolder,
  getAllFiles,
} from "@/components/files/api";
import { File, Folder } from "lucide-react";
import { ColorPaletteProp } from "@mui/joy/styles";
import { AxiosInstance } from "@/components/routes/api";
import { addDocument } from "@/components/files/api";

interface SearchMatchInfo {
  label: boolean;
  metadata: boolean;
}

interface FileNode {
  [x: string]: any;
  id: string;
  label: string;
  type: "file" | "folder";
  metadata?: {
    mimeType?: string;
    uploadStatus?: string;
    [key: string]: any;
  };
  children?: FileNode[];
  folderID?: number;
  fileId?: number;
  parentFolderID?: number;
  searchMatches?: SearchMatchInfo;
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

interface SearchResult {
  path: string[];
  item: FileNode;
  matchType: "name" | "content" | "metadata";
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
  const [filteredData, setFilteredData] = useState<FileNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      console.log("Loading folders and files...");
      const foldersResponse = await getFolders();
      console.log("Folders Response:", foldersResponse);

      const folders = Array.isArray(foldersResponse)
        ? foldersResponse
        : foldersResponse.data || [];

      console.log("Parsed Folders:", folders);

      const folderMap = new Map();
      const rootNodes: FileNode[] = [];

      for (const folder of folders) {
        const fileNodes: FileNode[] = (folder.files || []).map(
          (file: FileData) => ({
            id: file.id.toString(),
            label: file.filename || file.documentName || "Unnamed File",
            type: "file",
            lastModifiedDateTime: folder.lastModifiedDateTime, // Assign from folder data
            folderID: folder.folderID,
            fileId: file.id,
            parentFolderID: folder.folderID,
            metadata: file,
          }),
        );

        const folderNode: FileNode = {
          id: folder.folderID?.toString() || "",
          label: folder.name,
          type: "folder",
          folderID: folder.folderID,
          parentFolderID: folder.parentFolderID || 0,
          children: fileNodes,
        };

        folderMap.set(folder.folderID, folderNode);
      }

      for (const folder of folders) {
        const folderNode = folderMap.get(folder.folderID);
        if (folder.parentFolderID && folderMap.has(folder.parentFolderID)) {
          const parentNode = folderMap.get(folder.parentFolderID);
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(folderNode);
        } else {
          rootNodes.push(folderNode);
        }
      }

      const sortChildren = (node: FileNode) => {
        if (node.children) {
          node.children.sort((a, b) => {
            if (a.type === b.type) {
              return a.label.localeCompare(b.label);
            }
            return a.type === "folder" ? -1 : 1;
          });
          node.children.forEach(sortChildren);
        }
      };

      rootNodes.forEach(sortChildren);

      console.log("Final Root Nodes:", rootNodes);
      return rootNodes;
    } catch (error) {
      console.error("Failed to load folders and files:", error);
      return [];
    }
  };

  const findFolderById = (
    nodes: FileNode[],
    folderId: number,
  ): FileNode | null => {
    for (const node of nodes) {
      if (node.type === "folder" && node.folderID === folderId) {
        return node;
      }
      if (node.children) {
        const found = findFolderById(node.children, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  const refreshCurrentFolder = async () => {
    try {
      const data = await loadFoldersAndFiles();
      setFileData(data);

      const countFolders = (nodes: FileNode[]): number => {
        return nodes.reduce((count, node) => {
          if (node.type === "folder") {
            return count + 1 + countFolders(node.children || []);
          }
          return count;
        }, 0);
      };

      const countFiles = (nodes: FileNode[]): number => {
        return nodes.reduce((count, node) => {
          if (node.type === "file") {
            return count + 1;
          }
          if (node.type === "folder") {
            return count + countFiles(node.children || []);
          }
          return count;
        }, 0);
      };

      setFolderCount(countFolders(data).toString());
      setFileCount(countFiles(data).toString());
    } catch (error) {
      console.error("Failed to refresh folder:", error);
      showSnackbar("Failed to refresh folder contents", "danger");
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
        const filesResponse = await getAllFiles(); // Fetch all files
        const files = filesResponse || [];
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
            setFolderToRename(menuTarget);
            setRenameFolderName(menuTarget.label || "");
            setIsRenameModalOpen(true);
          }
        } catch (error) {
          console.error("Failed to open rename dialog:", error);
          showSnackbar("Failed to open rename dialog.", "danger");
        }
        break;
      case "CreateSubfolder":
        setCurrentFolderID(menuTarget.folderID ?? null);
        setIsSubfolderMode(true);
        setIsCreateFolderModalOpen(true);
        break;
      case "UploadFile":
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
            await refreshCurrentFolder();
            showSnackbar("Folder deleted successfully", "success");
          } else if (menuTarget.type === "file" && menuTarget.fileId) {
            await deleteFile(menuTarget.fileId);
            await refreshCurrentFolder();
            showSnackbar("File deleted successfully", "success");
          }
        } catch (error) {
          console.error("Action failed:", error);
          showSnackbar(`Failed to delete ${menuTarget.type}`, "danger");
        }
        break;
    }
    handleCloseMenu();
  };

  const handleRename = async () => {
    try {
      if (folderToRename && renameFolderName.trim()) {
        const folderId = folderToRename.folderID;
        if (folderId) {
          await editFolder(folderId, renameFolderName.trim());
          await refreshCurrentFolder();
          setIsRenameModalOpen(false);
          setRenameFolderName("");
          setFolderToRename(null);
          showSnackbar("Folder renamed successfully.", "success");
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

      const tempFolder: FileNode = {
        id: `temp-${Date.now()}`,
        label: newFolderName.trim(),
        type: "folder",
        folderID: undefined,
        parentFolderID: parentFolderID,
      };

      setFileData((prev) => [...prev, tempFolder]);

      const newFolder: Omit<DirectoryData, "id"> = {
        name: newFolderName.trim(),
        folderID: parentFolderID,
      };

      const createdFolder = await createFolders(newFolder);

      setFileData((prev) => prev.filter((item) => item.id !== tempFolder.id));

      await refreshCurrentFolder();

      setExpanded((prev) => ({
        ...prev,
        [parentFolderID.toString()]: true,
      }));

      showSnackbar("Folder created successfully", "success");

      // Reset the state
      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
    } catch (error) {
      console.error("Failed to create folder:", error);

      // Remove the temporary folder in case of failure
      setFileData((prev) =>
        prev.filter((item) => item.id !== `temp-${Date.now()}`),
      );

      showSnackbar("Failed to create folder", "danger");

      // Reset the state
      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
    }
  };

  const handleCreateSubFolder = async () => {
    try {
      if (!currentFolderID || typeof currentFolderID !== "number") {
        showSnackbar("No parent folder selected", "danger");
        return;
      }

      const tempId = `temp-${Date.now()}`;
      const tempSubFolder: FileNode = {
        id: tempId,
        label: newFolderName.trim(),
        type: "folder",
        folderID: undefined,
        parentFolderID: currentFolderID,
        children: [],
      };

      // Update file data with temporary folder
      setFileData((prev) =>
        prev.map((item) =>
          item.id === currentFolderID.toString()
            ? { ...item, children: [...(item.children || []), tempSubFolder] }
            : item,
        ),
      );

      const newFolder: DirectoryData = {
        name: newFolderName.trim(),
        parentFolderID: currentFolderID,
      };

      // Create subfolder and handle response
      const response = await createSubFolders(newFolder);

      // Properly type check the response
      if (!response || typeof response !== "object") {
        throw new Error("Invalid response from server");
      }

      // Access folderID from response (matching the console log structure)
      const folderId = response.folderID;
      if (typeof folderId !== "number") {
        throw new Error("Invalid folder ID in response");
      }

      const actualSubFolder: FileNode = {
        id: folderId,
        label: newFolderName.trim(),
        type: "folder",
        folderID: folderId,
        parentFolderID: currentFolderID,
        children: [],
      };

      // Update file data with actual folder, using type assertion for children
      setFileData((prev) =>
        prev.map((item) =>
          item.id === currentFolderID.toString()
            ? {
                ...item,
                children: [
                  ...(item.children || []).filter(
                    (child: FileNode) => child.id !== tempId,
                  ),
                  actualSubFolder,
                ],
              }
            : item,
        ),
      );

      // Expand the parent folder
      setExpanded((prev) => ({
        ...prev,
        [currentFolderID.toString()]: true,
      }));

      showSnackbar("Subfolder created successfully", "success");

      // Reset state
      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
      setMenuTarget(null);
    } catch (error) {
      console.error("Failed to create subfolder:", error);

      // Clean up temporary folder on error, with proper type annotation
      if (currentFolderID) {
        setFileData((prev) =>
          prev.map((item) =>
            item.id === currentFolderID.toString()
              ? {
                  ...item,
                  children: (item.children || []).filter(
                    (child: FileNode) =>
                      child.id !== `temp-${Date.now().toString()}`,
                  ),
                }
              : item,
          ),
        );
      }

      showSnackbar(
        error instanceof Error ? error.message : "Failed to create subfolder",
        "danger",
      );

      // Reset state
      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
      setMenuTarget(null);
    }
  };

  const handleUpload = async (
    file: File,
    documentType: string,
    metadata: Record<string, any>,
  ) => {
    const tempFileId = `temp-${Date.now()}`;
    const folderId = currentFolderID;

    if (folderId === null) {
      showSnackbar("No folder selected", "danger");
      return;
    }

    const isFileUploading = (prevData: any[]) => {
      const folder = prevData.find((node) => node.folderID === folderId);
      return folder?.children?.some(
        (child: { label: string; metadata: { uploadStatus: string } }) =>
          child.label === file.name &&
          child.metadata?.uploadStatus === "uploading",
      );
    };

    setFileData((prevData) => {
      if (isFileUploading(prevData)) {
        return prevData;
      }

      const newData = [...prevData];
      const folder = newData.find((node) => node.folderID === folderId);
      if (folder) {
        const tempFile: FileNode = {
          id: tempFileId,
          label: file.name,
          type: "file",
          folderID: folderId,
          metadata: { uploadStatus: "uploading", ...metadata },
        };

        folder.children = [
          ...(folder.children?.filter(
            (child) =>
              !(
                child.label === file.name &&
                child.metadata?.uploadStatus === "uploading"
              ),
          ) || []),
          tempFile,
        ];
      }
      return newData;
    });

    try {
      const data = {
        documentType: documentType,
        metadata: metadata,
        mimeType: file.type,
        fileName: file.name,
      };

      // Upload the document
      await addDocument(file, data, folderId);

      // Refresh the folder data to get the latest state including the new file
      await refreshCurrentFolder();

      // Remove the temporary upload status
      setFileData((prevData) =>
        prevData.map((node) => {
          if (node.folderID === folderId) {
            return {
              ...node,
              children: node.children?.filter(
                (child) => child.id !== tempFileId,
              ),
            };
          }
          return node;
        }),
      );

      showSnackbar("File uploaded successfully", "success");
    } catch (error) {
      console.error("Upload failed:", error);
      setFileData((prevData) =>
        prevData.map((node) => {
          if (node.folderID === folderId) {
            return {
              ...node,
              children: node.children?.filter(
                (child) => child.id !== tempFileId,
              ),
            };
          }
          return node;
        }),
      );
      showSnackbar("Failed to upload file", "danger");
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredData([]); // Reset to full data if query is empty
      return;
    }

    const searchTerm = query.toLowerCase();
    const results: FileNode[] = [];

    // Helper function to recursively search for files and folders
    const searchInNode = (node: FileNode, path: FileNode[] = []): void => {
      const nameMatch = node.label.toLowerCase().includes(searchTerm);
      const metadataMatch = node.metadata
        ? JSON.stringify(node.metadata).toLowerCase().includes(searchTerm)
        : false;

      // If the current node is a file and matches, include it in the results
      if (node.type === "file" && (nameMatch || metadataMatch)) {
        results.push({
          ...node,
          label: `${path.map((p) => p.label).join(" / ")} / ${node.label}`, // Include full path in the label
        });
      }

      // Search children recursively
      if (node.children) {
        node.children.forEach((child) => searchInNode(child, [...path, node]));
      }
    };

    // Process all nodes
    fileData.forEach((node) => searchInNode(node));

    if (results.length === 0) {
      // If no results, show a placeholder message
      setFilteredData([
        {
          id: "no-results",
          label: "No results found",
          type: "file",
          metadata: { message: "Try searching with different keywords" },
        },
      ]);
    } else {
      setFilteredData(results);
    }
  };

  const navigateToFolder = async (folderId: number) => {
    try {
      setCurrentFolderID(folderId);
      setExpanded({});

      const buildPath = (
        nodes: FileNode[],
        targetId: number,
        path: FileNode[] = [],
      ): FileNode[] | null => {
        for (const node of nodes) {
          if (node.folderID === targetId) {
            return [...path, node];
          }
          if (node.children?.length) {
            const result = buildPath(node.children, targetId, [...path, node]);
            if (result) return result;
          }
        }
        return null;
      };

      const rootNode: FileNode = {
        id: "root",
        label: "Root",
        type: "folder",
        folderID: 0,
      };

      if (folderId === 0) {
        setCurrentPath([rootNode]);
      } else {
        const pathToFolder = buildPath(fileData, folderId);
        if (pathToFolder) {
          setCurrentPath([rootNode, ...pathToFolder]);
        }
      }
    } catch (error) {
      console.error("Failed to navigate to folder:", error);
      showSnackbar("Failed to navigate to folder", "danger");
    }
  };

  const handleRightClick = (event: React.MouseEvent, node: FileNode) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget as HTMLElement);
    setMenuTarget(node);
  };

  const handleNodeClick = async (node: FileNode) => {
    if (node.type === "folder" && typeof node.folderID === "number") {
      await navigateToFolder(node.folderID);
    } else if (node.type === "file" && node.fileId) {
      router.push(`/dashboard/folders/file/${node.fileId}`);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    const targetCrumb = currentPath[index];
    if (!targetCrumb) return;

    await navigateToFolder(targetCrumb.folderID ?? 0);
  };

  const getVisibleNodes = (
    nodes: FileNode[],
    currentFolderId: number,
  ): FileNode[] => {
    if (filteredData.length > 0) {
      // If there are search results, return them directly
      return filteredData;
    }

    if (currentFolderId === 0) {
      return nodes.filter(
        (node) => !node.parentFolderID || node.parentFolderID === 0,
      );
    }

    const findCurrentFolder = (nodeList: FileNode[]): FileNode[] => {
      for (const node of nodeList) {
        if (node.folderID === currentFolderId) {
          return node.children || [];
        }
        if (node.children?.length) {
          const result = findCurrentFolder(node.children);
          if (result.length > 0) return result;
        }
      }
      return [];
    };

    return findCurrentFolder(nodes);
  };

  // Utility to convert MIME types to user-friendly formats
  const getReadableType = (mimeType: string | undefined): string => {
    if (!mimeType) return "Unknown";
    const typeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "image/png": "Image (PNG)",
      "image/jpeg": "Image (JPEG)",
      "text/plain": "Text File",
      "application/msword": "Word Document",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "Word Document",
      "application/vnd.ms-excel": "Excel Spreadsheet",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "Excel Spreadsheet",
      // Add other MIME types as needed
    };
    return typeMap[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "File";
  };

  // Utility to format dates into a readable format
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderTree = (nodes: FileNode[]) => {
    const dataToRender = filteredData.length > 0 ? filteredData : nodes;
    const visibleNodes = getVisibleNodes(dataToRender, currentFolderID || 0);

    const renderNode = (node: FileNode, index: number) => {
      const isFolder = node.type === "folder";
      const isUploading = node.metadata?.uploadStatus === "uploading";
      const nodeKey = `${node.type}-${node.folderID || node.fileId}-${node.id}`; // Unique key

      // Format metadata
      const lastModifiedDateTime = isFolder
        ? formatDate(node.lastModifiedDateTime)
        : formatDate(node.metadata?.lastModifiedDateTime);
      const readableType = isFolder
        ? "Folder"
        : getReadableType(node.metadata?.mimeType);

      return (
        <ListItem
          key={nodeKey}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "12px",
            gap: "16px",
            backgroundColor:
              index % 2 === 0 ? "background.level1" : "background.paper",
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <ListItemButton
            onClick={() => handleNodeClick(node)}
            onContextMenu={(e) => handleRightClick(e, node)} // Right-click functionality
            sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              padding: "8px",
              backgroundColor: node.searchMatches?.label
                ? "action.selected"
                : undefined,
              ...(isUploading && {
                backgroundColor: "background.level1",
                opacity: 0.8,
              }),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", flex: 2 }}>
              {isFolder ? <Folder size={16} /> : <File size={16} />}
              <Typography
                sx={{
                  ml: 1,
                  ...(isUploading && {
                    fontStyle: "italic",
                    color: "text.secondary",
                  }),
                  ...(node.searchMatches?.label && {
                    fontWeight: "bold",
                  }),
                }}
              >
                {node.label}
              </Typography>
            </div>
            <Typography
              sx={{ flex: 1, color: "text.secondary", fontSize: "0.875rem" }}
            >
              {readableType}
            </Typography>
            <Typography
              sx={{ flex: 1, color: "text.secondary", fontSize: "0.875rem" }}
            >
              {lastModifiedDateTime || "-"}
            </Typography>
          </ListItemButton>
        </ListItem>
      );
    };

    return (
      <Card
        variant="outlined"
        sx={{
          flexGrow: 1,
          overflow: "auto",
          borderRadius: "8px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent>
          <List sx={{ width: "100%" }}>
            <ListItem
              sx={{
                display: "none",
                sm: { display: "flex" },
                flexDirection: "row",
                padding: "12px",
                fontWeight: "bold",
                backgroundColor: "background.level2",
              }}
            >
              <Typography sx={{ flex: 2, fontSize: "0.875rem" }}>
                Name
              </Typography>
              <Typography sx={{ flex: 1, fontSize: "0.875rem" }}>
                Type
              </Typography>
              <Typography sx={{ flex: 1, fontSize: "0.875rem" }}>
                Last Modified
              </Typography>
            </ListItem>
            {visibleNodes.map((node, index) => renderNode(node, index))}
          </List>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className=" flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <Typography level="h4" sx={{ fontWeight: "bold" }}>
          File Explorer
        </Typography>
        <div className="flex items-center space-x-2">
          <div className="flex gap-1">
            <Card
              variant="outlined"
              sx={{ width: "auto", minWidth: 80, p: 1.5, textAlign: "center" }}
            >
              <Typography level="h3" fontWeight="bold">
                {folderCount}
              </Typography>
              <Typography level="body-xs">Folders</Typography>
            </Card>
            <Card
              variant="outlined"
              sx={{ width: "auto", minWidth: 80, p: 1.5, textAlign: "center" }}
            >
              <Typography level="h3" fontWeight="bold">
                {fileCount}
              </Typography>
              <Typography level="body-xs">Files</Typography>
            </Card>
          </div>
          <Button
            variant="outlined"
            color="neutral"
            startDecorator={<CreateNewFolder />}
            onClick={() => setIsCreateFolderModalOpen(true)}
            size="sm"
          >
            New Folder
          </Button>
          {/* <Button
    variant="outlined"
    color="neutral"
    startDecorator={<FileUpload />}
    onClick={() => setUploadDialogOpen(true)}
    size="sm"
  >
    Upload
  </Button> */}
        </div>
      </div>
      <div className="flex-grow flex overflow-hidden">
        <div className="flex-grow flex flex-col">
          <Breadcrumbs
            size="sm"
            sx={{
              padding: "8px 16px",
              borderBottom: "1px solid",
              borderColor: "divider",
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
          <div className="p-4">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="flex-grow overflow-auto p-4">
            {renderTree(fileData)}
          </div>
        </div>
      </div>
      {/* Keep the existing Modals and Menus here */}
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
                  isSubfolderMode ? handleCreateSubFolder : handleCreateFolder
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
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseMenu}
        size="sm"
        placement="bottom-start"
        sx={{
          mt: 1,
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          borderRadius: "8px",
          overflow: "hidden",
          padding: 0,
          bgcolor: "background.paper",
          transition: "all 0.2s ease-in-out", // Animation for appearance
        }}
      >
        {menuTarget && menuTarget.type === "folder" ? (
          <>
            <MenuItem
              onClick={() => {
                handleAction("CreateSubfolder");
                handleCloseMenu(); // Closes the menu
              }}
              sx={{
                padding: "8px 16px",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              Create Subfolder
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleAction("UploadFile");
                handleCloseMenu(); // Closes the menu
              }}
              sx={{
                padding: "8px 16px",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              Upload File
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleAction("Rename");
                handleCloseMenu(); // Closes the menu
              }}
              sx={{
                padding: "8px 16px",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleAction("Delete");
                handleCloseMenu(); // Closes the menu
              }}
              sx={{
                padding: "8px 16px",
                color: "error.main",
                "&:hover": { bgcolor: "error.light" },
              }}
            >
              Delete
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              onClick={() => {
                handleAction("View");
                handleCloseMenu(); // Closes the menu
              }}
              sx={{
                padding: "8px 16px",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              View
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleAction("Download");
                handleCloseMenu(); // Closes the menu
              }}
              sx={{
                padding: "8px 16px",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              Download
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleAction("Delete");
                handleCloseMenu(); // Closes the menu
              }}
              sx={{
                padding: "8px 16px",
                color: "error.main",
                "&:hover": { bgcolor: "error.light" },
              }}
            >
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
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
