import { Search, Plus, Settings2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskTable } from "../../../../components/activity/leads-table";
import { Task } from "@/components/task";

interface Lead {
  id: number;
  title: string;
  dueDate: string;
}

export default function LeadsPage() {
  function handleEdit(lead: Lead): void {
    const task: Task = {
      id: lead.id,
      title: "",
      description: "",
      dueDate: "",
      assignees: [],
      priority: "",
      status: "contracted",
      startDate: "",
      roles: [],
      timelineReason: "",
      deadline: "",
      date: "",
    };
    console.log("Editing task:", task);
  }

  function handleDelete(leadId: number): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main content */}
      <main className="flex-1">
        {/* Top navigation */}
        {/* Page header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Leads</h1>
            <div className="flex items-center gap-2">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                CREATE
              </Button>
              <Button variant="outline">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search leads..." className="pl-8" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-4">
          <TaskTable onEdit={handleEdit} onDelete={handleDelete} tasks={[]} />
        </div>
      </main>
    </div>
  );
}
