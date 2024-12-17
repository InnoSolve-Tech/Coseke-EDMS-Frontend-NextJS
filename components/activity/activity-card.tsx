"use client";

import { Card, Typography, IconButton } from "@mui/joy";
import { DragHandle } from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ActivityCardProps {
  id: string;
  title: string;
  company?: string;
  responsible?: string;
}

export function ActivityCard({
  id,
  title,
  company,
  responsible,
}: ActivityCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        mb: 1,
        cursor: "grab",
        "&:hover": {
          boxShadow: "sm",
        },
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Typography level="title-sm">{title}</Typography>
          {company && (
            <Typography level="body-sm" color="neutral">
              {company}
            </Typography>
          )}
          {responsible && (
            <Typography level="body-xs" color="neutral">
              Responsible: {responsible}
            </Typography>
          )}
        </div>
        <IconButton
          {...attributes}
          {...listeners}
          variant="plain"
          color="neutral"
          size="sm"
        >
          <DragHandle />
        </IconButton>
      </div>
    </Card>
  );
}
