"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { getFormRecordById } from "@/core/formrecords/api";
import { getAllForms } from "@/core/forms/api";
import {
  updateWorkflowInstance,
  updateWorkflowInstanceStep,
} from "@/core/workflowInstance/api";
import { useToast } from "@/hooks/use-toast";
import { FormRecord } from "@/lib/types/formRecords";
import { Form } from "@/lib/types/forms";
import { Edge, WorkflowNode } from "@/lib/types/workflow";
import { WorkflowInstance } from "@/lib/types/workflowInstance";
import { useEffect, useState } from "react";

const ViewFormRecord = ({
  instance,
  forms,
  setForms,
}: {
  instance: WorkflowInstance;
  forms: Form[];
  setForms: (forms: Form[]) => void;
}) => {
  const [selectedForm, setSelectedForm] = useState<Form>();
  const [formValues, setFormValues] = useState<{ [key: string]: string }>({});
  const [nodeWithForm, setNodeWithForm] = useState<WorkflowNode>();
  const { toast } = useToast();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    try {
      if (instance.metadata) {
        instance.metadata[instance.currentStep] = rejectionReason;
      }
      await updateWorkflowInstance(instance.id!.toString(), instance);
      await updateWorkflowInstanceStep(
        instance.id!.toString(),
        nodeWithForm!.id,
      );
      toast({
        title: "Rejected",
        description: `The form has been rejected.`,
      });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while rejecting the form.",
        type: "foreground",
      });
    }
  };

  const fetchForms = async () => {
    try {
      let response = await getAllForms();
      setForms(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching forms.",
        type: "foreground",
      });
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchFormRecord = async (formId: string) => {
    try {
      // Fetch form record based on formId
      const response: FormRecord = await getFormRecordById(Number(formId));
      const formFieldValues = response.formFieldValues.reduce(
        (acc, field) => {
          acc[field.formField.name] = field.value;
          return acc;
        },
        {} as { [key: string]: string },
      );
      console.log(formFieldValues);
      setFormValues(formFieldValues);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching the form record.",
        type: "foreground",
      });
    }
  };

  const moveToNextStep = async (instance: WorkflowInstance) => {
    try {
      const possibleEdges = instance.workflow.edges.filter(
        (edge: Edge) => edge.source === instance.currentStep,
      );
      if (possibleEdges.length === 0) {
        const nextNode = instance.workflow.nodes.find(
          (node: any) => node.type === "end",
        );

        if (nextNode?.type === "end") {
          const updatedInstance = {
            ...instance,
            status: "Completed" as const,
          };
          await updateWorkflowInstance(
            instance.id!.toString(),
            updatedInstance,
          );
          toast({
            title: "Workflow Completed",
            description: "This workflow instance has reached its end node.",
          });
        } else {
          throw new Error("No valid paths found from current step.");
        }
      } else if (possibleEdges.length === 1) {
        await updateWorkflowInstanceStep(
          instance.id!.toString(),
          possibleEdges[0].target,
        );
        toast({
          title: "Step Updated",
          description: "Successfully moved to next step in workflow.",
        });
      } else {
        throw new Error(
          "Multiple possible paths found - conditional routing required",
        );
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to progress workflow",
      });
    }
  };

  useEffect(() => {
    let node: WorkflowNode = instance.workflow.nodes.find(
      (node) => node.id === instance.currentStep,
    )!;
    let selectedForm = forms.find((form) => form.id == node.data.formId);
    setSelectedForm(forms.find((form) => form.id == node.data.formId));
    let nodeWithForm = instance.workflow.nodes.find(
      (node) => node.data.formId == selectedForm?.id && node.type == "form",
    );
    setNodeWithForm(nodeWithForm);
    let formRecordId: string = nodeWithForm
      ? (instance.metadata?.[nodeWithForm.id] ?? "")
      : "";
    fetchFormRecord(formRecordId);
  }, [forms]);

  const handleApprove = async () => {
    await moveToNextStep(instance);
  };

  return (
    <div>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">
          {selectedForm && selectedForm.name}
        </h2>
        {selectedForm && selectedForm.description}
        {selectedForm && (
          <div className="space-y-4">
            {formValues &&
              selectedForm.formFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`}>{field.name}</Label>
                  {field.type.toLowerCase() === "select" ? (
                    <Select disabled value={formValues[field.name]}>
                      <SelectTrigger
                        id={`field-${field.id}`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.selectOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`field-${field.id}`}
                      type={field.type.toLowerCase()}
                      value={formValues[field.name]}
                      readOnly
                      className="w-full bg-gray-100"
                    />
                  )}
                </div>
              ))}
          </div>
        )}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            onClick={handleApprove}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
          <Button onClick={handleReject} variant="destructive">
            Reject
          </Button>
        </div>
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Form</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Reason for Rejection</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewFormRecord;
