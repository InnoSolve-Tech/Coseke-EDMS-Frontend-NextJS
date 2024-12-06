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
    Input
  } from "@mui/joy";
  import { useRouter } from "next/navigation";
  import FileUploadDialog from "@/components/folder/FileUploadDialog";
  import SearchBar from "@/components/folder/SearchBar";
  import { getFiles, getFolders, addDocumentsByFolderId, createFolders, deleteFile, deleteFolder, DirectoryData, createSubFolders, fetchChildFolders } from "@/components/files/api";
  import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';

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
    [key: string]: unknown;
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
    const [fileCount, setFileCount] = useState<string>("...");
    const [currentFolderID, setCurrentFolderID] = useState<number | null>(null);
    const [isSubfolderMode, setIsSubfolderMode] = useState(false);
    const [folderStructure, setFolderStructure] = useState<FileNode[]>([]);


    useEffect(() => {
      const loadInitialData = async () => {
        try {
          const foldersResponse = await getFolders();
          const folders = Array.isArray(foldersResponse)
            ? foldersResponse
            : foldersResponse.data || [];
  
          const convertToFolderNode = (item: DirectoryData): FileNode => ({
            id: item.folderID?.toString() || "",
            label: item.name,
            type: 'folder',
            folderID: item.folderID,
            parentFolderID: item.parentFolderID,
          });
  
          const folderNodes = folders.map(convertToFolderNode);
          setFolderStructure(folderNodes);
          setFileData(folderNodes);
        } catch (error) {
          console.error("Failed to load folders:", error);
        }
      };
  
      loadInitialData();
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


    const handleNodeClick = async (node: FileNode) => {
      if (node.type === "folder") {
        setCurrentPath((prev) => [...prev, node]);
        
        // Ensure folderID is either a number or null
        setCurrentFolderID(node.folderID ?? null);
    
        // Fetch child folders
        try {
          if (node.folderID) {
            const childFoldersResponse = await fetchChildFolders(node.folderID);
            
            // Convert child folders to FileNode format
            const childFolderNodes = childFoldersResponse.data.map((item): FileNode => ({
              id: item.id?.toString() || "",
              label: item.name,
              type: 'folder',
              folderID: item.folderID,
              parentFolderID: item.parentFolderID,
            }));
    
            // Update fileData to maintain the entire folder structure
            setFileData((prev) => {
              // Remove any existing children of this node
              const filteredData = prev.filter(
                item => item.parentFolderID !== node.folderID
              );
              
              // Add the new children
              return [...filteredData, ...childFolderNodes];
            });
    
            // Expand the clicked folder
            setExpanded((prev) => ({ ...prev, [node.id]: true }));
          }
        } catch (error) {
          console.error("Failed to fetch child folders:", error);
        }
      }
    };

    const handleBreadcrumbClick = (index: number) => {
      setCurrentPath((prev) => prev.slice(0, index + 1));
    };

    const handleAction = async (action: string) => {
      if (!menuTarget) return;
    
      switch (action) {
        case "CreateSubfolder":
          // Set the context for subfolder creation
          setCurrentFolderID(menuTarget.folderID ?? null);
          setIsSubfolderMode(true);
          setIsCreateFolderModalOpen(true);
          break;
        case "View":
          if (menuTarget.type === 'file' && menuTarget.fileId) {
            router.push(`/dashboard/folders/file/${menuTarget.fileId}`);
          }
          break;
        case "Delete":
          try {
            if (menuTarget.type === 'folder' && menuTarget.folderID) {
              await deleteFolder(menuTarget.folderID);
              setFileData((prev) => prev.filter((item) => item.id !== menuTarget.id));
            } else if (menuTarget.type === 'file' && menuTarget.fileId) {
              await deleteFile(menuTarget.fileId);
              setFileData((prev) => prev.filter((item) => item.id !== menuTarget.id));
            }
          } catch (error) {
            console.error('Failed to delete item:', error);
          }
          break;
      }
      handleCloseMenu();
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
    
    
    const handleUpload = async (file: File) => {
      try {
        if (!currentFolderID) {
          throw new Error("No parent folder selected.");
        }
    
        await addDocumentsByFolderId([file], currentFolderID);
    
        const filesResponse = await getFiles();
        const newFiles = filesResponse.data || [];
        const newFileNodes = newFiles.map((item: FileData): FileNode => ({
          id: item.id.toString(),
          label: item.filename || "Unnamed",
          type: "file",
          folderID: item.folderID,
          fileId: item.fileId,
          metadata: item,
        }));
    
        setFileData((prev) => [...prev, ...newFileNodes]);
        setUploadDialogOpen(false);
      } catch (error) {
        console.error("Failed to upload file:", error);
      }
    };
    

    const handleSearch = (query: string, searchType: string, metadata: Record<string, unknown>) => {
      // Implement search logic here
      console.log('Search:', { query, searchType, metadata });
    };

    
    const loadSubfolders = async (folderID: number) => {
      try {
        // Fetch child folders
        const childFoldersResponse = await fetchChildFolders(folderID);
        
        // Convert to FileNode format
        const childFolderNodes = childFoldersResponse.data.map((item): FileNode => ({
          id: item.folderID?.toString() || "",
          label: item.name,
          type: 'folder',
          folderID: item.folderID,
          parentFolderID: item.parentFolderID,
        }));
    
        // Update folder structure to include new subfolders
        setFolderStructure((prevStructure) => {
          return prevStructure.map(folder => 
            folder.folderID === folderID 
              ? { 
                  ...folder, 
                  children: childFolderNodes 
                }
              : folder
          );
        });
    
        // Update fileData to ensure rendering
        setFileData((prevData) => {
          // Remove existing child folders of the current folder
          const filteredData = prevData.filter(
            item => item.parentFolderID !== folderID
          );
          
          // Add new child folders and ensure unique entries
          const updatedData = [
            ...filteredData, 
            ...childFolderNodes.filter(
              newFolder => !prevData.some(existingFolder => existingFolder.id === newFolder.id)
            )
          ];
          return updatedData;
        });
    
        // Ensure the folder is expanded
        setExpanded((prev) => ({ 
          ...prev, 
          [folderID.toString()]: true 
        }));
    
      } catch (error) {
        console.error("Failed to load subfolders:", error);
      }
    };
    
    const renderTree = (nodes: FileNode[]) => {
      const renderNode = (node: FileNode, level: number = 0) => {
        const isFolder = node.type === 'folder';
        const isOpen = expanded[node.id] || false;
        const childFolders = nodes.filter(
          child => child.parentFolderID === node.folderID
        );

        return (
          <ListItem 
            key={node.id}
            nested={isFolder} 
            sx={{ 
              my: 0.5,
              ml: level * 2 // Indent based on nesting level
            }}
          >
            <div>
              <ListItemButton
                onClick={() => isFolder && handleNodeClick(node)}
                onContextMenu={(e) => handleRightClick(e, node)}
              >
                <span className="mr-2">
                  {isFolder && (
                    <IconButton
                      size="sm"
                      variant="plain"
                      color="neutral"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(node.id);
                      }}
                    >
                      {isOpen ? <ChevronDown /> : <ChevronRight />}
                    </IconButton>
                  )}
                </span>
                <span className="mr-2">
                  <Folder />
                </span>
                <Typography>{node.label}</Typography>
              </ListItemButton>

              {/* Nested folders */}
              {isOpen && childFolders.length > 0 && (
                <List>
                  {childFolders.map(childFolder => renderNode(childFolder, level + 1))}
                </List>
              )}
            </div>
          </ListItem>
        );
      };

      // Start with root-level folders
      const rootFolders = nodes.filter(
        node => node.parentFolderID === 0 || node.parentFolderID === undefined
      );

      return (
        <List>
          {rootFolders.map(node => renderNode(node))}
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
                  onClick={() => setUploadDialogOpen(true)}
                  startDecorator={<FileUpload />}
                  sx={{ mr: 1 }}
                >
                  Upload File
                </Button>
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