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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Role {
  id: number;
  roleName: string;
}

interface Permission {
  id: string;
  permissionName: string;
  checked: boolean;
}

interface PermissionGroup {
  Name: string;
  permissions: Permission[];
}

const initialRoles: Role[] = [
  { id: 1, roleName: "Manager" },
  { id: 2, roleName: "User" },
  { id: 3, roleName: "Supervisor" },
  { id: 4, roleName: "Super_Admin" },
];

const initialPermissions: PermissionGroup[] = [
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
  const [permissionsByRole, setPermissionsByRole] = useState<
    Record<number, PermissionGroup[]>
  >({});
  const [newRoleName, setNewRoleName] = useState("");
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);

  const initializePermissionsForRole = (roleId: number) => {
    return initialPermissions.map((group) => ({
      ...group,
      permissions: group.permissions.map((perm) => ({
        ...perm,
        checked: false,
      })),
    }));
  };

  useEffect(() => {
    const initialPermissionsByRole: Record<number, PermissionGroup[]> = {};
    roles.forEach((role) => {
      initialPermissionsByRole[role.id] = initializePermissionsForRole(role.id);
    });
    setPermissionsByRole(initialPermissionsByRole);
  }, [roles]);

  useEffect(() => {
    if (selectedRole) {
      const roleId = parseInt(selectedRole);
      let newPermissions =
        permissionsByRole[roleId] || initializePermissionsForRole(roleId);

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

      setPermissionsByRole((prev) => ({ ...prev, [roleId]: newPermissions }));
    }
  }, [selectedRole]);

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
  };

  const handlePermissionToggle = (groupName: string, permissionId: string) => {
    if (!selectedRole) return;

    const roleId = parseInt(selectedRole);
    setPermissionsByRole((prevState) => ({
      ...prevState,
      [roleId]: prevState[roleId].map((group) =>
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
    }));
  };

  const handleGroupToggle = (groupName: string, isChecked: boolean) => {
    if (!selectedRole) return;

    const roleId = parseInt(selectedRole);
    setPermissionsByRole((prevState) => ({
      ...prevState,
      [roleId]: prevState[roleId].map((group) =>
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
    }));
  };

  const handleAddRole = () => {
    if (newRoleName.trim()) {
      const newRole: Role = {
        id: Math.max(...roles.map((r) => r.id)) + 1,
        roleName: newRoleName.trim(),
      };
      setRoles((prevRoles) => [...prevRoles, newRole]);
      setPermissionsByRole((prevState) => ({
        ...prevState,
        [newRole.id]: initializePermissionsForRole(newRole.id),
      }));
      setNewRoleName("");
      setIsAddRoleDialogOpen(false);
    }
  };

  const handleDeleteRole = () => {
    if (selectedRole) {
      const roleId = parseInt(selectedRole);
      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
      setPermissionsByRole((prevState) => {
        const newState = { ...prevState };
        delete newState[roleId];
        return newState;
      });
      setSelectedRole(undefined);
      setIsDeleteRoleDialogOpen(false);
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
              <DialogFooter>
                <Button onClick={handleAddRole}>Add Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog
            open={isDeleteRoleDialogOpen}
            onOpenChange={setIsDeleteRoleDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center"
                disabled={!selectedRole}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Role
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to delete this role?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  role and remove its permissions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRole}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {selectedRole && permissionsByRole[parseInt(selectedRole)] && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {permissionsByRole[parseInt(selectedRole)].map((group) => (
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
      )}
    </div>
  );
}
