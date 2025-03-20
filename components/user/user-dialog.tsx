import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Role } from "@/lib/types/user";
import { getAllRoles } from "@/core/authentication/api";
import { createUser, updateUser } from "@/core/users";

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  user?: User | null;
}

export function UserDialog({
  isOpen,
  onClose,
  onSubmit,
  user,
}: UserDialogProps) {
  const [userData, setUserData] = useState<User>({
    id: 0,
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    roles: [],
    name: "",
  });
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (user) {
      setUserData(user);
    } else {
      setUserData({
        id: 0,
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        roles: [],
        name: "",
      });
    }
    fetchRoles();
  }, [user]);

  const fetchRoles = async () => {
    try {
      const rolesRes = await getAllRoles();
      setAvailableRoles(rolesRes);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user) {
        await updateUser(user.id, userData);
      } else {
        await createUser({
          ...userData,
          roles: userData.roles.map((r) => r.id),
        });
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error("Error submitting user data:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (roleId: string) => {
    const selectedRole = availableRoles.find(
      (r) => r.id!.toString() === roleId,
    );
    if (selectedRole) {
      setUserData((prevData) => ({
        ...prevData,
        roles: [selectedRole],
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                value={userData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                value={userData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={userData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={userData.password}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={userData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={userData.address}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={userData.roles[0]?.id!.toString()}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id!.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            {user ? "Update User" : "Add User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
