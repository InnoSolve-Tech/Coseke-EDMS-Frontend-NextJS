"use client"

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanItem } from '../Kanban/kanban-item'
import { Task } from "../../../components/task";

interface KanbanColumnProps {
  column: { id: string; title: string }
  tasks: Task[]
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div className="bg-gray-100 p-4 rounded-lg w-80">
      <h2 className="text-lg font-bold mb-4">{column.title}</h2>
      <SortableContext
        id={column.id}
        items={tasks}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="min-h-[200px]">
          {tasks.map((task) => (
            <KanbanItem key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

