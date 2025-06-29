import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import jwt from "jsonwebtoken";

interface ConfigRequest {
  filename: string;
  url: string;
  documentId: string;
  fileId?: string;
  userId?: string;
  userName?: string;
  mode?: "edit" | "view";
}

interface ConfigResponse {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions: {
      comment: boolean;
      download: boolean;
      edit: boolean;
      fillForms: boolean;
      modifyFilter: boolean;
      modifyContentControl: boolean;
      review: boolean;
    };
  };
  documentType: "word" | "cell" | "slide";
  editorConfig: {
    mode: "edit" | "view";
    lang: string;
    plugins: {
      autostart: string[];
      pluginsData: any[];
    };
    callbackUrl: string;
    user: {
      id: string;
      name: string;
    };
    customization: {
      autosave: boolean;
      forcesave: boolean;
      compactToolbar: boolean;
      hideRightMenu: boolean;
      hideRulers: boolean;
      unit: string;
    };
  };
  width: string;
  height: string;
  token?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// In-memory store for temporary file URLs (use Redis in production)
const tempFileStore = new Map<
  string,
  {
    originalUrl: string;
    filename: string;
    createdAt: number;
    expiresAt: number;
  }
>();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of tempFileStore.entries()) {
      if (now > value.expiresAt) {
        tempFileStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "docx";
}

function getDocumentType(filename: string): "word" | "cell" | "slide" {
  const ext = getFileExtension(filename);
  switch (ext) {
    case "pdf":
    case "docx":
    case "doc":
    case "odt":
    case "rtf":
    case "txt":
      return "word";
    case "xlsx":
    case "xls":
    case "ods":
    case "csv":
      return "cell";
    case "pptx":
    case "ppt":
    case "odp":
      return "slide";
    default:
      return "word";
  }
}

function isValidFileType(filename: string): boolean {
  const supportedExtensions = [
    "docx",
    "doc",
    "odt",
    "rtf",
    "txt",
    "xlsx",
    "xls",
    "ods",
    "csv",
    "pptx",
    "ppt",
    "odp",
    "pdf",
  ];
  const ext = getFileExtension(filename);
  return supportedExtensions.includes(ext);
}

function createTemporaryFileId(originalUrl: string, filename: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(`${originalUrl}${filename}${timestamp}${random}`)
    .digest("hex")
    .substring(0, 16);

  return `temp_${hash}`;
}

function createTemporaryUrl(
  originalUrl: string,
  filename: string,
  baseUrl: string,
): string {
  const tempId = createTemporaryFileId(originalUrl, filename);
  const expirationTime = 2 * 60 * 60 * 1000; // 2 hours
  const now = Date.now();

  // Store the mapping
  tempFileStore.set(tempId, {
    originalUrl,
    filename,
    createdAt: now,
    expiresAt: now + expirationTime,
  });

  // Create temporary URL that points to our proxy endpoint
  return `/api/onlyoffice/proxy/${tempId}`;
}

function makeUrlAccessibleFromContainer(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
      if (process.env.NODE_ENV === "development") {
        urlObj.hostname = "host.docker.internal";
        return urlObj.toString();
      }
      const containerHostname = process.env.ONLYOFFICE_ACCESSIBLE_HOSTNAME;
      if (containerHostname) {
        urlObj.hostname = containerHostname;
        return urlObj.toString();
      }
      const localIP = getLocalIPAddress();
      if (localIP) {
        urlObj.hostname = localIP;
        return urlObj.toString();
      }
    }
    return url;
  } catch (error) {
    console.error("Error converting URL:", error);
    return url;
  }
}

function getLocalIPAddress(): string | null {
  try {
    const { networkInterfaces } = require("os");
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (error) {
    console.error("Failed to get local IP:", error);
  }
  return null;
}

async function validateUrlAccessibility(
  url: string,
): Promise<{ accessible: boolean; error?: string }> {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return {
        accessible: false,
        error: "Only HTTP and HTTPS protocols are supported",
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "OnlyOffice-Validator/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { accessible: true };
  } catch (error) {
    console.error("URL validation failed:", error);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          accessible: false,
          error: "Request timeout - URL took too long to respond",
        };
      }
      return { accessible: false, error: error.message };
    }
    return { accessible: false, error: "Unknown validation error" };
  }
}

function generateDocumentKey(fileId: string, filename: string): string {
  const keySource = `${fileId}_${filename}`;
  return crypto
    .createHash("sha256")
    .update(keySource)
    .digest("hex")
    .substring(0, 32);
}

function generateJwtToken(payload: object): string | null {
  const secret = process.env.ONLYOFFICE_JWT_SECRET;
  if (!secret) {
    console.warn("ONLYOFFICE_JWT_SECRET not configured - JWT disabled");
    return null;
  }

  try {
    return jwt.sign(payload, secret, {
      algorithm: "HS256",
      expiresIn: "2h", // Match temp URL expiration
    });
  } catch (error) {
    console.error("JWT generation error:", error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfigResponse | ErrorResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      filename,
      url,
      documentId,
      fileId,
      userId = "anonymous",
      userName = "Anonymous User",
    }: ConfigRequest = req.body;

    const ext = getFileExtension(filename);
    let mode = req.body.mode || "edit";

    const missingFields = [];
    if (!filename) missingFields.push("filename");
    if (!url) missingFields.push("url");
    if (!documentId) missingFields.push("documentId");

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
        details: "Please provide all required fields in the request body",
      });
    }

    if (!isValidFileType(filename)) {
      return res.status(400).json({
        error: "Unsupported file type",
        details: `File type '${ext}' is not supported by OnlyOffice`,
      });
    }

    if (ext === "pdf") {
      mode = "view"; // Force PDFs to open in read-only mode
    }

    if (mode !== "edit" && mode !== "view") {
      return res.status(400).json({
        error: "Invalid mode",
        details: 'Mode must be either "edit" or "view"',
      });
    }

    // Validate the original URL is accessible
    const validation = await validateUrlAccessibility(url);
    if (!validation.accessible) {
      return res.status(400).json({
        error: "Source document URL not accessible",
        details: `Validation failed: ${validation.error}`,
      });
    }

    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host =
      req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // Create temporary URL for the document
    const tempUrl = createTemporaryUrl(url, filename, baseUrl);
    const accessibleTempUrl = makeUrlAccessibleFromContainer(tempUrl);

    const keySource = fileId || documentId;
    const documentKey = generateDocumentKey(keySource, filename);

    const callbackUrl = makeUrlAccessibleFromContainer(
      `${baseUrl}/api/onlyoffice/callback`,
    );

    const config: ConfigResponse = {
      document: {
        fileType: ext,
        key: documentKey,
        title: filename,
        url: accessibleTempUrl, // Use temporary URL instead of original
        permissions: {
          comment: mode === "edit",
          download: true,
          edit: mode === "edit",
          fillForms: mode === "edit",
          modifyFilter: mode === "edit",
          modifyContentControl: mode === "edit",
          review: mode === "edit",
        },
      },
      documentType: getDocumentType(filename),
      editorConfig: {
        plugins: {
          autostart: ["e-signature"],
          pluginsData: [
            {
              name: "e-signature",
              url: `${process.env.NEXT_PUBLIC_ONLYOFFICE_URL}/web-apps/apps/plugins/e-signature/plugin.js`,
              config: {},
            },
          ],
        },
        mode,
        lang: "en",
        callbackUrl,
        user: {
          id: userId,
          name: userName,
        },
        customization: {
          autosave: true,
          forcesave: false,
          compactToolbar: false,
          hideRightMenu: false,
          hideRulers: false,
          unit: "cm",
        },
      },
      width: "100%",
      height: "100%",
    };

    const jwtToken = generateJwtToken(config);
    if (jwtToken) {
      config.token = jwtToken;
    }

    console.log("OnlyOffice config generated:", {
      documentId,
      fileId,
      filename,
      documentKey,
      mode,
      documentType: config.documentType,
      originalUrl: url,
      tempUrl,
      accessibleTempUrl,
      callbackUrl,
      hasJwt: !!jwtToken,
    });

    return res.status(200).json(config);
  } catch (error) {
    console.error("OnlyOffice config error:", error);
    return res.status(500).json({
      error: "Failed to generate configuration",
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

// Export the store for use in the proxy endpoint
export { tempFileStore };
