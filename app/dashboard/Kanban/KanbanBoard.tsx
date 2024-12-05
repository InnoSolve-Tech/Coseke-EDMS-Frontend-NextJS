"use client";

import React, { useState } from 'react';
import { Draggable, DragDropContext } from 'react-beautiful-dnd';
import { Droppable } from 'react-beautiful-dnd';
import { Card, Box } from '@mui/joy';
import Typography from '@mui/joy/Typography';

import AttachMoney from '@mui/icons-material/AttachMoney';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AccessTime from '@mui/icons-material/AccessTime';

interface Task {
  id: string;
  title: string;
  amount: string;
  date: string;
  time: string;
  status: string;
}

interface ColumnProps {
  column: { id: string; title: string };
  tasks: Task[];
}

const DroppableColumn: React.FC<ColumnProps> = ({ column, tasks }) => {
  return (
    <Droppable droppableId={column.id}>
      {(provided: any) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {tasks
            .filter(task => task.status === column.id)
            .sort((a, b) => tasks.indexOf(a) - tasks.indexOf(b))
            .map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided: any) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{ mb: 1, cursor: 'grab' }}
                  >
                    <Typography level="title-sm">{task.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.tertiary' }}>
                      <AttachMoney sx={{ fontSize: 14, mr: 0.5 }} />
                      <Typography level="body-xs">{task.amount}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, color: 'text.tertiary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                        <Typography level="body-xs">{task.date}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                        <Typography level="body-xs">{task.time}</Typography>
                      </Box>
                    </Box>
                  </Card>
                )}
              </Draggable>
            ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default DroppableColumn;

