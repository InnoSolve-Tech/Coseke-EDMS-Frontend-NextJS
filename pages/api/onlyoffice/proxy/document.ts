// pages/api/openoffice/proxy/document.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { fileId, mimeType, version } = req.query;

  const fileUrl = `${process.env.NEXT_PUBLIC_FILES_URL}/file-management/api/v1/files/download/${fileId}?version=${version}`;

  try {
    const response = await fetch(fileUrl, {
      headers: {
        ...(process.env.PROXY_SECRET && {
          "X-Proxy-Secret": process.env.PROXY_SECRET,
        }),
      },
    });

    if (!response.ok || !response.body) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch file" });
    }

    res.setHeader(
      "Content-Type",
      (mimeType as string) || "application/octet-stream",
    );

    // Convert Web ReadableStream to Node.js stream and pipe to response
    const nodeStream = Readable.fromWeb(response.body as any);
    nodeStream.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
