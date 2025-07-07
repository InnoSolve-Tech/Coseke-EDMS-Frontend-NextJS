"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  addPermissionToRole,
  createRole,
  deleteRole,
  listRoles,
  removePermissionFromRole,
  updateMultiplePermissions,
  getAllPermissions,
} from "@/core/roles";
import { toast } from "@/core/hooks/use-toast";
import { Permission, Role } from "@/lib/types/user";
import { PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function SystemRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await listRoles();
      setRoles(response);
      setError(null);
    } catch (err) {
      setError("Failed to fetch roles");
      toast({
        title: "Error",
        description: "Failed to fetch roles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const permissions = await getAllPermissions();
      setAllPermissions(permissions);
    } catch (err) {
      console.error("Error fetching all permissions:", err);
      toast({
        title: "Error",
        description: "Failed to fetch all permissions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = (roleId: string) => {
    const role = roles.find((r) => r.id!.toString() === roleId);
    setSelectedRole(role || null);
  };

  const handleAddRole = async () => {
    if (newRoleName.trim()) {
      setIsLoading(true);
      try {
        const response = await createRole({
          name: newRoleName.trim(),
          permissions: [],
        });
        setRoles((prevRoles) => [...prevRoles, response]);
        setNewRoleName("");
        setIsAddRoleDialogOpen(false);
        toast({
          title: "Success",
          description: "New role created successfully.",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to create new role. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteRole = async () => {
    if (selectedRole) {
      setIsLoading(true);
      try {
        await deleteRole(selectedRole.id!);
        setRoles((prevRoles) =>
          prevRoles.filter((role) => role.id !== selectedRole.id),
        );
        setSelectedRole(null);
        setIsDeleteRoleDialogOpen(false);
        toast({
          title: "Success",
          description: "Role deleted successfully.",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to delete role. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePermissionToggle = async (
    permissionId: number,
    isChecked: boolean,
  ) => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      if (isChecked) {
        await addPermissionToRole(selectedRole.id!, permissionId);
      } else {
        await removePermissionFromRole(selectedRole.id!, permissionId);
      }
      setSelectedRole((prevRole) => {
        if (!prevRole) return null;
        const updatedPermissions = isChecked
          ? [...prevRole.permissions, { id: permissionId, name: "" }]
          : prevRole.permissions.filter((p) => p.id !== permissionId);
        return { ...prevRole, permissions: updatedPermissions };
      });
      toast({
        title: "Success",
        description: `Permission ${isChecked ? "added to" : "removed from"} role.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${isChecked ? "add" : "remove"} permission. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupToggle = async (
    groupPermissions: Permission[],
    isChecked: boolean,
  ) => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await updateMultiplePermissions(selectedRole.id!, {
        permissions: groupPermissions,
        status: isChecked,
      });
      setSelectedRole((prevRole) => {
        if (!prevRole) return null;
        const updatedPermissions = isChecked
          ? [
              ...new Set([
                ...prevRole.permissions,
                ...groupPermissions.map((gp) => ({ ...gp })),
              ]),
            ]
          : prevRole.permissions.filter(
              (p) => !groupPermissions.some((gp) => gp.id === p.id),
            );
        return { ...prevRole, permissions: updatedPermissions };
      });
      toast({
        title: "Success",
        description: `Permissions ${isChecked ? "added to" : "removed from"} role.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to update permissions. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const groupPermissionsByType = (
    permissions: Permission[],
  ): Record<string, Permission[]> => {
    return permissions.reduce(
      (acc, permission) => {
        const type = permission.name.split("_")[1] || "Other";
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>,
    );
  };

  const groupedPermissions = groupPermissionsByType(allPermissions);

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage Roles and Permissions</h2>
        <div className="flex items-center space-x-4">
          <Select
            onValueChange={handleRoleChange}
            value={selectedRole?.id!.toString()}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {roles &&
                roles.map((role) => (
                  <SelectItem key={role.id} value={role.id!.toString()}>
                    {role.name}
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
      {selectedRole && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedPermissions).map(([type, permissions]) => (
            <Card
              key={type}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader className="bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {type}
                  </CardTitle>
                  <Switch
                    checked={permissions.every((perm) =>
                      selectedRole.permissions.some((p) => p.id === perm.id),
                    )}
                    onCheckedChange={(checked) =>
                      handleGroupToggle(permissions, checked)
                    }
                    aria-label={`Toggle all ${type} permissions`}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${type}_${perm.id}`}
                          checked={selectedRole.permissions.some(
                            (p) => p.id === perm.id,
                          )}
                          onCheckedChange={(checked) =>
                            handlePermissionToggle(perm.id, checked as boolean)
                          }
                          aria-label={perm.name}
                        />
                        <Label
                          htmlFor={`${type}_${perm.id}`}
                          className="text-sm"
                        >
                          {perm.name.split("_")[2] || perm.name}
                        </Label>
                      </div>
                      <Badge
                        variant={
                          selectedRole.permissions.some((p) => p.id === perm.id)
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedRole.permissions.some((p) => p.id === perm.id)
                          ? "Granted"
                          : "Denied"}
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
