// pages/api/temp-files/[filename].js
const fs = require("fs").promises;
const path = require("path");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { filename } = req.query;

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // Security: ensure filename doesn't contain path traversal
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return res.status(400).json({ error: "Invalid filename format" });
  }

  const filePath = path.join("/tmp", filename);

  try {
    // Check if file exists
    await fs.access(filePath);

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Set appropriate headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Expires", "0");

    // Send the file
    res.status(200).send(fileBuffer);

    // Optional: Clean up file after serving (uncomment if desired)
    // setTimeout(async () => {
    //   try {
    //     await fs.unlink(filePath);
    //     console.log('Cleaned up temporary file:', filename);
    //   } catch (cleanupError) {
    //     console.warn('Could not clean up file:', filename, cleanupError.message);
    //   }
    // }, 60000); // Clean up after 1 minute
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({ error: "File not found" });
    }

    console.error("Error serving temporary file:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
