// pages/api/onlyoffice/callback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";

interface CallbackData {
  key: string;
  status: number;
  url?: string;
  users?: string[];
  actions?: any[];
  changesurl?: string;
  history?: any;
  lastsave?: string;
  notmodified?: boolean;
}

interface CallbackResponse {
  error: number;
  message?: string;
}

// ONLYOFFICE Document Status Codes
const DOCUMENT_STATUS = {
  NOT_FOUND: 0,
  EDITING: 1,
  READY_FOR_SAVING: 2,
  SAVE_ERROR: 3,
  CLOSED_WITHOUT_CHANGES: 4,
  FORCE_SAVE_REQUEST: 6,
  CORRUPT_OR_ERROR: 7,
} as const;

function verifyJwtToken(token: string): boolean {
  const secret = process.env.ONLYOFFICE_JWT_SECRET;

  if (!secret) {
    // If no JWT secret is configured, skip verification
    return true;
  }

  try {
    jwt.verify(token, secret);
    return true;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CallbackResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: 1, message: "Method not allowed" });
  }

  try {
    let callbackData: CallbackData;

    // Handle JWT verification if enabled
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (!verifyJwtToken(token)) {
        return res.status(401).json({ error: 1, message: "Invalid JWT token" });
      }

      // If JWT is used, the data might be in the token payload
      try {
        const decoded = jwt.decode(token) as any;
        callbackData = decoded.payload || req.body;
      } catch {
        callbackData = req.body;
      }
    } else {
      callbackData = req.body;
    }

    const { key, status, url, users, actions } = callbackData;

    console.log("ONLYOFFICE callback received:", {
      key,
      status,
      url,
      users: users?.length || 0,
      actions: actions?.length || 0,
    });

    // Handle different document statuses
    switch (status) {
      case DOCUMENT_STATUS.EDITING:
        console.log(`Document ${key} is being edited`);
        return res.status(200).json({ error: 0 });

      case DOCUMENT_STATUS.READY_FOR_SAVING:
      case DOCUMENT_STATUS.FORCE_SAVE_REQUEST:
        if (!url) {
          console.error("No download URL provided for saving");
          return res
            .status(400)
            .json({ error: 1, message: "No download URL provided" });
        }

        try {
          // Here you could update your database with the new file location
          // await updateDocumentInDatabase(key, savedPath);

          return res.status(200).json({ error: 0 });
        } catch (error) {
          console.error("Failed to save document:", error);
          return res
            .status(500)
            .json({ error: 1, message: "Failed to save document" });
        }

      case DOCUMENT_STATUS.SAVE_ERROR:
        console.error(`Save error for document ${key}`);
        return res.status(200).json({ error: 0 });

      case DOCUMENT_STATUS.CLOSED_WITHOUT_CHANGES:
        console.log(`Document ${key} closed without changes`);
        return res.status(200).json({ error: 0 });

      case DOCUMENT_STATUS.CORRUPT_OR_ERROR:
        console.error(`Document ${key} is corrupt or has errors`);
        return res.status(200).json({ error: 0 });

      default:
        console.log(`Unknown status ${status} for document ${key}`);
        return res.status(200).json({ error: 0 });
    }
  } catch (error) {
    console.error("Callback processing error:", error);
    return res.status(500).json({
      error: 1,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
