"use client";

import { getFolders } from "@/components/files/api";
import { FileData, FileNode } from "@/types/file";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useFileExplorer() {
  const [currentPath, setCurrentPath] = useState<FileNode[]>([
    { id: "0", label: "Root", type: "folder", folderID: 0 },
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [fileData, setFileData] = useState<FileNode[]>([]);
  const [folderCount, setFolderCount] = useState<string>("...");
  const [fileCount, setFileCount] = useState<string>("...");
  const router = useRouter();

  const loadFoldersAndFiles = async () => {
    try {
      const foldersResponse = await getFolders();
      const folders = Array.isArray(foldersResponse)
        ? foldersResponse
        : foldersResponse.data || [];

      const folderNodesWithFiles: FileNode[] = [];

      for (const folder of folders) {
        const folderNode: FileNode = {
          id: folder.folderID?.toString() || "",
          label: folder.name,
          type: "folder",
          folderID: folder.folderID,
          parentFolderID: folder.parentFolderID || 0,
        };

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

  const handleNodeClick = (node: FileNode) => {
    if (node.type === "folder") {
      const buildPath = (targetNode: FileNode): FileNode[] => {
        const path: FileNode[] = [];
        let currentNode = targetNode;

        path.unshift(currentNode);

        while (currentNode.parentFolderID) {
          const parentNode = fileData.find(
            (n) =>
              n.type === "folder" && n.folderID === currentNode.parentFolderID,
          );
          if (parentNode) {
            path.unshift(parentNode);
            currentNode = parentNode;
          } else {
            break;
          }
        }

        if (path[0]?.folderID !== 0) {
          path.unshift({ id: "0", label: "Root", type: "folder", folderID: 0 });
        }

        return path;
      };

      setCurrentPath(buildPath(node));
      setExpanded((prev) => ({
        ...prev,
        [node.id]: true,
      }));
    } else if (node.type === "file") {
      router.push(`/dashboard/folders/file/${node.fileId}`);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);

    const clickedFolder = currentPath[index];

    if (clickedFolder.type === "folder") {
      setExpanded((prev) => ({
        ...prev,
        [clickedFolder.id]: true,
      }));
    }
  };

  return {
    currentPath,
    expanded,
    fileData,
    folderCount,
    fileCount,
    handleNodeClick,
    handleBreadcrumbClick,
    setExpanded,
  };
}
