"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, FileImage, FileSpreadsheet } from "lucide-react";
import { getAllFiles } from "@/components/files/api";

interface FileData {
  id: number;
  filename: string;
  mimeType: string;
  createdDate: string;
  lastModifiedDateTime: string;
  metadata?: Record<string, any>;
}

const mimeTypeToType: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "application/vnd.ms-powerpoint": "PPT",
  "text/plain": "TXT",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  default: "Other",
};

function getFileIcon(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return <FileText className="h-4 w-4 text-red-500" />;
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
      return <FileImage className="h-4 w-4 text-orange-500" />;
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return <FileText className="h-4 w-4 text-blue-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

function formatDateTime(dateString: string): {
  date: string;
  time: string;
  fullDateTime: string;
} {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const formattedDateTime = new Intl.DateTimeFormat("en-US", options).format(
      date,
    );

    const [formattedDate, formattedTime] = formattedDateTime.split(", ");

    return {
      date: formattedDate.trim(),
      time: formattedTime.trim(),
      fullDateTime: `${formattedDate.trim()} ${formattedTime.trim()}`,
    };
  } catch (error) {
    console.error("Error formatting date:", error);
    return {
      date: "Invalid Date",
      time: "Invalid Time",
      fullDateTime: "Invalid Date and Time",
    };
  }
}

function getTimeAgo(lastModifiedDateTime: string): string {
  try {
    const modifiedDate = new Date(lastModifiedDateTime);
    if (isNaN(modifiedDate.getTime())) {
      throw new Error("Invalid date");
    }

    const now = new Date();
    const diffInMs = now.getTime() - modifiedDate.getTime();

    if (diffInMs < 60 * 1000) return "Just now";
    if (diffInMs < 60 * 60 * 1000)
      return `${Math.floor(diffInMs / (60 * 1000))}m ago`;
    if (diffInMs < 24 * 60 * 60 * 1000)
      return `${Math.floor(diffInMs / (60 * 60 * 1000))}h ago`;

    const days = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
    if (days < 7) return `${days}d ago`;

    return formatDateTime(lastModifiedDateTime).date;
  } catch (error) {
    console.error("Error calculating time ago:", error);
    return "Unknown time";
  }
}

export function RecentFilesCard() {
  const router = useRouter();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFileClick = (fileId: number) => {
    router.push(`/dashboard/folders/file/${fileId}`);
  };

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await getAllFiles();
        const fileData = Array.isArray(response) ? response : response.data;
        const sortedFiles = fileData.sort(
          (a, b) =>
            new Date(b.lastModifiedDateTime).getTime() -
            new Date(a.lastModifiedDateTime).getTime(),
        );
        setFiles(sortedFiles.slice(0, 5));
      } catch (err) {
        console.error("Error fetching files:", err);
        setError("Failed to load recent files");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Recent Files</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="flex justify-center items-center h-20">
            <p className="text-gray-500 text-sm">Loading recent files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Recent Files</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="text-red-500 text-sm text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Recent Files</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="p-2">Name</TableHead>
              <TableHead className="p-2 w-20">Type</TableHead>
              <TableHead className="p-2 w-32">Created</TableHead>
              <TableHead className="p-2 w-32">Modified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => {
              const createdDateTime = formatDateTime(file.createdDate);
              const modifiedDateTime = formatDateTime(
                file.lastModifiedDateTime,
              );
              const timeAgo = getTimeAgo(file.lastModifiedDateTime);

              return (
                <TableRow
                  key={file.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleFileClick(file.id)}
                >
                  <TableCell className="p-2">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.mimeType)}
                      <span
                        className="truncate max-w-[200px] text-sm"
                        title={file.filename}
                      >
                        {file.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-sm">
                    {mimeTypeToType[file.mimeType] || mimeTypeToType.default}
                  </TableCell>
                  <TableCell className="p-2">
                    <div
                      className="text-sm"
                      title={createdDateTime.fullDateTime}
                    >
                      {createdDateTime.date}
                    </div>
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="flex items-center text-sm">
                      <span
                        className="text-gray-600"
                        title={modifiedDateTime.fullDateTime}
                      >
                        {timeAgo}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
