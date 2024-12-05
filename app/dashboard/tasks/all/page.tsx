"use client";

import React, { useState } from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { Box, IconButton, Avatar, Chip } from '@mui/joy';
import { Notifications, Add, Task } from '@mui/icons-material';
import KanbanBoard from '../../Kanban/KanbanBoard';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TaskForm from '@/components/task-form';
import router from 'next/router';

const tasks = [
  {
    id: "1",
    title: "Mobile Shelter Installation for Uganda Electricity Generation Company (UEGCL)",
    amount: "USh1,915,720,546",
    date: "July 1",
    time: "2:00 PM",
    status: "contacted"
  },
  {
    id: "2",
    title: "Hunger project -Digitization,EDMS,Hard ware",
    amount: "USh760,901,425",
    date: "October 14",
    time: "22 Minutes ago",
    status: "qualified"
  },
  {
    id: "3",
    title: "Madini-Integrated system,Training Hardware",
    amount: "USh0",
    date: "October 14",
    time: "1 Hour ago",
    status: "closed"
  }
];

export default function Home() {
  const [open, setOpen] = useState(false);

  const handleOpenForm = () => {
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
  };

  const handleSubmitForm = (formData: any) => {
    console.log(formData); // Handle the submitted form data
    handleCloseForm();
  };

  const onDragEnd = (result: { destination: any }) => {
    if (!result.destination) return;
  };

  return (
    <CssVarsProvider>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="chips" direction="horizontal">
              {(provided : any) => (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Draggable draggableId="kanban" index={0}>
                      {(provided : any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Chip variant="soft" color="primary">Kanban</Chip>
                        </div>
                      )}
                    </Draggable>
                    <Draggable draggableId="list" index={1}>
                      {(provided :any ) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Chip 
                            variant="outlined"
                            color="neutral"
                            onClick={() => router.push('/tasks/table')}
                          >
                            List
                          </Chip>
                        </div>
                      )}
                    </Draggable>
                    <Draggable draggableId="activities" index={2}>
                      {(provided: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Chip variant="outlined" color="neutral">Activities</Chip>
                        </div>
                      )}
                    </Draggable>
                    <Draggable draggableId="calendar" index={3}>
                      {(provided: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Chip variant="outlined" color="neutral">Calendar</Chip>
                        </div>
                      )}
                    </Draggable>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    <Avatar size="sm" src="/placeholder-user.jpg" />
                  </Box>
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
        <KanbanBoard tasks={tasks} column={{
          id: '',
          title: ''
        }} />
        <TaskForm open={open} onClose={handleCloseForm} onSubmit={handleSubmitForm} />
      </Box>
    </CssVarsProvider>
  );
}
