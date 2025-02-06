"use client";

import { useState, useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";

interface DocumentPreviewProps {
  fileUrl: string;
  mimeType: string;
  filename: string;
}

const DocumentPreview = ({ fileUrl }: DocumentPreviewProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewerRef.current) {
      WebViewer(
        {
          path: "/lib", // Adjust this path as needed
          initialDoc: fileUrl,
        },
        viewerRef.current,
      ).then((instance) => {
        const { UI } = instance;
        UI.loadDocument(fileUrl);
      });
    }
  }, [fileUrl]);

  return (
    <div className="w-full h-full min-h-[600px] relative">
      <div ref={viewerRef} className="w-full h-full" />
    </div>
  );
};

export default DocumentPreview;
