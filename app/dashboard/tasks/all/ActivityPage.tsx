"use client";

import React, { useState } from "react";
import { KanbanColumn } from "../../Kanban/kanban-olumn";
import { Task } from "../../../../components/task";
import { Box, Typography, Input, Button } from "@mui/joy";
import { Search, Add } from "@mui/icons-material";

const ActivitiesPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Scanner Hire Services",
      status: "contracted",
      description: "Work with Scanner Hire Services",
      date: "16/09/2022",
      assignees: ["Samuel Nalwebc"],
      priority: "low",
      dueDate: "17/08/2023",
      deadline: "17/08/2023",
      startDate: "16/08/2022",
      timelineReason: "many reasons",
      roles: ["manager"],
    },
    {
      id: 2,
      title: "Pride Microfinance EDRMS",
      status: "Closed",
      description: "Field visit to Pride Microfinance for a business meeting",
      date: "17/01/2023",
      assignees: ["Fredrick Rwakiguma"],
      priority: "low",
      dueDate: "17/08/2023",
      deadline: "17/08/2023",
      startDate: "16/08/2022",
      timelineReason: "many reasons",
      roles: ["manager"],
    },
    {
      id: 3,
      title: "UIA Digitization of Procurement records",
      status: "qualified",
      description: "No activities",
      date: "",
      assignees: ["Untitled"],
      priority: "low",
      dueDate: "17/08/2023",
      deadline: "17/08/2023",
      startDate: "16/08/2022",
      timelineReason: "many reasons",
      roles: ["manager"],
    },
  ]);

  const columns = [
    { id: "due-today", title: "Due today" },
    { id: "due-this-week", title: "Due this week" },
    { id: "due-next-week", title: "Due next week" },
    { id: "idle", title: "Idle" },
  ];

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.surface",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography level="h4">Activities</Typography>
          <Input
            size="sm"
            placeholder="Search activities..."
            startDecorator={<Search />}
            sx={{ width: 300 }}
          />
        </Box>
        <Button startDecorator={<Add />}>Add Activity</Button>
      </Box>

      {/* Kanban Board */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 4,
          p: 4,
        }}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(
              (task) => task.status === column.id.replace("-", " "),
            )}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ActivitiesPage;
