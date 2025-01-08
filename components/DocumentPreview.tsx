"use client";

import { useState, useEffect } from "react";

interface DocumentPreviewProps {
  fileUrl: string;
  mimeType: string;
  filename: string;
}

const DocumentPreview = ({
  fileUrl,
  mimeType,
  filename,
}: DocumentPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (!fileUrl) return;

    // Microsoft Office Online viewer URL
    const msViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    // Google Docs viewer URL (alternative)
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

    // Choose viewer based on file type
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // docx
      mimeType === "application/msword" || // doc
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // xlsx
      mimeType === "application/vnd.ms-excel" || // xls
      mimeType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" || // pptx
      mimeType === "application/vnd.ms-powerpoint" // ppt
    ) {
      setPreviewUrl(msViewerUrl);
    } else {
      setPreviewUrl(googleViewerUrl);
    }
  }, [fileUrl, mimeType]);

  return (
    <div className="w-full h-full min-h-[600px] relative">
      {previewUrl ? (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          frameBorder="0"
          title={`Preview of ${filename}`}
          allowFullScreen
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p>Loading preview...</p>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
