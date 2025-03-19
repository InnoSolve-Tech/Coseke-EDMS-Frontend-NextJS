"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Clock, MessageSquare, Download } from "lucide-react";

interface Version {
  id: string;
  timestamp: string;
  author: string;
  changes?: string;
  fileUrl: string;
}

interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: string;
  replies?: Comment[];
}

interface VersionHistoryProps {
  documentId: number;
  initialVersions?: Version[];
  initialComments?: Record<string, Comment[]>;
  onVersionSelect: (versionId: string) => void;
}

export function VersionHistory({
  documentId,
  initialVersions = [],
  initialComments = {},
  onVersionSelect,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>(
    initialVersions && initialVersions.length > 0
      ? initialVersions
      : [
          {
            id: "v1",
            timestamp: new Date().toISOString(),
            author: "System",
            changes: "Initial version",
            fileUrl: "",
          },
        ],
  );

  const [comments, setComments] =
    useState<Record<string, Comment[]>>(initialComments);
  const [selectedVersion, setSelectedVersion] = useState<string>(
    versions[0].id,
  );
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersion(versionId);
    onVersionSelect(versionId);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date().toISOString(),
      author: "Current User", // Replace with actual user info
    };

    const versionComments = comments[selectedVersion] || [];
    const updatedComments = {
      ...comments,
      [selectedVersion]: [...versionComments, comment],
    };

    setComments(updatedComments);
    setNewComment("");

    toast({
      title: "Success",
      description: "Comment added successfully",
    });
  };

  const handleDownloadVersion = (version: Version) => {
    // In a real implementation, you would download the specific version
    // For this example, we'll just open the URL
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

  return (
    <div className="grid gap-6 h-full">
      <div className="grid gap-2">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          <h3 className="text-lg font-medium">Version History</h3>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="space-y-1">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                  version.id === selectedVersion
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleVersionSelect(version.id)}
              >
                <div>
                  <div className="font-medium">{version.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(version.timestamp).toLocaleString()} by{" "}
                    {version.author}
                  </div>
                  {version.changes && (
                    <div className="text-xs">{version.changes}</div>
                  )}
                </div>
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
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      <div className="grid gap-2 flex-1">
        <div className="flex items-center">
          <MessageSquare className="mr-2 h-4 w-4" />
          <h3 className="text-lg font-medium">Comments on {selectedVersion}</h3>
        </div>
        <ScrollArea className="flex-1 h-[200px]">
          <div className="space-y-4">
            {(comments[selectedVersion] || []).length > 0 ? (
              (comments[selectedVersion] || []).map((comment) => (
                <div key={comment.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm">{comment.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.timestamp).toLocaleString()} by{" "}
                    {comment.author}
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
    </div>
  );
}
