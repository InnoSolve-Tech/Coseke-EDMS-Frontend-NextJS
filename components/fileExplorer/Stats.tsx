"use client";

import { Card, CardContent, Typography } from "@mui/joy";

interface StatsProps {
  folderCount: string;
  fileCount: string;
}

export function Stats({ folderCount, fileCount }: StatsProps) {
  return (
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
  );
}
