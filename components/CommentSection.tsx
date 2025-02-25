"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Box, Typography, Input, Button, List, ListItem } from "@mui/joy";
import { ListItemText } from "@mui/material";

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  user: string;
}

interface CommentSectionProps {
  documentId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  documentId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    // Fetch comments for the document
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      // Replace with actual API call
      const response = await fetch(`/api/comments?documentId=${documentId}`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      // Replace with actual API call
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, text: newComment }),
      });
      const addedComment = await response.json();
      setComments([...comments, addedComment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Box>
      <Typography level="h4" sx={{ fontSize: "1rem", fontWeight: 600, mb: 2 }}>
        Comments
      </Typography>
      <List>
        {comments.map((comment) => (
          <ListItem key={comment.id}>
            <ListItemText
              primary={comment.text}
              secondary={`${comment.user} - ${new Date(comment.createdAt).toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: "flex", mt: 2 }}>
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          sx={{ flexGrow: 1, mr: 1 }}
        />
        <Button onClick={handleAddComment}>Post</Button>
      </Box>
    </Box>
  );
};
