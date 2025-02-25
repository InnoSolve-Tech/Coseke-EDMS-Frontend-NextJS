"use client";
import { FileText, Image, Table, Upload } from "lucide-react";
import type React from "react";
import { useState, useEffect, useRef } from "react";
import { CreateNewFolder } from "@mui/icons-material";
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
  Modal,
  Input,
  Snackbar,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import FileUploadDialog from "@/components/folder/FileUploadDialog";
import SearchBar from "@/components/folder/SearchBar";
import {
  getFolders,
  createFolders,
  deleteFile,
  deleteFolder,
  type DirectoryData,
  createSubFolders,
  getDocumentTypes,
  editFolder,
  getAllFiles,
  bulkUpload,
} from "@/components/files/api";
import { type File, FolderIcon, FileIcon } from "lucide-react";
import type { ColorPaletteProp } from "@mui/joy/styles";
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

interface BulkUploadState {
  files: File[];
  targetFolderId: number | null;
  processing: boolean;
  progress: Record<string, number>;
}

interface FolderOption {
  id: number;
  name: string;
  level: number;
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
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploadState, setBulkUploadState] = useState<BulkUploadState>({
    files: [],
    targetFolderId: null,
    processing: false,
    progress: {},
  });
  const [folderOptions, setFolderOptions] = useState<FolderOption[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editedFolderName, setEditedFolderName] = useState("");

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

  useEffect(() => {
    const buildFolderOptions = (
      nodes: FileNode[],
      level: number = 0,
    ): FolderOption[] => {
      let options: FolderOption[] = [];
      for (const node of nodes) {
        if (node.type === "folder") {
          options.push({
            id: node.folderID || 0,
            name: node.label,
            level: level,
          });
          if (node.children) {
            options = [
              ...options,
              ...buildFolderOptions(node.children, level + 1),
            ];
          }
        }
      }
      return options;
    };

    setFolderOptions(buildFolderOptions(fileData));
  }, [fileData]);

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuTarget(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      setFileData((prev) => {
        const updateChildrenRecursively = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.folderID === currentFolderID) {
              return {
                ...node,
                children: [...(node.children || []), tempSubFolder],
              };
            } else if (node.children) {
              return {
                ...node,
                children: updateChildrenRecursively(node.children),
              };
            }
            return node;
          });
        };

        return updateChildrenRecursively(prev);
      });

      const newFolder: DirectoryData = {
        name: newFolderName.trim(),
        parentFolderID: currentFolderID,
      };

      const response = await createSubFolders(newFolder);
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

      // Update file data with actual folder
      setFileData((prev) => {
        const updateChildrenRecursively = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.folderID === currentFolderID) {
              return {
                ...node,
                children: [
                  ...(node.children || []).filter(
                    (child) => child.id !== tempId,
                  ),
                  actualSubFolder,
                ],
              };
            } else if (node.children) {
              return {
                ...node,
                children: updateChildrenRecursively(node.children),
              };
            }
            return node;
          });
        };

        return updateChildrenRecursively(prev);
      });

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
      showSnackbar(
        error instanceof Error ? error.message : "Failed to create subfolder",
        "danger",
      );
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
    folderId: number,
  ) => {
    const tempFileId = `temp-${Date.now()}`;

    if (!folderId) {
      showSnackbar("No folder selected", "danger");
      return;
    }

    setFileData((prevData) => {
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

      console.log("📤 Uploading file:", file.name);
      console.log("📂 Uploading to folder ID:", folderId);

      // ✅ Ensure folder ID is correctly passed to `addDocument`
      await addDocument(file, data, folderId);

      // ✅ Refresh the folder to show the uploaded file
      await refreshCurrentFolder();

      // ✅ Remove temporary "uploading" status
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
      console.error("❌ Upload failed:", error);
      // ✅ Remove temporary file if upload fails
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
      setFilteredData([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const results: FileNode[] = [];

    const searchInNode = (node: FileNode, path: FileNode[] = []): void => {
      const nameMatch = node.label.toLowerCase().includes(searchTerm);
      const metadataMatch = node.metadata
        ? JSON.stringify(node.metadata).toLowerCase().includes(searchTerm)
        : false;

      // Include both files and folders in search results
      if (nameMatch || metadataMatch) {
        results.push({
          ...node,
          label: `${path.map((p) => p.label).join(" / ")}${path.length ? " / " : ""}${node.label}`,
        });
      }

      // Search children recursively
      if (node.children) {
        node.children.forEach((child) => searchInNode(child, [...path, node]));
      }
    };

    fileData.forEach((node) => searchInNode(node));

    if (results.length === 0) {
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
    if (!mimeType) {
      // Check file extension if MIME type is not available
      const fileExtension = menuTarget?.label?.split(".").pop()?.toLowerCase();
      switch (fileExtension) {
        case "docx":
          return "Word Document";
        case "xlsx":
          return "Excel Spreadsheet";
        case "pdf":
          return "PDF Document";
        case "txt":
          return "Text File";
        case "jpg":
        case "jpeg":
        case "png":
          return `Image (${fileExtension.toUpperCase()})`;
        default:
          return fileExtension
            ? `${fileExtension.toUpperCase()} File`
            : "Unknown";
      }
    }

    // If MIME type is available, use it for more accurate type detection
    const typeMap: Record<string, string> = {
      "application/pdf": "PDF Document",
      "image/png": "Image (PNG)",
      "image/jpeg": "Image (JPEG)",
      "text/plain": "Text File",
      "application/msword": "Word Document",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "Word Document",
      "application/vnd.ms-excel": "Excel Spreadsheet",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "Excel Spreadsheet",
    };

    return (
      typeMap[mimeType] ||
      mimeType.split("/")[1]?.toUpperCase() ||
      "Unknown Type"
    );
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

  const getFileIcon = (mimeType: string | undefined) => {
    if (!mimeType) return <FileIcon size={20} />;

    switch (mimeType.toLowerCase()) {
      case "application/pdf":
        return <FileText size={20} color="#E44D26" />; // Red color for PDF
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return <FileText size={20} color="#2B579A" />; // Blue color for Word
      case "image/jpeg":
      case "image/png":
      case "image/gif":
        return <Image size={20} color="#0078D4" />; // Blue color for images
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return <Table size={20} color="#217346" />; // Green color for Excel
      default:
        return <FileIcon size={20} />;
    }
  };

  useEffect(() => {
    const handleGlobalClick = () => setIsVisible(false);
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleFolderRename = async (folderId: string, newName: string) => {
    try {
      await editFolder(Number(folderId), newName);
      setFileData((prevData) =>
        prevData.map((folder) =>
          folder.id === folderId ? { ...folder, label: newName } : folder,
        ),
      );
      setEditingFolderId(null);
    } catch (error) {
      console.error("Failed to rename folder:", error);
    }
  };

  const renderTree = (nodes: FileNode[]) => {
    const dataToRender = filteredData.length > 0 ? filteredData : nodes;
    const visibleNodes = getVisibleNodes(dataToRender, currentFolderID || 0);

    const renderNode = (node: FileNode, index: number) => {
      const isFolder = node.type === "folder";
      const isUploading = node.metadata?.uploadStatus === "uploading";
      const nodeKey = `${node.type}-${node.folderID || node.fileId}-${node.id}`;

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
            onContextMenu={(e) => handleRightClick(e, node)}
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
              {isFolder ? (
                <FolderIcon
                  size={20}
                  color="#FCD53F"
                  fill="#FCD53F"
                  style={{
                    filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.1))",
                    marginRight: "8px",
                  }}
                />
              ) : (
                <div
                  style={{
                    marginRight: "8px",
                    filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.1))",
                  }}
                >
                  {getFileIcon(node.metadata?.mimeType)}
                </div>
              )}
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

  const handleBulkUploadPrep = async (files: FileList) => {
    const fileArray = Array.from(files);
    setBulkUploadState((prev) => ({
      ...prev,
      files: [...prev.files, ...fileArray],
    }));

    // If there's a ZIP file, show warning
    const hasZip = fileArray.some(
      (file) => file.type === "application/zip" || file.name.endsWith(".zip"),
    );
    if (hasZip) {
      showSnackbar(
        "ZIP files will be extracted during upload",
        "info" as ColorPaletteProp,
      );
    }
  };

  const handleBulkUpload = async () => {
    const { files, targetFolderId } = bulkUploadState;
    if (!targetFolderId || files.length === 0) {
      showSnackbar("Please select a destination folder and files", "warning");
      return;
    }

    setBulkUploadState((prev) => ({ ...prev, processing: true }));

    try {
      const metadataList = files.map((file) => ({
        documentType: "default",
        documentName: file.name,
        mimeType: file.type,
        metadata: {},
      }));

      // Create temporary file objects matching FileNode type
      const tempFiles: FileNode[] = files.map((file) => ({
        id: `temp-${Date.now()}-${file.name}`,
        label: file.name,
        type: "file", // Ensure type matches FileNode
        folderID: targetFolderId,
        metadata: { uploadStatus: "uploading", mimeType: file.type },
        fileId: undefined, // Ensure it exists in type
        parentFolderID: targetFolderId,
      }));

      // Update UI with temporary files
      setFileData((prevData) => {
        return prevData.map((node) =>
          node.folderID === targetFolderId
            ? { ...node, children: [...(node.children || []), ...tempFiles] }
            : node,
        );
      });

      // Perform bulk upload
      await bulkUpload(files, targetFolderId, metadataList, (progress) => {
        setBulkUploadState((prev) => ({
          ...prev,
          progress: { ...prev.progress, overall: progress },
        }));
      });

      // Refresh folder contents to get real uploaded files
      const updatedFolders = await loadFoldersAndFiles();
      setFileData(updatedFolders);

      showSnackbar(`Uploaded ${files.length} files successfully`, "success");
    } catch (error) {
      console.error("Bulk upload failed:", error);
      showSnackbar("Bulk upload failed", "danger");
    } finally {
      setBulkUploadState((prev) => ({
        ...prev,
        processing: false,
        files: [],
        progress: {},
      }));
      setIsBulkUploadDialogOpen(false);
    }
  };

  const removeFileFromBulkUpload = (fileName: string) => {
    setBulkUploadState((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.name !== fileName),
    }));
  };

  return (
    <div className=" flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <Typography level="h4" sx={{ fontWeight: "bold" }}>
          File Explorer
        </Typography>
        <div className="flex justify-center items-center gap-3 p-2">
          {[
            { count: folderCount, label: "Folders" },
            { count: fileCount, label: "Files" },
          ].map((item, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 120,
                height: 70,
                paddingY: 1,
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <Typography level="body-lg" fontWeight="bold">
                {item.count}
              </Typography>
              <Typography
                level="body-sm"
                sx={{ marginTop: 0.5, color: "text.secondary" }}
              >
                {item.label}
              </Typography>
            </Card>
          ))}

          <input type="file" multiple hidden ref={fileInputRef} />

          {/* <Button
            variant="outlined"
            color="neutral"
            onClick={() => {
              setCurrentFolderID(0); // Set upload target to Root
              setUploadDialogOpen(true); // Open file upload dialog
            }}
            size="sm"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 120,
              height: 70,
              borderRadius: "8px",
              fontSize: "0.875rem",
            }}
          >
            Single File Upload
          </Button> */}
        </div>
      </div>
      <div className="flex-grow flex overflow-hidden">
        <div className="flex-grow flex flex-col">
          <div className="flex items-center px-4 py-2 border-b justify-between overflow-x-auto flex-wrap gap-2">
            <Breadcrumbs
              size="sm"
              className="truncate overflow-hidden flex-grow"
            >
              {currentPath.map((crumb, index) => (
                <Typography
                  key={crumb.id}
                  fontSize="inherit"
                  color={
                    index === currentPath.length - 1 ? "primary" : "neutral"
                  }
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
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outlined"
                color="neutral"
                startDecorator={<Upload size={16} />}
                onClick={() => {
                  setBulkUploadState((prev) => ({
                    ...prev,
                    targetFolderId: currentFolderID,
                  }));
                  setIsBulkUploadDialogOpen(true);
                }}
                sx={{
                  fontSize: "0.75rem",
                  py: 0.5,
                  px: 1,
                  "& svg": { strokeWidth: 2.5 },
                }}
              >
                Upload Files
              </Button>
              <Button
                size="sm"
                variant="outlined"
                color="neutral"
                startDecorator={<CreateNewFolder />}
                onClick={() => setIsCreateFolderModalOpen(true)}
                sx={{
                  fontSize: "0.75rem",
                  py: 0.5,
                  px: 1,
                  "& svg": { strokeWidth: 2.5 },
                }}
              >
                New Folder
              </Button>
            </div>
          </div>
          <div className="p-4">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="flex-grow overflow-auto p-4">
            {renderTree(fileData)}
          </div>
        </div>
      </div>
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={(file, docType, metadata, folderID) =>
          handleUpload(
            file,
            docType,
            metadata,
            folderID ?? (currentFolderID as number),
          )
        }
        folderID={currentFolderID as number}
      />

      {isVisible && (
        <Card
          className="absolute bg-white shadow-lg rounded-lg p-2 z-50"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="space-y-1">
            <button
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 rounded transition-colors"
              onClick={() => handleAction("createFolder")}
            >
              <CreateNewFolder className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          </div>
        </Card>
      )}

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
          <Card>
            <CardContent>
              <List>
                {fileData.map((node) => (
                  <ListItem key={node.id}>
                    {editingFolderId === node.id ? (
                      <Input
                        autoFocus
                        value={editedFolderName}
                        onChange={(e) => setEditedFolderName(e.target.value)}
                        onBlur={() =>
                          handleFolderRename(node.id, editedFolderName)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleFolderRename(node.id, editedFolderName);
                          }
                        }}
                      />
                    ) : (
                      <ListItemButton
                        onDoubleClick={() => {
                          setEditingFolderId(node.id);
                          setEditedFolderName(node.label);
                        }}
                      >
                        {node.label}
                      </ListItemButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Modal>
      )}
      <Menu
        ref={menuRef}
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
          transition: "all 0.2s ease-in-out",
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
      <Modal
        open={isBulkUploadDialogOpen}
        onClose={() => {
          setIsBulkUploadDialogOpen(false);
          setBulkUploadState({
            files: [],
            targetFolderId: null,
            processing: false,
            progress: {},
          });
        }}
        sx={{
          display: "flex",
          alignItems: "flex-start", // Changed from center to flex-start
          justifyContent: "center",
          paddingTop: "40px", // Add some top padding
          overflow: "auto", // Make modal scrollable
        }}
      >
        <Card
          sx={{
            maxWidth: 800,
            width: "90%",
            margin: "0 auto", // Changed from "auto" to "0 auto"
            padding: 3,
            borderRadius: "12px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            maxHeight: "90vh", // Limit height to 90% of viewport
            overflow: "auto", // Make card content scrollable
          }}
        >
          <Typography level="h4" sx={{ mb: 2 }}>
            Bulk Upload Files
          </Typography>

          <div style={{ marginBottom: "20px" }}>
            <Typography level="body-sm" sx={{ mb: 1 }}>
              Select Destination Folder
            </Typography>
            <select
              value={bulkUploadState.targetFolderId || ""}
              onChange={(e) =>
                setBulkUploadState((prev) => ({
                  ...prev,
                  targetFolderId: Number(e.target.value),
                }))
              }
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
                backgroundColor: "#ffffff",
                color: "#333333",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "border-color 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = "#bdbdbd")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor = "#e0e0e0")
              }
            >
              <option value="">Select a folder</option>
              <option value="0">Root</option>
              {folderOptions.map((folder) => (
                <option
                  key={folder.id}
                  value={folder.id}
                  style={{
                    paddingLeft: `${folder.level * 20}px`, // Indent based on level
                    backgroundColor:
                      folder.level % 2 === 0 ? "#ffffff" : "#fafafa", // Alternate background
                  }}
                >
                  {"  ".repeat(folder.level)}└─ {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                handleBulkUploadPrep(files);
              }
            }}
            style={{
              border: "2px dashed #ccc",
              borderRadius: "8px",
              padding: "40px",
              textAlign: "center",
              marginBottom: "20px",
              cursor: "pointer",
              backgroundColor:
                bulkUploadState.files.length > 0 ? "#f5f5f5" : "white",
            }}
          >
            <input
              type="file"
              multiple
              accept=".zip,image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleBulkUploadPrep(e.target.files);
                }
              }}
              style={{ display: "none" }}
              id="bulk-file-input"
            />
            <label htmlFor="bulk-file-input" style={{ cursor: "pointer" }}>
              <Typography level="body-lg" sx={{ mb: 1 }}>
                Drag and drop files here or click to select
              </Typography>
              <Typography level="body-sm" color="neutral">
                Supported files: Images, PDFs, Office documents, ZIP archives
              </Typography>
            </label>
          </div>

          {bulkUploadState.files.length > 0 && (
            <div
              style={{
                marginBottom: "20px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              <Typography level="body-sm" sx={{ mb: 1 }}>
                Selected Files ({bulkUploadState.files.length})
              </Typography>
              <List>
                {bulkUploadState.files.map((file, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      backgroundColor:
                        index % 2 === 0
                          ? "background.level1"
                          : "background.paper",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {file.type === "application/zip" ||
                      file.name.endsWith(".zip") ? (
                        <FileText size={20} />
                      ) : (
                        getFileIcon(file.type)
                      )}
                      <Typography level="body-sm">{file.name}</Typography>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="plain"
                      onClick={() => removeFileFromBulkUpload(file.name)}
                    >
                      Remove
                    </Button>
                  </ListItem>
                ))}
              </List>
            </div>
          )}

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => {
                setIsBulkUploadDialogOpen(false);
                setBulkUploadState({
                  files: [],
                  targetFolderId: null,
                  processing: false,
                  progress: {},
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={
                bulkUploadState.processing ||
                bulkUploadState.files.length === 0 ||
                !bulkUploadState.targetFolderId
              }
              loading={bulkUploadState.processing}
            >
              Upload{" "}
              {bulkUploadState.files.length > 0
                ? `(${bulkUploadState.files.length} files)`
                : ""}
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  );
}
