import { Activity } from 'lucide-react'

const activities = [
  { id: 1, user: "John Doe", action: "uploaded", item: "Q3 Financial Report.pdf", time: "2 hours ago" },
  { id: 2, user: "Jane Smith", action: "created", item: "New Project Folder", time: "4 hours ago" },
  { id: 3, user: "Mike Johnson", action: "completed", item: "Document Review Workflow", time: "Yesterday" },
  { id: 4, user: "Sarah Williams", action: "commented on", item: "Meeting Minutes.docx", time: "2 days ago" },
  { id: 5, user: "Chris Brown", action: "deleted", item: "Outdated Presentation.pptx", time: "3 days ago" },
]

export function RecentActivities() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4">
          <div className="bg-blue-100 rounded-full p-2">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {activity.user} {activity.action} <span className="font-semibold">{activity.item}</span>
            </p>
            <p className="text-xs text-gray-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

