"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { Role, User } from "@/lib/types/user";
import { getAllRoles, getAllUsers } from "@/core/authentication/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface NodeAssignmentProps {
  assignee?: { assignee_type: "user" | "role"; assignee_id: string };
  shouldDelegate: boolean;
  onAssigneeChange: (
    value: { assignee_type: "user" | "role"; assignee_id: string } | undefined,
  ) => void;
  onShouldDelegateChange: (value: boolean) => void;
}

export function NodeAssignment({
  assignee,
  shouldDelegate,
  onAssigneeChange,
  onShouldDelegateChange,
}: NodeAssignmentProps) {
  const [assignmentType, setAssignmentType] = useState<"user" | "role">(
    assignee?.assignee_type || "role",
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    assignee?.assignee_id,
  );

  // Fetch roles and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roles, users] = await Promise.all([
          getAllRoles(),
          getAllUsers(),
        ]);
        setRoles(roles);
        setUsers(users);
      } catch (error) {
        console.error("Error fetching roles or users:", error);
      }
    };
    fetchData();
  }, []);

  // Update selectedId and delegate info when props change
  useEffect(() => {
    setSelectedId(assignee?.assignee_id);
    setAssignmentType(assignee?.assignee_type || "role");
  }, [assignee]);

  // Handle assignment type switch
  const handleAssignmentTypeChange = (type: "user" | "role") => {
    setAssignmentType(type);
    setSelectedId(undefined);
    onAssigneeChange({ assignee_type: type, assignee_id: "" });
  };

  // Handle selection change
  const handleSelectionChange = (assignee_id: string) => {
    setSelectedId(assignee_id);
    onAssigneeChange({ assignee_type: assignmentType, assignee_id });
  };

  // Handle delegate node checkbox change
  const handleDelegateNodeChange = (checked: boolean) => {
    onShouldDelegateChange(checked);
  };

  return (
    <div className="space-y-4">
      {/* Buttons for selecting assignment type */}
      <div className="flex gap-2">
        <Button
          variant={assignmentType === "role" ? "default" : "outline"}
          onClick={() => handleAssignmentTypeChange("role")}
        >
          Assign to Role
        </Button>
        <Button
          variant={assignmentType === "user" ? "default" : "outline"}
          onClick={() => handleAssignmentTypeChange("user")}
        >
          Assign to User
        </Button>
      </div>

      {/* Select dropdown for roles or users */}
      <Select value={selectedId} onValueChange={handleSelectionChange}>
        <SelectTrigger>
          <SelectValue
            placeholder={`Select ${assignmentType === "role" ? "Role" : "User"}`}
          />
        </SelectTrigger>
        <SelectContent>
          {assignmentType === "role"
            ? roles &&
              roles.map((role) => (
                <SelectItem
                  className="text-black"
                  key={role.id}
                  value={role.id!.toString()}
                >
                  {role?.name
                    .split(" ")
                    .map((word) =>
                      word
                        .toLowerCase()
                        .split("_")
                        .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
                        .join(" "),
                    )
                    .join(" ")}
                </SelectItem>
              ))
            : users &&
              users.map((user) => (
                <SelectItem
                  key={user.id}
                  className="text-black"
                  value={user.id.toString()}
                >
                  {`${user.last_name?.toLowerCase().charAt(0).toUpperCase() + user.last_name?.slice(1)} ${user.first_name?.toLowerCase().charAt(0).toUpperCase() + user.first_name.slice(1)}`}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>

      {/* Delegate Node Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="delegateNode"
          checked={shouldDelegate}
          onCheckedChange={handleDelegateNodeChange}
        />
        <Label htmlFor="delegateNode">Delegate Node</Label>
      </div>
    </div>
  );
}
