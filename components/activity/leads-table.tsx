"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";
//import { toast } from "@/hooks/use-toast"
import axios from "axios";
import { Task } from "../../components/task";
import { toast } from "react-toastify";

interface TasksTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export function TaskTable({ tasks, onEdit, onDelete }: TasksTableProps) {
  async function handleDelete(leadId: number): Promise<void> {
    try {
      // Make API call to delete the lead
      await axios.delete(`/api/tasks/delete/${leadId}`);

      // Notify user of successful deletion
      toast.success("Lead deleted successfully");
    } catch (error: unknown) {
      // Handle error and provide feedback
      if (axios.isAxiosError(error)) {
        console.error(
          "Error deleting lead:",
          error.response?.data || error.message,
        );
      } else {
        console.error("Unexpected error:", error);
      }
      toast.error("Failed to delete lead");
    }
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task: Task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{task.title}</span>
                  <span className="text-sm text-muted-foreground">Call</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{task.description}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{task.assignees}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{task.date}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(task)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
