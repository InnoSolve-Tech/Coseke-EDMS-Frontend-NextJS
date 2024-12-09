export interface Task {
    //id: string
    //name: string
    //title: string
    //assignee: string
    //priority: 'low' | 'medium' | 'high'
    //description: string
    //createdDate: string
    //updatedAt: string
    //startDate: string
    //deadline: string
    //weight: number
    //dueDate: string
    //timelineReason: string
    //assignees: string[]
    //roles: string[]
    //createdBy: string
    //status: 'contracted' | 'qualified' | 'Closed'
    id: string;
  title: string;
  amount: string;
  date: string;
  status: string;
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
  
  