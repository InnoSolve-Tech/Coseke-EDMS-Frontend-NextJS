// pages/api/convert-to-pdf.js
"use strict";

const libre = require("libreoffice-convert");
const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");
const { IncomingForm } = require("formidable"); // Fixed import

// Promisify the convert function
libre.convertAsync = require("util").promisify(libre.convert);

// Disable Next.js default body parser to handle multipart data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse form data with correct formidable usage
    const form = new IncomingForm({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      keepExtensions: true,
    });

    // Use promise-based parsing
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Extract fields - formidable returns arrays, so get first element
    const filename = Array.isArray(fields.filename)
      ? fields.filename[0]
      : fields.filename;
    const mimeType = Array.isArray(fields.mimeType)
      ? fields.mimeType[0]
      : fields.mimeType;
    const officeType = Array.isArray(fields.officeType)
      ? fields.officeType[0]
      : fields.officeType;

    // Get the uploaded file
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile || !filename) {
      return res.status(400).json({ error: "File and filename are required" });
    }

    console.log("Processing file:", {
      filename,
      mimeType,
      officeType,
      fileSize: uploadedFile.size,
      filePath: uploadedFile.filepath,
    });

    // Read the uploaded file
    let documentBuffer;
    try {
      documentBuffer = await fs.readFile(uploadedFile.filepath);
    } catch (error) {
      console.error("Error reading uploaded file:", error);
      return res.status(500).json({ error: "Failed to read uploaded file" });
    }

    // Clean up temporary file
    try {
      await fs.unlink(uploadedFile.filepath);
    } catch (cleanupError) {
      console.warn(
        "Warning: Could not clean up temporary file:",
        cleanupError.message,
      );
    }

    // Convert to PDF using LibreOffice
    const ext = ".pdf";
    let pdfBuffer;

    try {
      console.log("Starting LibreOffice conversion...");
      // Convert document to PDF
      // The third parameter (undefined) uses default filter - let LibreOffice decide
      pdfBuffer = await libre.convertAsync(documentBuffer, ext, undefined);
      console.log("Conversion successful, PDF size:", pdfBuffer.length);
    } catch (conversionError) {
      console.error("LibreOffice conversion error:", conversionError);
      return res.status(500).json({
        error: "Document conversion failed",
        details: conversionError.message,
      });
    }

    // Generate a unique filename for the converted PDF
    const pdfFilename = filename.replace(/\.[^/.]+$/, "") + ".pdf";

    // For smaller files (< 10MB), return as base64 data URL
    if (pdfBuffer.length < 10 * 1024 * 1024) {
      const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

      return res.status(200).json({
        success: true,
        pdfUrl: dataUrl,
        originalFilename: filename,
        pdfFilename: pdfFilename,
        conversionInfo: {
          originalMimeType: mimeType,
          officeType: officeType,
          convertedSize: pdfBuffer.length,
          deliveryMethod: "base64",
        },
      });
    }

    // For larger files, save to temporary location and return file URL
    const tempDir = "/tmp";
    const tempFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${pdfFilename}`;
    const tempPath = path.join(tempDir, tempFilename);

    try {
      await fs.writeFile(tempPath, pdfBuffer);
      const pdfUrl = `/api/temp-files/${tempFilename}`;

      res.status(200).json({
        success: true,
        pdfUrl: pdfUrl,
        originalFilename: filename,
        pdfFilename: pdfFilename,
        conversionInfo: {
          originalMimeType: mimeType,
          officeType: officeType,
          convertedSize: pdfBuffer.length,
          deliveryMethod: "file",
        },
      });
    } catch (fileError) {
      console.error("Error saving PDF file:", fileError);
      return res.status(500).json({ error: "Failed to save converted PDF" });
    }
  } catch (error) {
    console.error("Conversion API error:", error);

    // More specific error handling
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File too large",
        details: "Maximum file size is 50MB",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Invalid file upload",
        details: "Unexpected file in upload",
      });
    }

    res.status(500).json({
      error: "Internal server error during conversion",
      details: error.message,
    });
  }
}
