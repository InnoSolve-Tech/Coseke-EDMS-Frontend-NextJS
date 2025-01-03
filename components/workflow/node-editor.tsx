"use client";

import { WorkflowNode } from "@/lib/types/workflow";
import { useEffect, useState } from "react";
import CreateFormRecord from "../forms/Active/CreateFormRecord";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { NodeAssignment } from "./node-assignment";
import { TaskForm } from "./node-forms";
import { nodeTypes } from "./node-types";
import { getAllForms } from "@/core/forms/api";
import { Form } from "@/lib/types/forms";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NodeEditorProps {
  node: WorkflowNode;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (node: WorkflowNode) => void;
}

export function NodeEditor({
  node,
  isOpen,
  onClose,
  onUpdate,
}: NodeEditorProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [editedNode, setEditedNode] = useState<WorkflowNode>(node);
  const nodeConfig = nodeTypes[node.type as keyof typeof nodeTypes];

  const handleSave = () => {
    onUpdate(editedNode);
    onClose();
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await getAllForms();
        setForms(response);
      } catch (error) {
        console.error("Error fetching forms:", error);
        toast({
          title: "Error",
          description: "Failed to fetch forms. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchForms();
  }, []);

  const handleFormSelect = (formId: string) => {
    const form = forms.find((f) => f.id === parseInt(formId));
    setSelectedForm(form || null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white bg-opacity-100 text-black max-h-[700px] min-h-[300px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <nodeConfig.icon className="h-5 w-5" />
            Edit {nodeConfig.label}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {node.type === "decision" && (
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
            )}
            {node.type === "form" && (
              <TabsTrigger value="form">Form</TabsTrigger>
            )}
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={editedNode.data.label}
                  onChange={(e) =>
                    setEditedNode({
                      ...editedNode,
                      data: { ...editedNode.data, label: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid w-full gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedNode.data.description || ""}
                  onChange={(e) =>
                    setEditedNode({
                      ...editedNode,
                      data: { ...editedNode.data, description: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {node.type === "form" && (
            <TabsContent value="form">
              <Select onValueChange={handleFormSelect}>
                <SelectTrigger className="w-full my-10">
                  <SelectValue placeholder="Select a form" />
                </SelectTrigger>
                <SelectContent className="bg-white bg-opacity-100">
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id!.toString()}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          )}

          <TabsContent value="assignment">
            <NodeAssignment
              value={editedNode.data.assignee}
              onChange={(assignee) =>
                setEditedNode({
                  ...editedNode,
                  data: { ...editedNode.data, assignee },
                })
              }
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
