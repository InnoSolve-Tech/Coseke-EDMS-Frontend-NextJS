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
import { FileText, FileImage, FileSpreadsheet, FileCode } from "lucide-react";
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
      return <FileText className="h-5 w-5 text-red-500" />;
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/vnd.ms-powerpoint":
      return <FileImage className="h-5 w-5 text-orange-500" />;
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return <FileText className="h-5 w-5 text-blue-500" />;
    default:
      return <FileText className="h-5 w-5 text-gray-500" />;
  }
}

function formatDateTime(dateString: string): {
  date: string;
  time: string;
  fullDateTime: string;
} {
  const date = new Date(dateString);

  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    date: formattedDate,
    time: formattedTime,
    fullDateTime: `${formattedDate} ${formattedTime}`,
  };
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return formatDateTime(dateString).date;
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500">Loading recent files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Files</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Modified</TableHead>
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
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {getFileIcon(file.mimeType)}
                      <span
                        className="ml-2 truncate max-w-md"
                        title={file.filename}
                      >
                        {file.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {mimeTypeToType[file.mimeType] || mimeTypeToType.default}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className="text-sm"
                        title={createdDateTime.fullDateTime}
                      >
                        {createdDateTime.date}
                      </span>
                      <span className="text-xs text-gray-500">
                        {createdDateTime.time}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className="text-sm"
                        title={modifiedDateTime.fullDateTime}
                      >
                        {modifiedDateTime.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {modifiedDateTime.time}
                        </span>
                        <span className="text-xs text-blue-500">
                          ({timeAgo})
                        </span>
                      </div>
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
