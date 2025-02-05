"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllForms } from "@/core/forms/api";
import { toast } from "@/hooks/use-toast";
import type { Form } from "@/lib/types/forms";
import type { Workflow, WorkflowNode } from "@/lib/types/workflow";
import { useEffect, useState } from "react";
import { uuid } from "uuidv4";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { DecisionConditions } from "./descision-conditions";
import { NodeAssignment } from "./node-assignment";
import { nodeTypes } from "./node-types";
import { NotificationsTab } from "./notifications-tab";

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
  const [ifTrueNode, setIfTrueNode] = useState<string | undefined>(
    node.data.ifTrue,
  );
  const [ifFalseNode, setIfFalseNode] = useState<string | undefined>(
    node.data.ifFalse,
  );
  const [shouldDelegate, setShouldDelegate] = useState(
    node.data.shouldDelegate,
  );

  const getConnectedNodes = () => {
    if (!workflow.edges) return [];
    return workflow.edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => workflow.nodes?.find((n) => n.id === edge.target))
      .filter((n): n is WorkflowNode => n !== undefined);
  };

  const handleSave = () => {
    const updatedNode = {
      ...editedNode,
      data: {
        ...editedNode.data,
        ifTrue: ifTrueNode,
        ifFalse: ifFalseNode,
        assignee: editedNode.data.assignee,
        shouldDelegate: shouldDelegate,
      },
    };
    onUpdate(updatedNode);
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

    // Get all incoming edges targeting the current node
    const incomingEdges =
      workflow.edges?.filter((e) => e.target === currentNode.id) || [];

    // Find all nodes connected as sources in these edges
    const precedingNodes = incomingEdges
      .map((e) => workflow.nodes?.find((n) => n.id === e.source))
      .filter((n): n is WorkflowNode => n !== undefined);

    // Collect all form nodes
    const formNodes: WorkflowNode[] = [];

    for (const node of precedingNodes) {
      if (node.type === "form" && node.data?.formId) {
        // If the node is a form, add it directly
        formNodes.push(node);
      }
      // Recur for all preceding nodes
      const precedingForms = tracePrecedingForms(node, workflow, visited);
      formNodes.push(...precedingForms);
    }

    // Remove duplicates by creating a map of nodes by their IDs
    return Array.from(
      new Map(formNodes.map((node) => [node.id, node])).values(),
    );
  };

  useEffect(() => {
    fetchForms();

    if (node.type === "decision" || node.type === "approval") {
      const precedingFormNodes = tracePrecedingForms(node, workflow);
      setPrecedingFormNodes(precedingFormNodes);
    }
  }, [node, workflow]); // Added fetchForms to dependencies

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

  const handleIfTrueChange = (nodeId: string) => {
    setIfTrueNode(nodeId);
    setEditedNode({
      ...editedNode,
      data: { ...editedNode.data, ifTrue: nodeId },
    });
  };

  const handleIfFalseChange = (nodeId: string) => {
    setIfFalseNode(nodeId);
    setEditedNode({
      ...editedNode,
      data: { ...editedNode.data, ifFalse: nodeId },
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

  const handleAssigneeChange = (
    assignee:
      | { assignee_type: "user" | "role"; assignee_id: string }
      | undefined,
  ) => {
    setEditedNode({
      ...editedNode,
      data: {
        ...editedNode.data,
        assignee: assignee || undefined,
      },
    });
  };

  const handleDelegateChange = (
    delegate:
      | { delegate_type: "user" | "role"; delegate_id: string }
      | undefined,
  ) => {
    setEditedNode({
      ...editedNode,
      data: {
        ...editedNode.data,
        delegate: delegate || undefined,
      },
    });
  };

  const handleShouldDelegateChange = (value: boolean) => {
    setShouldDelegate(value);
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
            {node.type === "decision" && (
              <TabsTrigger value="truefalse">True/False</TabsTrigger>
            )}
            {(node.type === "form" ||
              node.type === "decision" ||
              node.type === "approval") && (
              <TabsTrigger value="form">Form</TabsTrigger>
            )}
            {node.type === "notification" ? (
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            ) : null}
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
          {node.type === "decision" && (
            <TabsContent value="truefalse" className="space-y-4">
              <div className="grid w-full gap-4">
                <div>
                  <Label htmlFor="ifTrue">If True, go to:</Label>
                  <Select
                    value={ifTrueNode || ""}
                    onValueChange={handleIfTrueChange}
                  >
                    <SelectTrigger id="ifTrue" className="w-full mt-2">
                      <SelectValue placeholder="Select a node" />
                    </SelectTrigger>
                    <SelectContent className="bg-white bg-opacity-100">
                      {getConnectedNodes().map((n) => (
                        <SelectItem key={n.id} value={n.id || ""}>
                          {n.data.label || "Unnamed Node"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ifFalse">If False, go to:</Label>
                  <Select
                    value={ifFalseNode || ""}
                    onValueChange={handleIfFalseChange}
                  >
                    <SelectTrigger id="ifFalse" className="w-full mt-2">
                      <SelectValue placeholder="Select a node" />
                    </SelectTrigger>
                    <SelectContent className="bg-white bg-opacity-100">
                      {getConnectedNodes().map((n) => (
                        <SelectItem key={n.id} value={n.id || ""}>
                          {n.data.label || "Unnamed Node"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          )}

          {(node.type === "form" ||
            node.type === "decision" ||
            node.type === "approval") && (
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
          <TabsContent value="notifications">
            <NotificationsTab
              notification={editedNode.data.notification}
              onNotificationsChange={(notification) =>
                setEditedNode({
                  ...editedNode,
                  data: { ...editedNode.data, notification: notification },
                })
              }
            />
          </TabsContent>

          <TabsContent value="assignment">
            {node.type === "notification" ? (
              <div className="grid w-full gap-4 my-4">Message goes to?:</div>
            ) : null}

            <NodeAssignment
              assignee={editedNode.data.assignee}
              onAssigneeChange={handleAssigneeChange}
              shouldDelegate={shouldDelegate}
              onShouldDelegateChange={handleShouldDelegateChange}
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
