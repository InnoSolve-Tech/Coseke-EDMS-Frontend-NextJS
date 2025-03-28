"use client";

import { useState, useRef, useEffect } from "react";
import {
  Trash,
  Edit,
  Send,
  PlusCircle,
  Save,
  MoreVertical,
  Check,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input as UiInput } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button as UiButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentTypeCreation } from "@/components/folder/DocumentTypes";
import type { User } from "@/lib/types/user";
import { getUserFromSessionStorage } from "@/components/routes/sessionStorage";
import { addComment, updateComment, deleteComment } from "../files/api";
import { useToast } from "@/hooks/use-toast";

interface MetadataItem {
  name: string;
  type: string;
  value: string;
  options?: any;
}

interface Comment {
  id: number;
  documentId: number;
  userId: number;
  content: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userPhone: string;
  createdAt: string;
  updatedAt: string;
}

interface IDocumentType {
  id: number;
  name: string;
  metadata: MetadataItem[];
}

interface FileSidebarProps {
  document: any;
  setDocument: (doc: any) => void;
  documentTypes: IDocumentType[];
  setDocumentTypes: (types: IDocumentType[]) => void;
  handleMetadataChange: (key: string, value: string) => void;
  handleDeleteMetadata: (key: string) => void;
  handleSubmit: () => void;
  currentDocTypeId: string | null;
  handleDocumentTypeChange: (value: string) => void;
}

export function FileSidebar({
  document,
  setDocument,
  documentTypes,
  setDocumentTypes,
  handleMetadataChange,
  handleDeleteMetadata,
  handleSubmit,
  currentDocTypeId,
  handleDocumentTypeChange,
}: FileSidebarProps) {
  const [showMetadataUpdate, setShowMetadataUpdate] = useState(false);
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [newMetadata, setNewMetadata] = useState<MetadataItem>({
    name: "",
    type: "text",
    value: "",
    options: null,
  });
  const [metadata, setMetadata] = useState<Record<string, string>>(
    document?.metadata || {},
  );

  // Initialize activeTab from localStorage or default to "details"
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem(`sidebar-tab-${document?.id}`);
      return savedTab || "details";
    }
    return "details";
  });

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get current user
  const currentUser: User = getUserFromSessionStorage();
  const currentUserId = currentUser?.id;

  // Cache for user information
  const [usersCache, setUsersCache] = useState<Record<number, string>>({});

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (document?.id) {
      localStorage.setItem(`sidebar-tab-${document.id}`, activeTab);
    }
  }, [activeTab, document?.id]);

  // Scroll to bottom of comments when new comment is added
  useEffect(() => {
    if (activeTab === "comments" && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [document?.comments, activeTab]);

  // Function to get user name by ID
  const getUserName = (userId: number) => {
    // Return from cache if available
    if (usersCache[userId]) {
      return usersCache[userId];
    }

    // If it's the current user, use their name
    if (userId === currentUserId && currentUser?.name) {
      // Ensure the name is a string before adding to cache
      const userName = String(currentUser.name);
      setUsersCache((prev) => ({ ...prev, [userId]: userName }));
      return userName;
    }

    // Fallback to user ID if name is not available
    return `User ${userId}`;
  };

  const handleAddMetadata = () => {
    if (!document || !newMetadata.name.trim()) return;

    setDocument({
      ...document,
      metadata: {
        ...document.metadata,
        [newMetadata.name]: newMetadata.value || " ", // Ensure a visible value
      },
    });

    // Reset input fields
    setNewMetadata({ name: "", type: "text", value: "" });
  };

  const handleAddComment = async () => {
    if (!document || !newComment.trim()) return;

    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to add comments",
        variant: "destructive",
      });
      return;
    }

    try {
      const addedComment = await addComment(
        document.id,
        newComment,
        currentUserId,
      );

      setDocument({
        ...document,
        comments: [...(document.comments || []), addedComment],
      });

      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editedCommentText.trim() || !currentUserId) return;

    try {
      const updatedComment = {
        id: commentId,
        documentId: document.id,
        userId: currentUserId,
        content: editedCommentText,
        userEmail: currentUser.email,
        userFirstName: currentUser.first_name,
        userLastName: currentUser.last_name,
        userPhone: currentUser.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateComment(
        commentId,
        updatedComment.content,
        updatedComment.userId,
      );

      // Update the comment in the local state
      setDocument({
        ...document,
        comments: document.comments.map((comment: Comment) =>
          comment.id === commentId ? updatedComment : comment,
        ),
      });

      setEditingCommentId(null);
      setEditedCommentText("");

      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast({
        title: "Error",
        description: "You are not authorized to update this comment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!currentUserId) return;

    try {
      await deleteComment(commentId, currentUserId);

      // Ensure document.comments exists before filtering
      setDocument((prevDoc: { comments: any[] }) => ({
        ...prevDoc,
        comments:
          prevDoc?.comments?.filter(
            (comment: Comment) => comment.id !== commentId,
          ) || [],
      }));

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast({
        title: "Error",
        description: "You are not authorized to delete this comment",
        variant: "destructive",
      });
    }
  };

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U"; // Default initials
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Format date for comments
  const formatCommentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      // Format the date and time
      const formattedDate = date.toLocaleDateString();
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

      return `${formattedDate} at ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  // Check if the current user is the author of a comment
  const isCommentAuthor = (comment: Comment) => {
    return comment.userId === currentUserId;
  };

  return (
    <aside className="w-72 border-l bg-background flex flex-col h-[calc(100vh-64px)] mt-16 overflow-hidden">
      <Tabs
        defaultValue={activeTab}
        className="flex-1 flex flex-col"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3 bg-background">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="comments" className="relative">
            Comments
            {document?.comments?.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 bg-primary text-primary-foreground"
              >
                {document.comments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="details" className="h-full">
            <div className="p-4">
              <Card className="shadow-none border-0">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Document Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <div className="space-y-2">
                    <UiLabel htmlFor="documentName">Document Name</UiLabel>
                    <UiInput
                      id="documentName"
                      value={document.filename || ""}
                      onChange={(e) =>
                        handleMetadataChange("filename", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <UiLabel htmlFor="documentType">Document Type</UiLabel>
                    <UiSelect
                      value={currentDocTypeId || ""}
                      onValueChange={handleDocumentTypeChange}
                    >
                      <SelectTrigger id="documentType">
                        <SelectValue placeholder="Select a document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </UiSelect>
                  </div>

                  {/* Metadata Section with Matching Styles */}
                  {document.metadata &&
                    Object.keys(document.metadata).length > 0 && (
                      <div className="mt-4 p-4 border rounded-md bg-muted/30">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium">Metadata</h3>
                          <UiButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("metadata")}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </UiButton>
                        </div>
                        <ScrollArea className="h-auto max-h-60 pr-2">
                          {Object.entries(document.metadata).map(
                            ([key, value]) => (
                              <div key={key} className="flex items-center mb-2">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    {key}
                                  </p>
                                  <p className="text-sm">{value as string}</p>
                                </div>
                              </div>
                            ),
                          )}
                        </ScrollArea>
                      </div>
                    )}

                  <div className="space-y-2">
                    <UiLabel>Created Date</UiLabel>
                    <p className="text-sm">
                      {new Date(document.createdDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <UiLabel>Last Modified</UiLabel>
                    <p className="text-sm">
                      {new Date(document.lastModifiedDateTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <UiLabel>Version</UiLabel>
                    <p className="text-sm">{document.version || "1.0"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="h-full">
            <div className="p-4">
              <Card className="shadow-none border-0">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  {showMetadataUpdate ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                        {Object.entries(document.metadata || {}).length > 0 ? (
                          Object.entries(document.metadata || {}).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center space-x-2 mb-3 group"
                              >
                                <div className="flex-1 space-y-1">
                                  <UiLabel
                                    htmlFor={`metadata-${key}`}
                                    className="text-xs"
                                  >
                                    {key}
                                  </UiLabel>
                                  <UiInput
                                    id={`metadata-${key}`}
                                    value={value as string}
                                    onChange={(e) =>
                                      handleMetadataChange(key, e.target.value)
                                    }
                                    className="h-9"
                                  />
                                </div>
                                <UiButton
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteMetadata(key)}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </UiButton>
                              </div>
                            ),
                          )
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No metadata fields available</p>
                            <p className="text-sm">Add new fields below</p>
                          </div>
                        )}
                      </ScrollArea>

                      <Separator className="my-4" />

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Add New Field</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <UiLabel
                              htmlFor="newMetadataName"
                              className="text-xs"
                            >
                              Field Name
                            </UiLabel>
                            <UiInput
                              id="newMetadataName"
                              value={newMetadata.name}
                              onChange={(e) =>
                                setNewMetadata({
                                  ...newMetadata,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Enter field name"
                            />
                          </div>
                          <div className="space-y-1">
                            <UiLabel
                              htmlFor="newMetadataValue"
                              className="text-xs"
                            >
                              Field Value
                            </UiLabel>
                            <UiInput
                              id="newMetadataValue"
                              value={newMetadata.value}
                              onChange={(e) =>
                                setNewMetadata({
                                  ...newMetadata,
                                  value: e.target.value,
                                })
                              }
                              placeholder="Enter field value"
                            />
                          </div>
                        </div>
                        <UiButton
                          onClick={handleAddMetadata}
                          disabled={!newMetadata.name.trim()}
                          className="w-full"
                          variant="outline"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                        </UiButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ScrollArea className="h-[calc(100vh-350px)]">
                        <DocumentTypeCreation
                          onCreate={(newDocType) => {
                            setDocumentTypes([...documentTypes, newDocType]);
                            setShowDocTypeDialog(false);
                          }}
                          onCancel={() => setShowDocTypeDialog(false)}
                        />
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4 px-0 mt-4">
                  {showMetadataUpdate ? (
                    <>
                      <UiButton
                        variant="outline"
                        onClick={() => setShowMetadataUpdate(false)}
                      >
                        Cancel
                      </UiButton>
                      <UiButton
                        onClick={handleSubmit}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                      </UiButton>
                    </>
                  ) : (
                    <UiButton
                      className="w-full"
                      onClick={() => setShowMetadataUpdate(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Update Metadata
                    </UiButton>
                  )}
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="flex flex-col h-full">
            <div className="p-4 flex flex-col h-full">
              <Card className="flex flex-col h-full shadow-none border-0">
                {/* Comments area with scroll - make sure it doesn't take all available space */}
                <CardContent className="flex-1 overflow-y-auto pt-3 pb-1 px-0 max-h-[400px] scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-gray-300">
                  {document?.comments?.length > 0 ? (
                    document.comments.map((comment: Comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start gap-3 mb-4"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${comment.userId}`}
                          />
                          <AvatarFallback>
                            {getInitials(
                              `${comment.userFirstName} ${comment.userLastName}`,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">{`${comment.userFirstName} ${comment.userLastName}`}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatCommentDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm bg-muted p-2 rounded-md">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No comments yet</p>
                    </div>
                  )}
                </CardContent>

                {/* Comment input area - explicitly set as flex-shrink-0 to prevent it from disappearing */}
                <CardFooter className="border-t pt-3 pb-3 bg-background z-10 px-0 flex-shrink-0">
                  <form
                    className="flex w-full items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddComment();
                    }}
                  >
                    <div className="flex-1">
                      <Textarea
                        id="newComment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="min-h-[40px] max-h-[80px] resize-none text-sm"
                      />
                    </div>
                    <UiButton
                      type="submit"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </UiButton>
                  </form>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
