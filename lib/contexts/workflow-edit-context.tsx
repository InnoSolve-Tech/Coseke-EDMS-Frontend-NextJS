"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Workflow } from '@/lib/types/workflow'

interface WorkflowContextType {
  workflow: Partial<Workflow>
  updateWorkflow: (updates: Partial<Workflow>) => void
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<Partial<Workflow>>({
    name: "",
    description: "",
    nodes: [],
    edges: [],
  })

  const updateWorkflow = (updates: Partial<Workflow>) => {
    setWorkflow((prev) => ({ ...prev, ...updates }))
  }

  return (
    <WorkflowContext.Provider value={{ workflow, updateWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider')
  }
  return context
}

