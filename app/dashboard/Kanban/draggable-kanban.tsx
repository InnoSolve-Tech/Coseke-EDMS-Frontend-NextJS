"use client"

import React, { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent } from "@/components/ui/card"
import { CurrencyIcon as AttachMoney, CalendarIcon as CalendarToday, TimerIcon as AccessTime } from 'lucide-react'
import { SortableItem } from '../Kanban/sortable-item'

interface Task {
  id: string
  title: string
  amount: string
  date: string
  time: string
  status: string
}

interface ColumnProps {
  column: { id: string; title: string }
  tasks: Task[]
  onDragEnd: (event: DragEndEvent) => void
}

const DroppableColumn: React.FC<ColumnProps> = ({ column, tasks, onDragEnd }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={tasks.filter(task => task.status === column.id).map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks
          .filter(task => task.status === column.id)
          .map((task) => (
            <SortableItem key={task.id} id={task.id}>
              <Card className="mb-2 cursor-grab">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold">{task.title}</h3>
                  <div className="flex items-center mt-2 text-gray-500">
                    <AttachMoney className="w-4 h-4 mr-1" />
                    <span className="text-xs">{task.amount}</span>
                  </div>
                  <div className="flex justify-between mt-2 text-gray-500">
                    <div className="flex items-center">
                      <CalendarToday className="w-4 h-4 mr-1" />
                      <span className="text-xs">{task.date}</span>
                    </div>
                    <div className="flex items-center">
                      <AccessTime className="w-4 h-4 mr-1" />
                      <span className="text-xs">{task.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SortableItem>
          ))}
      </SortableContext>
    </DndContext>
  )
}

export default DroppableColumn

