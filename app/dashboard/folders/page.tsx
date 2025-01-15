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
  createFolders,
  deleteFile,
  deleteFolder,
  DirectoryData,
  createSubFolders,
  getDocumentTypes,
  editFolder,
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
  id: string;
  label: string;
  type: "file" | "folder";
  metadata?: Record<string, unknown>;
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

      const tempSubFolder: FileNode = {
        id: `temp-${Date.now().toString()}`,
        label: newFolderName.trim(),
        type: "folder",
        folderID: undefined,
        parentFolderID: currentFolderID,
        children: [],
      };

      setFileData((prev) => {
        return prev.map((item) => {
          if (item.id === currentFolderID.toString()) {
            return {
              ...item,
              children: [...(item.children || []), tempSubFolder],
            };
          }
          return item;
        });
      });

      const newFolder: DirectoryData = {
        name: newFolderName.trim(),
        parentFolderID: currentFolderID,
      };

      const createdFolder = await createSubFolders(newFolder);

      const actualSubFolder: FileNode = {
        id: createdFolder.id.toString(),
        label: createdFolder.name,
        type: "folder",
        folderID: createdFolder.id,
        parentFolderID: currentFolderID,
        children: [],
      };

      setFileData((prev) => {
        return prev.map((item) => {
          if (item.id === currentFolderID.toString()) {
            return {
              ...item,
              children: [
                ...(item.children || []).filter(
                  (child) => child.id !== tempSubFolder.id,
                ),
                actualSubFolder,
              ],
            };
          }
          return item;
        });
      });

      setExpanded((prev) => ({
        ...prev,
        [currentFolderID.toString()]: true,
      }));

      showSnackbar("Subfolder created successfully", "success");

      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
      setIsSubfolderMode(false);
      setMenuTarget(null);
    } catch (error) {
      console.error("Failed to create subfolder:", error);

      if (currentFolderID) {
        setFileData((prev) => {
          return prev.map((item) => {
            if (item.id === currentFolderID.toString()) {
              return {
                ...item,
                children: (item.children || []).filter(
                  (child) => child.id !== `temp-${Date.now().toString()}`,
                ),
              };
            }
            return item;
          });
        });
      }

      showSnackbar("Subfolder created successfully", "success");

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

      await addDocument(file, data, folderId);

      setFileData((prevData) =>
        prevData.map((node) => {
          if (node.folderID === folderId) {
            return {
              ...node,
              children: node.children?.map((child) =>
                child.id === tempFileId
                  ? {
                      ...child,
                      id: `${Date.now()}`,
                      metadata: { ...child.metadata, uploadStatus: "complete" },
                    }
                  : child,
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
      setFilteredData(fileData);
      return;
    }

    const lowerQuery = query.toLowerCase();

    const searchRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce<FileNode[]>((acc, node) => {
        const matchesName = node.label.toLowerCase().includes(lowerQuery);

        const searchMetadata = (obj: any): boolean => {
          if (!obj) return false;
          return Object.entries(obj).some(([_, value]) => {
            if (typeof value === "object") return searchMetadata(value);
            return value?.toString().toLowerCase().includes(lowerQuery);
          });
        };

        const matchesMetadata =
          node.type === "file" && node.metadata
            ? searchMetadata(node.metadata)
            : false;

        const filteredChildren = node.children
          ? searchRecursive(node.children)
          : [];

        if (matchesName || matchesMetadata || filteredChildren.length > 0) {
          const searchNode: FileNode = {
            ...node,
            children: filteredChildren,
            searchMatches: {
              label: matchesName,
              metadata: matchesMetadata,
            },
          };
          acc.push(searchNode);
        }

        return acc;
      }, []);
    };

    const filtered = searchRecursive(fileData);
    console.log("Search results:", filtered);
    setFilteredData(filtered);
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

  const renderTree = (nodes: FileNode[]) => {
    const dataToRender = filteredData.length > 0 ? filteredData : nodes;
    const visibleNodes = getVisibleNodes(nodes, currentFolderID || 0);

    const renderNode = (node: FileNode) => {
      const isFolder = node.type === "folder";
      const isUploading = node.metadata?.uploadStatus === "uploading";
      const nodeKey = `${node.type}-${node.folderID || node.fileId}-${node.id}`; // Create unique key
      const matchesSearch = node.searchMatches?.label;

      return (
        <ListItem
          key={nodeKey}
          sx={{
            display: "flex",
            flexDirection: "column",
            padding: 0,
          }}
        >
          <ListItemButton
            onClick={() => handleNodeClick(node)}
            onContextMenu={(e) => handleRightClick(e, node)}
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "8px",
              backgroundColor: matchesSearch ? "action.selected" : undefined,
              "&:hover": { backgroundColor: "action.hover" },
              ...(isUploading && {
                backgroundColor: "background.level1",
                opacity: 0.8,
              }),
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {isFolder ? <Folder size={16} /> : <File size={16} />}
              <Typography
                sx={{
                  ml: 1,
                  ...(isUploading && {
                    fontStyle: "italic",
                    color: "text.secondary",
                  }),
                  ...(matchesSearch && {
                    fontWeight: "bold",
                  }),
                }}
              >
                {node.label}
              </Typography>
            </div>
          </ListItemButton>
        </ListItem>
      );
    };

    return (
      <List sx={{ width: "100%" }}>
        {visibleNodes.map((node) => renderNode(node))}
      </List>
    );
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
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
          }}
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
            <Card
              variant="outlined"
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                height: "100%",
                padding: "8px",
              }}
            >
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
