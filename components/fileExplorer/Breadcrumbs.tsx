"use client";

import { Button } from "@mui/joy";
import { Breadcrumbs as JoyBreadcrumbs } from "@mui/joy";
import { Folder } from "lucide-react";
import { FileNode } from "@/types/file";

interface BreadcrumbsProps {
  currentPath: FileNode[];
  onBreadcrumbClick: (index: number) => void;
}

export function Breadcrumbs({
  currentPath,
  onBreadcrumbClick,
}: BreadcrumbsProps) {
  return (
    <JoyBreadcrumbs
      size="lg"
      separator="›"
      sx={{
        "--Breadcrumbs-gap": "8px",
        "--Icon-fontSize": "var(--joy-fontSize-xl2)",
        padding: "8px 16px",
        backgroundColor: "background.level1",
        borderRadius: "md",
      }}
    >
      {currentPath.map((crumb, index) => (
        <Button
          key={crumb.id}
          variant={index === currentPath.length - 1 ? "soft" : "plain"}
          color={index === currentPath.length - 1 ? "primary" : "neutral"}
          onClick={() => onBreadcrumbClick(index)}
          startDecorator={index === 0 ? <Folder size="small" /> : null}
          size="sm"
        >
          {crumb.label}
        </Button>
      ))}
    </JoyBreadcrumbs>
  );
}
