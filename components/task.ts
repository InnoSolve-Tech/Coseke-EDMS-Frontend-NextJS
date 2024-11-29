export interface Task {
    id: string
    name: string
    priority: 'low' | 'medium' | 'high'
    description: string
    createdDate: string
    startDate: string
    deadline: string
    weight: number
    timelineReason: string
    assignees: string[]
    roles: string[]
    createdBy: string
    status: 'pending' | 'in-progress' | 'completed'
  }
  
  export interface TaskFormData {
    name: string
    priority: string
    description: string
    createdDate: string
    startDate: string
    deadline: string
    weight: number
    timelineReason: string
    assignees: string[]
    roles: string[]
  }
  
  