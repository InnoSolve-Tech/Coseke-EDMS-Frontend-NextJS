"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Role, User } from "@/lib/types/workflow";

// Mock data - replace with actual API calls
const mockRoles: Role[] = [
  { id: "1", name: "Manager", description: "Project Manager" },
  { id: "2", name: "Developer", description: "Software Developer" },
  { id: "3", name: "Reviewer", description: "Code Reviewer" },
];

const mockUsers: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com", roles: ["1"] },
  { id: "2", name: "Jane Smith", email: "jane@example.com", roles: ["2"] },
  { id: "3", name: "Bob Wilson", email: "bob@example.com", roles: ["3"] },
];

interface NodeAssignmentProps {
  value?: { type: "user" | "role"; id: string };
  onChange: (value: { type: "user" | "role"; id: string } | undefined) => void;
}

export function NodeAssignment({ value, onChange }: NodeAssignmentProps) {
  const [assignmentType, setAssignmentType] = useState<"user" | "role">(
    value?.type || "role"
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={assignmentType === "role" ? "default" : "outline"}
          onClick={() => setAssignmentType("role")}
        >
          Assign to Role
        </Button>
        <Button
          variant={assignmentType === "user" ? "default" : "outline"}
          onClick={() => setAssignmentType("user")}
        >
          Assign to User
        </Button>
      </div>

      <Select
        value={value?.id}
        onValueChange={(id) => onChange({ type: assignmentType, id })}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={`Select ${assignmentType === "role" ? "Role" : "User"}`}
          />
        </SelectTrigger>
        <SelectContent>
          {assignmentType === "role"
            ? mockRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))
            : mockUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>
    </div>
  );
}