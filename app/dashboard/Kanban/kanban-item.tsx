"use client"

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from "@/components/ui/card"
import { CurrencyIcon as AttachMoney, CalendarIcon as CalendarToday, TimerIcon as AccessTime } from 'lucide-react'

interface Task {
  id: string
  title: string
  amount: string
  date: string
  time: string
  status: string
}

interface KanbanItemProps {
  task: Task
}

export function KanbanItem({ task }: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
    </div>
  )
}

