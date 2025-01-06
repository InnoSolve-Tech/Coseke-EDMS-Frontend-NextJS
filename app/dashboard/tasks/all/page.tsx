"use client";

import TaskForm from "@/components/task-form";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Add, Notifications } from "@mui/icons-material";
import { CssBaseline } from "@mui/joy";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import { CssVarsProvider } from "@mui/joy/styles";
import { useEffect, useState } from "react";
import { AxiosInstance } from "../../../../components/routes/api";
import { Task } from "../../../../components/task";
import { KanbanItem } from "../../Kanban/kanban-item";
import { KanbanColumn } from "../../Kanban/kanban-olumn";
import ActivityPage from "./ActivityPage";
import CalendarPage from "./CalendarPage";
import LeadsPage from "./List";

interface Column {
  id: string;
  title: string;
}

export default function Home() {
  const [activePage, setActivePage] = useState<string>("kanban");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns] = useState<Column[]>([
    { id: "contracted", title: "Contracted" },
    { id: "qualified", title: "Qualified" },
    { id: "closed", title: "Closed" },
  ]);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await AxiosInstance.get("tasks/api/v1/tasks/all");
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  const handlePageChange = (page: string) => setActivePage(page);

  const handleOpenForm = () => setOpen(true);
  const handleCloseForm = () => setOpen(false);

  const handleSubmitForm = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
    console.log(newTask);
    //handleCloseForm();
  };

  return (
    <CssVarsProvider>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header Section */}
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Navigation Buttons */}
            <Box sx={{ display: "flex", gap: 2 }}>
              {["list", "activities", "calendar", "kanban"].map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  variant={activePage === page ? "solid" : "outlined"}
                  color={activePage === page ? "primary" : "neutral"}
                  sx={{
                    textTransform: "capitalize",
                    fontWeight: activePage === page ? "bold" : "normal",
                    backgroundColor:
                      activePage === page ? "primary.softBg" : "transparent",
                    color:
                      activePage === page
                        ? "primary.solidColor"
                        : "neutral.plainColor",
                    borderColor:
                      activePage === page ? "primary.softColor" : "divider",
                    "&:hover": {
                      backgroundColor:
                        activePage === page
                          ? "primary.solidHoverBg"
                          : "neutral.softBg",
                      borderColor:
                        activePage === page
                          ? "primary.solidHoverColor"
                          : "divider",
                    },
                    transition: "all 0.3s ease",
                    borderRadius: "sm",
                    padding: "6px 12px",
                  }}
                >
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </Button>
              ))}
            </Box>

            {/* Action Icons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                size="sm"
                variant="solid"
                color="primary"
                onClick={handleOpenForm}
              >
                <Add />
              </IconButton>
              <IconButton size="sm" variant="outlined" color="neutral">
                <Notifications />
              </IconButton>
              <Avatar size="sm" src="/file.svg" />
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        {activePage === "list" && <LeadsPage />}
        {activePage === "activities" && <ActivityPage />}
        {activePage === "calendar" && <CalendarPage />}
        {activePage === "kanban" && (
          <DndContext>
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
                <KanbanItem
                  task={tasks.find((task) => task.id === activeId)!}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Task Form */}
        <TaskForm
          open={open}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
        />
      </Box>
    </CssVarsProvider>
  );
}
