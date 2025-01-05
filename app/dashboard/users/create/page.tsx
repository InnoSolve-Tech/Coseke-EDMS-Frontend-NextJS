"use client";

import { useState, useEffect } from "react";
import { columns } from "@/components/user/columns";
import { DataTable } from "@/components/user/data-table";
import { UserDialog } from "@/components/user/user-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { getAllUsers } from "@/core/authentication/api";
import { deleteUser } from "@/core/users";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = () => {
    setIsAddUserOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleRemoveUser = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId);
        setUsers(users.filter((user) => user.id !== userId));
        toast({
          title: "Success",
          description: "User deleted successfully.",
        });
      } catch (error) {
        console.error("Error removing user:", error);
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All users ({users.length})</h1>
        <div className="flex space-x-2">
          <div className="relative max-w-sm">
            <Input placeholder="Search users" className="pl-10" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          <Button onClick={handleAddUser}>
            <Plus className="mr-2 h-4 w-4" /> Add user
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns(handleEditUser, handleRemoveUser)}
        data={users}
        onEdit={handleEditUser}
        onDelete={handleRemoveUser}
      />

      <UserDialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSubmit={fetchUsers}
      />

      <UserDialog
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        onSubmit={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
