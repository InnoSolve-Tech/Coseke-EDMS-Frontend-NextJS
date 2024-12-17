export interface Task {
  priority: string;
  description: string;
  startDate: string;
  deadline: string;
  dueDate: string;
  timelineReason: string;
  assignees: string[];
  roles: string[];
  status: "contracted" | "qualified" | "Closed";
  id: number;
  title: string;
  date: string;
}

export interface TaskFormData {
  name: string;
  priority: string;
  description: string;
  createdDate: string;
  startDate: string;
  deadline: string;
  weight: number;
  timelineReason: string;
  assignees: string[];
  roles: string[];
}
