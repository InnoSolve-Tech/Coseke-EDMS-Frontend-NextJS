"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NodeAssignment } from "./node-assignment";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { WorkflowNode } from "@/lib/types/workflow";
import { nodeTypes } from "./node-types";
import { TaskForm, DecisionForm, ParallelForm } from "./node-forms";

interface NodeEditorProps {
  node: WorkflowNode;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (node: WorkflowNode) => void;
}

export function NodeEditor({ node, isOpen, onClose, onUpdate }: NodeEditorProps) {
  const [editedNode, setEditedNode] = useState<WorkflowNode>(node);
  const nodeConfig = nodeTypes[node.type as keyof typeof nodeTypes];

  const handleSave = () => {
    onUpdate(editedNode);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white bg-opacity-100 text-black">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <nodeConfig.icon className="h-5 w-5" />
            Edit {nodeConfig.label}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {node.type === "task" && <TabsTrigger value="form">Form</TabsTrigger>}
            {node.type === "decision" && <TabsTrigger value="conditions">Conditions</TabsTrigger>}
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

          {node.type === "task" && (
            <TabsContent value="form">
              <TaskForm
                fields={editedNode.data.form?.fields || []}
                onUpdate={(fields) =>
                  setEditedNode({
                    ...editedNode,
                    data: {
                      ...editedNode.data,
                      form: { 
                        ...editedNode.data.form, 
                        id: editedNode.data.form?.id || crypto.randomUUID(),
                        fields: fields.map(field => ({
                          ...field,
                          type: field.type as "number" | "checkbox" | "date" | "text" | "select",
                          id: crypto.randomUUID()
                        }))
                      },
                    },
                  })
                }
              />
            </TabsContent>
          )}

{node.type === "parallel" && (
            <TabsContent value="branches">
              <ParallelForm
                branches={editedNode.data.branches?.map((branch: string | { id: string; label: string }) => ({
                  id: typeof branch === 'string' ? branch : branch.id,
                  label: typeof branch === 'string' ? branch : branch.label,
                  name: typeof branch === 'string' ? branch : branch.label
                })) || []}
                onUpdate={(branches) =>
                  setEditedNode({
                    ...editedNode,
                    data: { ...editedNode.data, branches: branches.map(branch => branch.id) },
                  })
                }
              />
            </TabsContent>
          )}

          {node.type === "decision" && (
            <TabsContent value="conditions">
              <DecisionForm
                conditions={(editedNode.data.conditions || []).map(c => ({
                  field: c.field,
                  operator: c.operator,
                  value: c.value,
                  id: crypto.randomUUID()
                }))}
                fields={editedNode.data.form?.fields || []}
                onUpdate={(conditions) =>
                  setEditedNode({
                    ...editedNode,
                    data: { ...editedNode.data, conditions: conditions.map(c => ({
                      ...c,
                      id: crypto.randomUUID()
                    })) },
                  })
                }
              />
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
