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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Department {
  id: number;
  departmentName: string;
  createdDate: string;
  lastModifiedDateTime: string;
}

export function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
      setIsAddDialogOpen(false);
    }
  };

  const handleDeleteDepartment = (id: number) => {
    setDepartments(departments.filter((dept) => dept.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Organization Departments</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Department</Button>
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
            <Button onClick={handleAddDepartment}>Add Department</Button>
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
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteDepartment(department.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
