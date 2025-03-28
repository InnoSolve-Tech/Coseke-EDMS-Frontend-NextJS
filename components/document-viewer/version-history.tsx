"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Clock,
  MessageSquare,
  Download,
  RotateCcw,
  Upload,
} from "lucide-react";
import {
  createVersionComment,
  getAllVersionsForDocument,
  getAllCommentsForVersion,
  createMajorVersion,
  createMinorVersion,
  uploadVersionFiles,
  VersionDTO,
  getFilesByHash,
} from "../files/api";
import { Label } from "@/components/ui/label";
import { getFilesById } from "../files/api";

// Comment structure matching API response
interface VersionComment {
  id: number;
  content: string; // API returns `content`, using `content` instead of `text`
  createdDate: string;
  createdBy: number; // Keeping it a number
  versionId: number;
}

interface CreateVersionCommentDTO {
  content: string; // API expects `content`
  versionId: number;
}

interface VersionHistoryProps {
  documentId: number;
  onVersionSelect?: (
    versionId: number,
    fileUrl: string,
    mimeType: string,
  ) => void; // 👈 Add mimeType
  onClose?: () => void;
}

export function VersionHistory({
  documentId,
  onVersionSelect,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionDTO[]>([]);
  const [comments, setComments] = useState<Record<number, VersionComment[]>>(
    {},
  );
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showCreateVersionDialog, setShowCreateVersionDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [revertingVersion, setRevertingVersion] = useState<VersionDTO | null>(
    null,
  );
  const [versionComment, setVersionComment] = useState("");
  const [selectedVersionType, setSelectedVersionType] = useState<
    "MAJOR" | "MINOR"
  >("MINOR");
  const [suggestedVersions, setSuggestedVersions] = useState<{
    major: string;
    minor: string;
  }>({
    major: "",
    minor: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch document versions
  useEffect(() => {
    if (!documentId) return;

    const fetchVersions = async () => {
      try {
        const fetchedVersions = await getAllVersionsForDocument(documentId);

        // Sort by date (newest first) for display
        const sortedVersions = [...fetchedVersions].sort(
          (a, b) =>
            new Date(b.createdDate).getTime() -
            new Date(a.createdDate).getTime(),
        );

        setVersions(sortedVersions);

        // Calculate suggested versions
        setSuggestedVersions(calculateSuggestedVersions(fetchedVersions));

        // Don't automatically select a version or call onVersionSelect here
        // Just set the selected version for UI highlighting if there are versions
        if (sortedVersions.length > 0) {
          setSelectedVersion(sortedVersions[0].id);
          fetchComments(sortedVersions[0].id);
        }
      } catch (error) {
        console.error("Error fetching versions:", error);
        toast({
          title: "Error",
          description: "Failed to load version history",
          variant: "destructive",
        });
      }
    };

    fetchVersions();
  }, [documentId]);

  // Calculate suggested version numbers based on existing versions
  const calculateSuggestedVersions = (versionList: VersionDTO[]) => {
    // Default if no versions exist
    let suggestedMajor = "1.0";
    let suggestedMinor = "0.1";

    if (versionList.length > 0) {
      // Find the highest version number
      const versionNumbers = versionList.map((v) => {
        // Extract numeric parts from version strings like "1.0" or "v2.3"
        const match = v.versionName.match(/(\d+)\.(\d+)/);
        if (match) {
          return {
            major: Number.parseInt(match[1], 10),
            minor: Number.parseInt(match[2], 10),
          };
        }
        return { major: 0, minor: 0 };
      });

      // Find highest major and minor versions
      const highestVersion = versionNumbers.reduce(
        (prev, current) => {
          if (current.major > prev.major) return current;
          if (current.major === prev.major && current.minor > prev.minor)
            return current;
          return prev;
        },
        { major: 0, minor: 0 },
      );

      // Suggest next versions
      suggestedMajor = `${highestVersion.major + 1}.0`;
      suggestedMinor = `${highestVersion.major}.${highestVersion.minor + 1}`;
    }

    return { major: suggestedMajor, minor: suggestedMinor };
  };

  // Fetch comments for a selected version
  const fetchComments = async (versionId: number) => {
    try {
      const fetchedComments = await getAllCommentsForVersion(versionId);
      setComments((prev) => ({
        ...prev,
        [versionId]: fetchedComments,
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    }
  };

  const handleVersionSelect = async (
    versionId: number,
    versionFileId: number,
  ) => {
    try {
      // Step 1: Get file metadata (includes hashName and mimeType)
      const fileMeta = await getFilesById(versionFileId);

      // Step 2: Fetch the raw blob from the hash
      const rawBlob = await getFilesByHash(fileMeta.hashName);

      // ✅ Step 3: Reconstruct the blob with correct MIME type (PDF, Word, etc.)
      const typedBlob = new Blob([rawBlob], { type: fileMeta.mimeType });

      // Step 4: Create a blob URL from the typed blob
      const url = URL.createObjectURL(typedBlob);

      console.log(
        `✅ Loaded versionId=${versionId}, URL=${url}, MIME=${fileMeta.mimeType}`,
      );

      // Step 5: Notify the parent viewer with file URL and MIME type
      if (onVersionSelect) {
        onVersionSelect(versionId, url, fileMeta.mimeType); // Correctly passes MIME
      }

      // Step 6: Load comments for the selected version
      fetchComments(versionId);

      // Optional: Close version history tab if needed
      if (onClose) onClose();
    } catch (err) {
      console.error("❌ Failed to load version file:", err);
      toast({
        title: "Error",
        description: "Failed to load version file",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || selectedVersion === null) return;

    try {
      const commentData: CreateVersionCommentDTO = {
        content: newComment, // API expects `content`
        versionId: selectedVersion,
      };

      const newCommentData = await createVersionComment(commentData);

      setComments((prev) => ({
        ...prev,
        [selectedVersion]: [...(prev[selectedVersion] || []), newCommentData],
      }));

      setNewComment("");
      toast({ title: "Success", description: "Comment added successfully" });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleDownloadVersion = (version: VersionDTO) => {
    if (version.fileUrl) {
      window.open(version.fileUrl, "_blank");
    } else {
      toast({
        title: "Error",
        description: "Version file not available",
        variant: "destructive",
      });
    }
  };

  const handleRevertVersion = (version: VersionDTO) => {
    setRevertingVersion(version);
    setShowRevertDialog(true);
  };

  // At the top of your component
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are allowed.",
        variant: "destructive",
      });
      return;
    }

    console.log("📂 File selected:", {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    });

    setUploadedFile(selectedFile);
  };

  const handleCreateVersion = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "No file selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = getCurrentUserId(); // Get user ID first
      console.log("userID", userId);
      // Prepare version data with userId included
      const versionData = {
        documentId,
        changes: versionComment || "No comment",
        versionType: selectedVersionType,
        versionName:
          selectedVersionType === "MAJOR"
            ? suggestedVersions.major
            : suggestedVersions.minor,
        userId, // Include userId in the payload
      };

      // Call the upload API
      const newVersion = await uploadVersionFiles(
        uploadedFile,
        versionData,
        userId,
      );

      console.log("✅ Version created:", newVersion);

      // Update UI state
      setVersions((prev) => [newVersion, ...prev]);
      setSuggestedVersions(
        calculateSuggestedVersions([newVersion, ...versions]),
      );

      // Reset form
      setShowCreateVersionDialog(false);
      setUploadedFile(null);
      setVersionComment("");

      toast({
        title: "Success",
        description: `Version ${newVersion.versionName} created successfully!`,
      });
    } catch (error: any) {
      console.error("❌ Version creation failed:", error);
      toast({
        title: "Upload failed",
        description:
          error.response?.data?.message || "Failed to create version",
        variant: "destructive",
      });
    }
  };

  const handleConfirmRevert = async () => {
    if (!revertingVersion || !documentId) return;

    try {
      // Determine the new version name based on type
      const versionName =
        selectedVersionType === "MAJOR"
          ? suggestedVersions.major
          : suggestedVersions.minor;

      // Prepare the version data with versionName
      const versionData = {
        versionName,
        changes:
          versionComment ||
          `Reverted to version ${revertingVersion.versionName}`,
        fileUrl: revertingVersion.fileUrl,
        documentId: Number(documentId),
      };

      // Call appropriate endpoint
      let newVersion: VersionDTO;
      if (selectedVersionType === "MAJOR") {
        newVersion = await createMajorVersion(versionData, getCurrentUserId());
      } else {
        newVersion = await createMinorVersion(versionData, getCurrentUserId());
      }

      // Update UI
      setVersions((prev) => [newVersion, ...prev]);
      setSuggestedVersions(
        calculateSuggestedVersions([newVersion, ...versions]),
      );
      setRevertingVersion(null);
      setVersionComment("");
      setShowRevertDialog(false);

      toast({
        title: "Success",
        description: `Reverted to version ${revertingVersion.versionName} as new version ${newVersion.versionName}`,
      });
    } catch (error) {
      console.error("Error reverting version:", error);
      toast({
        title: "Error",
        description: "Failed to revert version",
        variant: "destructive",
      });
    }
  };

  // Get current user ID (placeholder function)
  const getCurrentUserId = (): number => {
    // Replace with actual implementation to get the current user ID
    return 1; // Default user ID
  };

  return (
    <div className="grid gap-6 h-full">
      {/* Version History Section */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <h3 className="text-lg font-medium">Version History</h3>
          </div>
          <Button size="sm" onClick={() => setShowCreateVersionDialog(true)}>
            <Upload className="h-4 w-4 mr-2" /> New Version
          </Button>
        </div>
        <ScrollArea className="h-[250px]">
          <div className="space-y-1">
            {versions.length > 0 ? (
              versions.map((version) => (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                    version.id === selectedVersion
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() =>
                    handleVersionSelect(version.id, version.versionFileId)
                  }
                >
                  <div>
                    <div className="font-medium">{version.versionName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(version.createdDate).toLocaleString()}
                      {version.createdBy
                        ? ` by User #${version.createdBy}`
                        : ""}
                    </div>
                    {version.changes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {version.changes}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevertVersion(version);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadVersion(version);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No versions available
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Comments Section */}
      <div className="grid gap-2 flex-1">
        <div className="flex items-center">
          <MessageSquare className="mr-2 h-4 w-4" />
          <h3 className="text-lg font-medium">
            Comments on{" "}
            {selectedVersion &&
              versions.find((v) => v.id === selectedVersion)?.versionName}
          </h3>
        </div>
        <ScrollArea className="flex-1 h-[200px]">
          <div className="space-y-4">
            {selectedVersion && comments[selectedVersion]?.length > 0 ? (
              comments[selectedVersion].map((comment) => (
                <div key={comment.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.createdDate).toLocaleString()} by User #
                    {comment.createdBy}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No comments for this version
              </p>
            )}
          </div>
        </ScrollArea>
        <div className="grid gap-2">
          <Textarea
            placeholder="Add a comment about this version..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button onClick={handleAddComment}>Add Comment</Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="application/pdf"
        onChange={handleFileChange}
      />

      {/* Create Version Dialog */}
      {showCreateVersionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Create New Version</h3>
            <div className="space-y-4">
              {/* File upload section */}
              <div className="space-y-2">
                <Label htmlFor="versionFile">Upload Document</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedFile ? (
                    <div className="flex flex-col items-center">
                      <p className="font-medium text-sm">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">
                        Click to upload a PDF file
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or drag and drop
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Version comment */}
              <div className="space-y-2">
                <Label htmlFor="versionComment">Version Comment</Label>
                <Textarea
                  id="versionComment"
                  placeholder="Describe the changes in this version..."
                  value={versionComment}
                  onChange={(e) => setVersionComment(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              {/* Version type selection with radio buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Version Type</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="minorVersion"
                      name="versionType"
                      className="h-4 w-4"
                      checked={selectedVersionType === "MINOR"}
                      onChange={() => setSelectedVersionType("MINOR")}
                    />
                    <Label htmlFor="minorVersion" className="cursor-pointer">
                      <span className="font-medium">Minor Version</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Next: {suggestedVersions.minor})
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="majorVersion"
                      name="versionType"
                      className="h-4 w-4"
                      checked={selectedVersionType === "MAJOR"}
                      onChange={() => setSelectedVersionType("MAJOR")}
                    />
                    <Label htmlFor="majorVersion" className="cursor-pointer">
                      <span className="font-medium">Major Version</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Next: {suggestedVersions.major})
                      </span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateVersionDialog(false);
                    setUploadedFile(null);
                    setVersionComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateVersion} disabled={!uploadedFile}>
                  Create Version
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revert Version Dialog */}
      {showRevertDialog && revertingVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              Revert to Previous Version
            </h3>
            <div className="space-y-4">
              <p>
                You are about to revert to version{" "}
                <strong>{revertingVersion.versionName}</strong> from{" "}
                {new Date(revertingVersion.createdDate).toLocaleString()}.
              </p>
              <p className="text-sm text-muted-foreground">
                This will create a new version based on the selected version.
              </p>

              {/* Version comment */}
              <div className="space-y-2">
                <Label htmlFor="revertComment">Version Comment</Label>
                <Textarea
                  id="revertComment"
                  placeholder="Reason for reverting..."
                  value={versionComment}
                  onChange={(e) => setVersionComment(e.target.value)}
                  className="resize-none"
                  rows={3}
                  defaultValue={`Reverted to version ${revertingVersion.versionName}`}
                />
              </div>

              {/* Version type selection with radio buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Version Type</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="revertMinorVersion"
                      name="revertVersionType"
                      className="h-4 w-4"
                      checked={selectedVersionType === "MINOR"}
                      onChange={() => setSelectedVersionType("MINOR")}
                    />
                    <Label
                      htmlFor="revertMinorVersion"
                      className="cursor-pointer"
                    >
                      <span className="font-medium">Minor Version</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Next: {suggestedVersions.minor})
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="revertMajorVersion"
                      name="revertVersionType"
                      className="h-4 w-4"
                      checked={selectedVersionType === "MAJOR"}
                      onChange={() => setSelectedVersionType("MAJOR")}
                    />
                    <Label
                      htmlFor="revertMajorVersion"
                      className="cursor-pointer"
                    >
                      <span className="font-medium">Major Version</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Next: {suggestedVersions.major})
                      </span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRevertDialog(false);
                    setRevertingVersion(null);
                    setVersionComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmRevert}>Revert</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
