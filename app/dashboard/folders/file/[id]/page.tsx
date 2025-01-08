"use client";

import { getFilesByHash, getFilesById } from "@/components/files/api";
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  InsertDriveFileOutlined as DocIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  TableChartOutlined as ExcelIcon,
  PictureAsPdfOutlined as PdfIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Option,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/joy";
import { ColorPaletteProp } from "@mui/joy/styles";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";

interface Metadata {
  [key: string]: string | string[];
}

interface Document {
  id: number;
  folderID: number;
  filename: string;
  documentType: string;
  documentName: string;
  hashName: string;
  fileLink: string | null;
  mimeType: string;
  metadata: Metadata;
  createdDate: string;
  lastModifiedDateTime: string;
  lastModifiedBy: number;
  createdBy: number;
}

const FileViewPage = () => {
  const { id } = useParams();
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    color: ColorPaletteProp;
    message: string;
  }>({
    open: false,
    message: "",
    color: "success",
  });
  const [previewState, setPreviewState] = useState<{
    excelData?: any[] | null;
  }>({
    excelData: null,
  });
  const [previewMode, setPreviewMode] = useState<
    "default" | "local" | "google"
  >("default");
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [googleFileId, setGoogleFileId] = useState<string | null>(null);
  const [showInstallMessage, setShowInstallMessage] = useState(false);

  // Fetch file details on component mount
  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const res = await getFilesById(parseInt(id as string));
        const response = await getFilesByHash(res.hashName);
        console.log("File details response:", response);

        // Extract unique document types from the initial response
        const availableDocumentTypes = [res.documentType]; // Start with the current document's type

        if (response) {
          const fileData = {
            ...res,
            fileLink: URL.createObjectURL(
              new Blob([response], { type: res.mimeType }),
            ),
            mimeType: res.mimeType,
          };

          setDocument(fileData);

          // If you want to add a list of document types for the Select component
          setDocumentTypes(availableDocumentTypes);
        } else {
          throw new Error("No file found");
        }
      } catch (err) {
        console.error("Error fetching file details:", err);
        setError("Failed to load file details");
        showSnackbar("Failed to load file details", "danger");
      } finally {
        setLoading(false);
      }
    };

    fetchFileDetails();
  }, [id]);

  // Parse Excel files
  useEffect(() => {
    const parseExcelFile = async () => {
      if (
        document &&
        (document.mimeType.includes("spreadsheetml") ||
          document.mimeType === "application/vnd.ms-excel")
      ) {
        try {
          const arrayBuffer = await fetch(document.fileLink!).then((res) =>
            res.arrayBuffer(),
          );
          const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          setPreviewState((prev) => ({ ...prev, excelData: data as any[] }));
        } catch (error) {
          console.error("Error parsing Excel file:", error);
        }
      }
    };

    parseExcelFile();
  }, [document?.fileLink, document?.mimeType]);

  const handleMetadataChange = (key: string, value: string) => {
    if (!document) return;

    setDocument({
      ...document,
      metadata: {
        ...document.metadata,
        [key]: value,
      },
    });
  };

  const handleSubmit = () => {
    if (!document) return;

    console.log("Updated document:", document);
    showSnackbar("Document metadata updated successfully", "success");
    // TODO: Implement actual metadata update API call
  };

  const showSnackbar = (message: string, color: ColorPaletteProp) => {
    setSnackbar({ open: true, message, color });
  };

  const handleDownload = async () => {
    if (!document || !document.hashName || !document.filename) {
      console.error("Invalid document object");
      showSnackbar("Invalid document", "danger");
      return;
    }

    try {
      const blob = await getFilesByHash(document.hashName);

      if (!blob || !(blob instanceof Blob)) {
        throw new Error("Invalid file data");
      }

      const link = window.document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = document.filename;
      link.style.display = "none";
      window.document.body.appendChild(link);
      link.click();

      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed:", error);
      showSnackbar("Failed to download file", "danger");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>Loading file details...</Typography>
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography color="danger">{error || "No file found"}</Typography>
      </Box>
    );
  }

  const renderPreview = () => {
    if (!document || !document.fileLink) {
      return (
        <Typography level="body-lg" textAlign="center">
          No file available to preview.
        </Typography>
      );
    }

    const mimeType = document.mimeType.toLowerCase();

    // Handle PDF files with iframe
    if (mimeType === "application/pdf") {
      return (
        <Card
          variant="outlined"
          sx={{ height: "calc(100% - 60px)", overflow: "auto" }}
        >
          <CardContent
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <iframe
              src={`${document.fileLink}#toolbar=0`}
              width="100%"
              height="600px"
              style={{ border: "none" }}
              title="PDF Preview"
            />

            <Typography level="body-lg" textAlign="center" sx={{ mt: 2 }}>
              {document.filename}
            </Typography>
            <Button
              onClick={handleDownload}
              startDecorator={<DownloadIcon />}
              sx={{ mt: 2 }}
            >
              Download PDF
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Use react-doc-viewer for other file types (e.g., .docx, .xlsx)
    const docs = [
      {
        uri: document.fileLink,
        fileName: document.filename,
      },
    ];

    return (
      <Card
        variant="outlined"
        sx={{ height: "calc(100% - 60px)", overflow: "auto" }}
      >
        <CardContent
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DocViewer
            documents={docs}
            pluginRenderers={DocViewerRenderers}
            config={{
              header: {
                disableHeader: true,
              },
            }}
          />
          <Typography level="body-lg" textAlign="center" sx={{ mt: 2 }}>
            {document.filename}
          </Typography>
          <Button
            onClick={handleDownload}
            startDecorator={<DownloadIcon />}
            sx={{ mt: 2 }}
          >
            Download File
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        bgcolor: "background.body",
      }}
    >
      <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
        <Typography level="h2" sx={{ mb: 2 }}>
          File Preview
        </Typography>
        {renderPreview()}
      </Box>
      <Divider orientation="vertical" />
      <Box
        sx={{
          width: { xs: "100%", md: 400 },
          p: 3,
          bgcolor: "background.level1",
        }}
      >
        <Card variant="outlined">
          <CardContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography level="h3" startDecorator={<EditIcon />}>
              Edit Metadata
            </Typography>
            <FormControl>
              <FormLabel>Document Name</FormLabel>
              <Input
                value={document.documentName}
                onChange={(e) =>
                  setDocument({ ...document, documentName: e.target.value })
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Document Type</FormLabel>
              <Select
                value={document.documentType}
                onChange={(_, value) =>
                  setDocument({ ...document, documentType: value as string })
                }
              >
                {documentTypes.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </FormControl>
            <Divider />
            <Typography level="title-md">Additional Metadata</Typography>
            <Stack spacing={2}>
              {Object.entries(document.metadata).map(([key, value]) => (
                <FormControl key={key}>
                  <FormLabel>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </FormLabel>
                  <Input
                    value={typeof value === "object" ? value.join(", ") : value}
                    onChange={(e) => handleMetadataChange(key, e.target.value)}
                  />
                </FormControl>
              ))}
            </Stack>
            <Button
              onClick={handleSubmit}
              sx={{ mt: 2 }}
              startDecorator={<EditIcon />}
            >
              Update Metadata
            </Button>
          </CardContent>
        </Card>
      </Box>
      <Snackbar
        variant="soft"
        color={snackbar.color}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        startDecorator={<DescriptionIcon />}
        endDecorator={
          <IconButton
            onClick={() => setSnackbar({ ...snackbar, open: false })}
            size="sm"
            variant="plain"
            color="neutral"
          >
            <CloseIcon />
          </IconButton>
        }
      >
        {snackbar.message}
      </Snackbar>
    </Box>
  );
};

export default FileViewPage;
