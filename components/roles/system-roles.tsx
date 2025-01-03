"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

interface Role {
  id: number;
  roleName: string;
}

const initialRoles: Role[] = [
  { id: 1, roleName: "Manager" },
  { id: 2, roleName: "User" },
  { id: 3, roleName: "Supervisor" },
  { id: 4, roleName: "Super_Admin" },
];

const initialPermissions = [
  {
    Name: "Dashboard",
    permissions: [
      { id: "1", permissionName: "READ_DASHBOARD", checked: false },
      { id: "2", permissionName: "CREATE_DASHBOARD", checked: false },
      { id: "3", permissionName: "UPDATE_DASHBOARD", checked: false },
      { id: "4", permissionName: "DELETE_DASHBOARD", checked: false },
    ],
  },
  {
    Name: "Users",
    permissions: [
      { id: "5", permissionName: "READ_USER", checked: false },
      { id: "6", permissionName: "CREATE_USER", checked: false },
      { id: "7", permissionName: "UPDATE_USER", checked: false },
      { id: "8", permissionName: "DELETE_USER", checked: false },
    ],
  },
  {
    Name: "Files",
    permissions: [
      { id: "9", permissionName: "READ_FILES", checked: false },
      { id: "10", permissionName: "CREATE_FILES", checked: false },
      { id: "11", permissionName: "UPDATE_FILES", checked: false },
      { id: "12", permissionName: "DELETE_FILES", checked: false },
    ],
  },
];

export function SystemRoles() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [permissionsByRole, setPermissionsByRole] =
    useState(initialPermissions);
  const [newRoleName, setNewRoleName] = useState("");
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      const roleId = parseInt(selectedRole);
      let newPermissions = [...initialPermissions];

      if (roleId === 1) {
        // Manager
        newPermissions = newPermissions.map((group) => ({
          ...group,
          permissions: group.permissions.map((perm) => ({
            ...perm,
            checked: perm.permissionName.startsWith("READ"),
          })),
        }));
      } else if (roleId === 4) {
        // Super_Admin
        newPermissions = newPermissions.map((group) => ({
          ...group,
          permissions: group.permissions.map((perm) => ({
            ...perm,
            checked: true,
          })),
        }));
      }

      setPermissionsByRole(newPermissions);
    }
  }, [selectedRole]);

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
  };

  const handlePermissionToggle = (groupName: string, permissionId: string) => {
    setPermissionsByRole((prevState) =>
      prevState.map((group) =>
        group.Name === groupName
          ? {
              ...group,
              permissions: group.permissions.map((perm) =>
                perm.id === permissionId
                  ? { ...perm, checked: !perm.checked }
                  : perm,
              ),
            }
          : group,
      ),
    );
  };

  const handleGroupToggle = (groupName: string, isChecked: boolean) => {
    setPermissionsByRole((prevState) =>
      prevState.map((group) =>
        group.Name === groupName
          ? {
              ...group,
              permissions: group.permissions.map((perm) => ({
                ...perm,
                checked: isChecked,
              })),
            }
          : group,
      ),
    );
  };

  const handleAddRole = () => {
    if (newRoleName.trim()) {
      const newRole: Role = {
        id: roles.length + 1,
        roleName: newRoleName.trim(),
      };
      setRoles([...roles, newRole]);
      setNewRoleName("");
      setIsAddRoleDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage Roles and Permissions</h2>
        <div className="flex items-center space-x-4">
          <Select onValueChange={handleRoleChange} value={selectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.roleName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog
            open={isAddRoleDialogOpen}
            onOpenChange={setIsAddRoleDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roleName" className="text-right">
                    Role Name
                  </Label>
                  <Input
                    id="roleName"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={handleAddRole}>Add Role</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {permissionsByRole.map((group) => (
          <Card
            key={group.Name}
            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <CardHeader className="bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  {group.Name}
                </CardTitle>
                <Switch
                  checked={group.permissions.every((perm) => perm.checked)}
                  onCheckedChange={(checked) =>
                    handleGroupToggle(group.Name, checked)
                  }
                  aria-label={`Toggle all ${group.Name} permissions`}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {group.permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={perm.checked}
                        onCheckedChange={() =>
                          handlePermissionToggle(group.Name, perm.id)
                        }
                        aria-label={perm.permissionName}
                      />
                      <Label htmlFor={perm.id} className="text-sm">
                        {perm.permissionName}
                      </Label>
                    </div>
                    <Badge variant={perm.checked ? "default" : "secondary"}>
                      {perm.checked ? "Granted" : "Denied"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
