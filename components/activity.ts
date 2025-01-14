export interface Activity {
  priority: string;
  description: string;
  startDate: string;
  deadline: string;
  dueDate: string;
  timelineReason: string;
  assignees: string[];
  roles: string[];
  id: number;
  title: string;
  date: string;
  activityStatus: "due-today" | "due-next-week" | "idle" | "due-this-week";
}
