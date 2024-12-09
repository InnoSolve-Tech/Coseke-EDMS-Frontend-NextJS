"use client";

import React, { useState } from "react";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { Box, IconButton, Avatar, Chip } from "@mui/joy";
import { Notifications, Add } from "@mui/icons-material";
import TaskTable from "@/components/task-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { SortableItem } from "../../Kanban/sortable-item";
import TaskForm from "@/components/task-form";
import { KanbanColumn } from "../../Kanban/kanban-olumn";
import { KanbanItem } from "../../Kanban/kanban-item";

// Placeholder components for new pages
const ActivitiesPage = () => (
  <Box className="p-4">
    <h2>Activities Page</h2>
    {/* Add your activities page content here */}
  </Box>
);

const CalendarPage = () => (
  <Box className="p-4">
    <h2>Calendar Page</h2>
    {/* Add your calendar page content here */}
  </Box>
);

interface Task {
  id: string;
  title: string;
  amount: string;
  date: string;
  time: string;
  status: string;
}

interface Column {
  id: string;
  title: string;
}

export default function Home() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<string>("kanban");
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Mobile Shelter Installation for Uganda Electricity Generation Company (UEGCL)",
      amount: "USh1,915,720,546",
      date: "July 1",
      time: "2:00 PM",
      status: "contacted",
    },
    {
      id: "2",
      title: "Hunger project - Digitization, EDMS, Hardware",
      amount: "USh760,901,425",
      date: "October 14",
      time: "22 Minutes ago",
      status: "qualified",
    },
    {
      id: "3",
      title: "Madini-Integrated system, Training Hardware",
      amount: "USh0",
      date: "October 14",
      time: "1 Hour ago",
      status: "closed",
    },
  ]);

  const [columns] = useState<Column[]>([
    { id: "contacted", title: "Contacted" },
    { id: "qualified", title: "Qualified" },
    { id: "closed", title: "Closed" },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items] = useState(["kanban", "list", "activities", "calendar"]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handlePageChange = (page: string) => {
    setActivePage(page);
    
    // Add navigation logic for different pages
    switch (page) {
      case "list":
        router.push("#task-table");
        break;
      case "activities":
        router.push("#activities");
        break;
      case "calendar":
        router.push("#calendar");
        break;
      case "kanban":
        router.push("#kanban");
        break;
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const destinationColumn = columns.find((column) => column.id === over.id)?.id;

      if (destinationColumn) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === active.id ? { ...task, status: destinationColumn } : task
          )
        );
      }
    }
    setActiveId(null);
  };

  const handleOpenForm = () => setOpen(true);
  const handleCloseForm = () => setOpen(false);

  const handleSubmitForm = (formData: any) => {
    console.log(formData);
    handleCloseForm();
  };

  const handleHeaderDragEnd = (event: { active: any; over: any }) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      // Note: We're not modifying the state here, just simulating drag
      console.log(`Moved ${active.id} from index ${oldIndex} to ${newIndex}`);
    }
  };

  return (
    <CssVarsProvider>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header Section */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleHeaderDragEnd}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                <SortableContext items={items} strategy={horizontalListSortingStrategy}>
                  {items.map((item) => (
                    <SortableItem key={item} id={item}>
                      <Chip
                        variant={activePage === item ? "soft" : "outlined"}
                        color={activePage === item ? "primary" : "neutral"}
                        onClick={() => handlePageChange(item)}
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </Chip>
                    </SortableItem>
                  ))}
                </SortableContext>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="sm" variant="solid" color="primary" onClick={handleOpenForm}>
                  <Add />
                </IconButton>
                <IconButton size="sm" variant="outlined" color="neutral">
                  <Notifications />
                </IconButton>
                <Avatar size="sm" src="/placeholder-user.jpg" />
              </Box>
            </Box>
          </DndContext>
        </Box>

        {/* Content Sections */}
        {activePage === "list" && (
          <TaskTable
            tasks={tasks}
            onEdit={(task) => {
              console.log("Editing task:", task);
            }}
            onDelete={(taskId) => {
              console.log("Deleting task with ID:", taskId);
              setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
            }}
          />
        )}

        {activePage === "activities" && <ActivitiesPage />}

        {activePage === "calendar" && <CalendarPage />}

        {activePage === "kanban" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Box className="flex gap-4 p-4">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={tasks.filter((task) => task.status === column.id)}
                />
              ))}
            </Box>
            <DragOverlay>
              {activeId ? (
                <KanbanItem task={tasks.find((task) => task.id === activeId)!} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Task Form */}
        <TaskForm open={open} onClose={handleCloseForm} onSubmit={handleSubmitForm} />
      </Box>
    </CssVarsProvider>
  );
}