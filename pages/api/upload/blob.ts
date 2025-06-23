// pages/api/upload/blob.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | ErrorResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    const [fields, files] = await form.parse(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({
        error: "No file uploaded",
        details: "Please provide a file in the request",
      });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const originalName = file.originalFilename || "document";
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const uniqueFilename = `${baseName}_${timestamp}${extension}`;

    // Move file to final location
    const finalPath = path.join(uploadsDir, uniqueFilename);
    fs.renameSync(file.filepath, finalPath);

    // CRITICAL: Use the correct URL format that ONLYOFFICE can access
    // Get the base URL from environment or request headers
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host =
      req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // Ensure the URL is accessible from ONLYOFFICE Document Server
    const publicUrl = `${baseUrl}/uploads/${uniqueFilename}`;

    // Log for debugging
    console.log("File uploaded:", {
      originalName,
      uniqueFilename,
      publicUrl,
      size: file.size,
      baseUrl,
    });

    return res.status(200).json({
      url: publicUrl,
      filename: originalName,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      error: "Upload failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
