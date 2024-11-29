"use client";

import { useState } from 'react'
import Button from '@mui/joy/Button'
import AddIcon from '@mui/icons-material/Add'
import TaskTable from '../../../../components/task-table'
import TaskForm from '../../../../components/task-form'
import type { Task, TaskFormData } from '../../../../components/task'
import Card from '@mui/joy/Card'
import Typography from '@mui/joy/Typography'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PendingIcon from '@mui/icons-material/Pending'
import WorkIcon from '@mui/icons-material/Work'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleCreateTask = (formData: TaskFormData) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      status: 'pending',
      createdBy: 'Admin',
      priority: 'low',
      updatedAt: ''
    }
    setTasks([...tasks, newTask])
  }

  const handleEditTask = (task: Task) => {
    const taskIndex = tasks.findIndex(t => t.id === task.id)
    if (taskIndex !== -1) {
      const updatedTasks = [...tasks]
      updatedTasks[taskIndex] = {
        ...task,
        updatedAt: new Date().toISOString()
      }
      setTasks(updatedTasks)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const backlogTasks = tasks.filter(task => task.status === 'pending').length
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button
          startDecorator={<AddIcon />}
          onClick={() => setIsFormOpen(true)}
        >
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-2">
            <AssignmentIcon />
            <Typography level="h4">Total Tasks</Typography>
          </div>
          <Typography level="h2" className="mt-2">{tasks.length}</Typography>
        </Card>

        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-2">
            <PendingIcon />
            <Typography level="h4">Backlog</Typography>
          </div>
          <Typography level="h2" className="mt-2">{backlogTasks}</Typography>
        </Card>

        <Card variant="outlined" className="p-4">
          <div className="flex items-center gap-2">
            <WorkIcon />
            <Typography level="h4">In Progress</Typography>
          </div>
          <Typography level="h2" className="mt-2">{inProgressTasks}</Typography>
        </Card>
      </div>

      <TaskTable
        tasks={tasks}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
      />

      <TaskForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}
