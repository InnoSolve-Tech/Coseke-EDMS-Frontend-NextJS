"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem } from "@mui/joy";
import { ListItemText } from "@mui/material";
import { getAllVersionsForDocument, VersionDTO } from "../core/files/api";

interface VersionHistoryProps {
  documentId: number;
  onVersionSelect?: (versionId: number, fileUrl: string) => void;
  onClose?: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  documentId,
  onVersionSelect,
  onClose,
}) => {
  const [versions, setVersions] = useState<VersionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      fetchVersionHistory(documentId);
    }
  }, [documentId]);

  const fetchVersionHistory = async (id: number) => {
    try {
      const data = await getAllVersionsForDocument(id);
      setVersions(data);
    } catch (error) {
      console.error("Error fetching version history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (version: VersionDTO) => {
    onVersionSelect?.(version.id, version.fileUrl);
    onClose?.();
  };

  return (
    <Box>
      <Typography level="h4" sx={{ fontSize: "1rem", fontWeight: 600, mb: 2 }}>
        Version History
      </Typography>
      {loading ? (
        <Typography level="body-sm">Loading...</Typography>
      ) : versions.length === 0 ? (
        <Typography level="body-sm">No versions found.</Typography>
      ) : (
        <List>
          {versions.map((version) => (
            <ListItem
              key={version.id}
              onClick={() => handleSelectVersion(version)}
              sx={{
                cursor: "pointer",
                "&:hover": { backgroundColor: "neutral.softHoverBg" },
              }}
            >
              <ListItemText
                primary={
                  version.versionName === "Original Copy"
                    ? "📄 Original Copy"
                    : `Version ${version.versionName}`
                }
                secondary={`${version.createdBy ?? "Unknown"} - ${new Date(
                  version.createdDate,
                ).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
