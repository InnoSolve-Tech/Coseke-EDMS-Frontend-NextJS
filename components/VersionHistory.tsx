"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Box, Typography, List, ListItem } from "@mui/joy";
import { ListItemText } from "@mui/material";

interface Version {
  id: number;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
}

interface VersionHistoryProps {
  documentId: number;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  documentId,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    // Fetch version history for the document
    fetchVersionHistory();
  }, []);

  const fetchVersionHistory = async () => {
    try {
      // Replace with actual API call
      const response = await fetch(`/api/versions?documentId=${documentId}`);
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error("Error fetching version history:", error);
    }
  };

  return (
    <Box>
      <Typography level="h4" sx={{ fontSize: "1rem", fontWeight: 600, mb: 2 }}>
        Version History
      </Typography>
      <List>
        {versions.map((version) => (
          <ListItem key={version.id}>
            <ListItemText
              primary={`Version ${version.versionNumber}`}
              secondary={`${version.createdBy} - ${new Date(version.createdAt).toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
