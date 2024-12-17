"use client";

import { useState } from "react";
import { Box, Button, Card, IconButton, Input, Typography } from "@mui/joy";
import { Add, Close } from "@mui/icons-material";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ActivityCard } from "./activity-card";

interface Activity {
  id: string;
  title: string;
  company?: string;
  responsible?: string;
  dueDate: string;
}

interface ActivityColumnProps {
  id: string;
  title: string;
  activities: Activity[];
  onAddActivity: (columnId: string, activity: Omit<Activity, "id">) => void;
}

export function ActivityColumn({
  id,
  title,
  activities,
  onAddActivity,
}: ActivityColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newActivity, setNewActivity] = useState("");
  const { setNodeRef } = useDroppable({ id });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivity.trim()) {
      onAddActivity(id, {
        title: newActivity,
        dueDate: new Date().toISOString(),
      });
      setNewActivity("");
      setIsAdding(false);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: 2,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 300,
        maxWidth: 350,
        height: "fit-content",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography level="title-lg">{title}</Typography>
        <Button
          startDecorator={<Add />}
          variant="plain"
          color="neutral"
          onClick={() => setIsAdding(true)}
        >
          Add
        </Button>
      </Box>

      {isAdding && (
        <Card variant="outlined">
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Input
                size="sm"
                placeholder="Activity title..."
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                autoFocus
                sx={{ flex: 1 }}
              />
              <IconButton
                size="sm"
                variant="plain"
                color="neutral"
                onClick={() => setIsAdding(false)}
              >
                <Close />
              </IconButton>
            </Box>
          </form>
        </Card>
      )}

      <SortableContext
        items={activities}
        strategy={verticalListSortingStrategy}
      >
        {activities.map((activity) => (
          <ActivityCard key={activity.id} {...activity} />
        ))}
      </SortableContext>
    </Card>
  );
}
