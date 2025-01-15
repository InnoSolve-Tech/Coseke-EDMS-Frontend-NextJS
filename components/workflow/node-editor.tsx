"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllForms } from "@/core/forms/api";
import { toast } from "@/hooks/use-toast";
import { Form } from "@/lib/types/forms";
import { Workflow, WorkflowNode } from "@/lib/types/workflow";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { NodeAssignment } from "./node-assignment";
import { nodeTypes } from "./node-types";
import { DecisionConditions } from "./descision-conditions";
import { uuid } from "uuidv4";

interface NodeEditorProps {
  node: WorkflowNode;
  isOpen: boolean;
  workflow: Partial<Workflow>;
  onClose: () => void;
  onUpdate: (node: WorkflowNode) => void;
}

export function NodeEditor({
  node,
  workflow,
  isOpen,
  onClose,
  onUpdate,
}: NodeEditorProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [editedNode, setEditedNode] = useState<WorkflowNode>(node);
  const [precedingFormNodes, setPrecedingFormNodes] = useState<WorkflowNode[]>(
    [],
  );
  const nodeConfig = nodeTypes[node.type as keyof typeof nodeTypes];

  const handleSave = () => {
    onUpdate(editedNode);
    onClose();
  };

  const fetchForms = async () => {
    try {
      const response = await getAllForms();
      console.log(workflow);
      setForms(response);
      if (node.data.formId) {
        const form = response.find(
          (f) => f.id?.toString() === node.data.formId,
        );
        if (form) {
          setSelectedForm(form);
        }
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch forms. Please try again.",
        variant: "destructive",
      });
    }
  };

  const tracePrecedingForms = (
    currentNode: WorkflowNode,
    workflow: Partial<Workflow>,
    visited: Set<string> = new Set(),
  ): WorkflowNode[] => {
    if (!currentNode.id || visited.has(currentNode.id)) {
      return [];
    }
    visited.add(currentNode.id);

    const incomingEdges =
      workflow.edges?.filter((e) => e.target === currentNode.id) || [];
    const precedingNodes = incomingEdges
      .map((e) => workflow.nodes?.find((n) => n.id === e.source))
      .filter((n): n is WorkflowNode => n !== undefined);

    const formNodes: WorkflowNode[] = [];

    for (const node of precedingNodes) {
      if (node.type === "form") {
        formNodes.push(node);
      } else {
        const precedingForms = tracePrecedingForms(node, workflow, visited);
        formNodes.push(...precedingForms);
      }
    }

    return Array.from(
      new Map(formNodes.map((node) => [node.id, node])).values(),
    );
  };

  useEffect(() => {
    fetchForms();

    if (node.type === "decision") {
      const precedingFormNodes = tracePrecedingForms(node, workflow);
      setPrecedingFormNodes(precedingFormNodes);
    }
  }, [node, workflow]);

  const handleFormSelect = (formId: string) => {
    const selectedFormData = forms.find((f) => f.id?.toString() === formId);
    if (selectedFormData) {
      setSelectedForm(selectedFormData);
      setEditedNode({
        ...editedNode,
        data: {
          ...editedNode.data,
          formId: formId,
          form: selectedFormData,
        },
      });
    }
  };

  const handleConditionsChange = (condition: any[]) => {
    condition.map((cond) => ({ ...cond, id: uuid() }));
    setEditedNode({
      ...editedNode,
      data: { ...editedNode.data, condition },
    });
  };

  const renderFormOptions = () => {
    if (node.type === "form") {
      return forms.map((form) => (
        <SelectItem
          key={form.id?.toString() || ""}
          value={form.id?.toString() || ""}
        >
          {form.name || "Unnamed Form"}
        </SelectItem>
      ));
    } else {
      return precedingFormNodes.map((formNode) => (
        <SelectItem
          key={formNode.data.formId || ""}
          value={formNode.data.formId || ""}
        >
          {forms.find((f) => f.id?.toString() === formNode.data.formId)?.name ||
            "Unnamed Form"}
        </SelectItem>
      ));
    }
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
            {(node.type === "form" || node.type === "decision") && (
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
                  value={editedNode.data.label || ""}
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

          {node.type === "decision" && (
            <TabsContent value="conditions">
              <DecisionConditions
                conditions={editedNode.data.condition || []}
                onConditionsChange={handleConditionsChange}
                availableFields={
                  selectedForm?.formFields?.map((field: any) => field.name) ||
                  []
                }
              />
            </TabsContent>
          )}

          {(node.type === "form" || node.type === "decision") && (
            <TabsContent value="form">
              <Select
                value={editedNode.data.formId?.toString() || ""}
                onValueChange={handleFormSelect}
              >
                <SelectTrigger className="w-full my-10">
                  <SelectValue placeholder="Select a form" />
                </SelectTrigger>
                <SelectContent className="bg-white bg-opacity-100">
                  {renderFormOptions()}
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
