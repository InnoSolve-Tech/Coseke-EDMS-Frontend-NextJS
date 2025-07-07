"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, UserPlus } from "lucide-react";
import { toast } from "@/core/hooks/use-toast";

interface Department {
  id: number;
  departmentName: string;
  createdDate: string;
  lastModifiedDateTime: string;
}

export function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] =
    useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);

  const handleAddDepartment = () => {
    if (newDepartment) {
      const newDept: Department = {
        id: Date.now(),
        departmentName: newDepartment,
        createdDate: new Date().toISOString(),
        lastModifiedDateTime: new Date().toISOString(),
      };
      setDepartments([...departments, newDept]);
      setNewDepartment("");
      setIsAddDepartmentDialogOpen(false);
      toast({
        title: "Success",
        description: "New department created successfully.",
      });
    }
  };

  const handleDeleteDepartment = (id: number) => {
    setDepartments(departments.filter((dept) => dept.id !== id));
    toast({
      title: "Success",
      description: "Department deleted successfully.",
    });
  };

  const handleAddUserToDepartment = (departmentId: number) => {
    setSelectedDepartmentId(departmentId);
    setIsAddUserDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Organization Departments</h2>
        <Dialog
          open={isAddDepartmentDialogOpen}
          onOpenChange={setIsAddDepartmentDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddDepartment}>Add Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department Name</TableHead>
            <TableHead>Added Date</TableHead>
            <TableHead>Modified Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell>{department.departmentName}</TableCell>
              <TableCell>
                {new Date(department.createdDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(department.lastModifiedDateTime).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAddUserToDepartment(department.id)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteDepartment(department.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Department</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                User
              </Label>
              <Input
                id="user"
                placeholder="Enter user name or email"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                // Implement user addition logic here
                setIsAddUserDialogOpen(false);
                toast({
                  title: "Success",
                  description: "User added to department successfully.",
                });
              }}
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
