"use client";

import Table  from '@mui/joy/Table'
import  Button from '@mui/joy/Button'
import Checkbox  from '@mui/joy/Checkbox'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import  { Task }  from '../components/task'

interface TaskTableProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

export default function TaskTable({ tasks, onEdit, onDelete }: TaskTableProps) {
  return (
    <Table aria-label="Tasks table">
      <thead>
        <tr>
          <th style={{ width: 40 }}><Checkbox /></th>
          <th>Task Name</th>
          <th>Priority</th>
          <th>Deadline</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td><Checkbox /></td>
            {/*<td>{task.name}</td>
            <td>{task.priority}</td>
            <td>{new Date(task.deadline).toLocaleDateString()}</td>*/}
            <td>
              <Button
                size="sm"
                variant="plain"
                color="neutral"
                onClick={() => onEdit(task)}
                startDecorator={<EditIcon />}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="plain"
                color="danger"
                onClick={() => onDelete(task.id)}
                startDecorator={<DeleteIcon />}
              >
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

