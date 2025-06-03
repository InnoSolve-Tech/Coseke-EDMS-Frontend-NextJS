"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createWorkflowInstance,
  getAllWorkflowInstances,
  updateWorkflowInstance,
  updateWorkflowInstanceStep,
} from "@/core/workflowInstance/api";
import { getAllWorkflows } from "@/core/workflows/api";
import { useToast } from "@/hooks/use-toast";
import type { Edge, Workflow, WorkflowType } from "@/lib/types/workflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Circle, FileText, Flag, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getUserFromSessionStorage } from "../routes/sessionStorage";
import ViewFormRecord from "./view-form-record";
import WorkflowFormRecord from "./workflow-form-record";
type WorkflowInstance = {
  id: number;
  workflowId: number;
  priority: string;
  name: string;
  status: WorkflowType | "Completed" | "Active";
  startFormData?: Record<string, string>;
  currentStep: string;
  workflow: Workflow;
  metadata: Record<string, string>;
};

const priorities = [
  { value: "HIGH", label: "High", icon: AlertTriangle, color: "text-red-500" },
  { value: "MEDIUM", label: "Medium", icon: Flag, color: "text-yellow-500" },
  { value: "LOW", label: "Low", icon: Circle, color: "text-green-500" },
];

const formSchema = z.object({
  workflowId: z.string().min(1, "Please select a workflow"),
  name: z.string().min(1, "Instance name is required"),
  priority: z.string().min(1, "Priority is required"),
  startFormData: z.record(z.string()).optional(),
});

export default function WorkflowInstanceCreator() {
  const [workflowInstances, setWorkflowInstances] = useState<
    WorkflowInstance[]
  >([]);
  const [existingWorkflows, setExistingWorkflows] = useState<Workflow[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null,
  );
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [user, setUser] = useState<any>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workflowId: "",
      name: "",
      startFormData: {},
    },
  });

  useEffect(() => {
    setUser(getUserFromSessionStorage());
    fetchWorkflows();
    fetchInstances();
  }, [loading]);

  const fetchWorkflows = async () => {
    try {
      const wfs = await getAllWorkflows();
      setExistingWorkflows(wfs);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch workflows",
      });
    }
  };

  const fetchInstances = async () => {
    try {
      const wfI = await getAllWorkflowInstances();
      setWorkflowInstances(wfI);
    } catch (error) {
      console.error("Failed to fetch workflow instances:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch workflow instances",
      });
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const newInstance: any = {
        workflow: { id: Number.parseInt(data.workflowId) },
        name: data.name,
        priority: data.priority,
        status: "Active",
      };
      await createWorkflowInstance(newInstance);
      await fetchInstances();
      form.reset();
      setIsCreatingInstance(false);
      toast({
        title: "Success",
        description: "Workflow instance created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create workflow instance",
      });
    }
  };

  const canInteractWithStep = (instance: WorkflowInstance) => {
    if (!instance.currentStep) return false;

    const currentNode = instance.workflow.nodes.find(
      (node: any) => node.id === instance.currentStep,
    );

    if (!currentNode?.data.assignee) return false;

    if (currentNode.data.assignee.assignee_type === "user") {
      return (
        Number.parseInt(currentNode.data.assignee.assignee_id) === user?.id
      );
    }

    if (currentNode.data.assignee.assignee_type === "role") {
      return user?.roles?.some(
        (role: any) =>
          role.id === Number.parseInt(currentNode.data.assignee!.assignee_id),
      );
    }

    return false;
  };

  const moveToNextStep = async (instance: WorkflowInstance) => {
    try {
      const possibleEdges = instance.workflow.edges.filter(
        (edge: Edge) => edge.source === instance.currentStep,
      );

      // if (currentNode?.type === "form") {
      //   console.log("Submitting form");

      //   const formSubmitted = await handleFormSubmit(
      //     {
      //       form: selectedForm,
      //       formFieldValues: Object.entries(formValues).map(
      //         ([fieldId, value]) => ({
      //           formField: { id: fieldId } as any,
      //           value,
      //         }),
      //       ),
      //       userId: user.id as number,
      //       createdBy: user.id,
      //       createdDate: new Date().toISOString(),
      //     } as FormRecord,
      //     instance,
      //   );

      //   if (!formSubmitted) {
      //     return;
      //   }
      //   instance.metadata[instance.currentStep!.toString()] =
      //     formSubmitted.id?.toString() || "";
      //   await updateWorkflowInstance(instance.id!.toString(), instance);
      // }

      if (possibleEdges.length === 0) {
        const nextNode = instance.workflow.nodes.find(
          (node: any) => node.type === "end",
        );

        if (nextNode?.type === "end") {
          const updatedInstance = {
            ...instance,

            status: "Completed" as const,
          };
          await updateWorkflowInstance(instance.id.toString(), updatedInstance);
          await fetchInstances();
          toast({
            title: "Workflow Completed",
            description: "This workflow instance has reached its end node.",
          });
        } else {
          throw new Error("No valid paths found from current step");
        }
      } else if (possibleEdges.length === 1) {
        await updateWorkflowInstanceStep(
          instance.id.toString(),
          possibleEdges[0].target,
        );
        await fetchInstances();

        toast({
          title: "Step Updated",
          description: "Successfully moved to next step in workflow.",
        });
      } else {
        throw new Error(
          "Multiple possible paths found - conditional routing required",
        );
      }

      setSelectedInstanceId(null);
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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Processes</CardTitle>
        <Button onClick={() => setIsCreatingInstance(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Process
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Instance Name</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflowInstances.map((instance) => (
              <TableRow key={instance.id}>
                <TableCell>{instance.workflow?.name}</TableCell>
                <TableCell>{instance.name}</TableCell>
                <TableCell>
                  {" "}
                  <PriorityDisplay priority={instance.priority} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      instance.status === "Active"
                        ? "default"
                        : instance.status === "Completed"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {instance.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog
                    open={selectedInstanceId === instance.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setSelectedInstanceId(instance.id);
                      } else {
                        setSelectedInstanceId(null);
                      }
                    }}
                  >
                    {canInteractWithStep(instance) && (
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </DialogTrigger>
                    )}
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Instance Details</DialogTitle>
                      </DialogHeader>
                      {instance.status === "approval" ? (
                        <ViewFormRecord
                          instance={instance}
                          forms={forms}
                          setForms={setForms}
                          isLoading={loading}
                          setIsLoading={setLoading}
                          closeDialog={() => {
                            setSelectedInstanceId(null);
                            setSelectedForm(null);
                            setFormValues({});
                          }}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Workflow</h4>
                            <p>{instance.workflow?.name}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold">Instance Name</h4>
                            <p>{instance.name}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold">Status</h4>
                            <Badge
                              variant={
                                instance.status === "Active"
                                  ? "default"
                                  : instance.status === "Completed"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {instance.status}
                            </Badge>
                          </div>
                          {instance.workflow.nodes.find(
                            (node) => node.id === instance.currentStep,
                          )?.data.formId && (
                            <WorkflowFormRecord
                              formId={
                                instance.workflow.nodes.find(
                                  (node) => node.id === instance.currentStep,
                                )?.data.formId
                              }
                              formInstanceId={
                                instance.metadata[instance.currentStep!]
                              }
                              workflowInstance={instance}
                              currentStep={instance.currentStep!}
                              forms={forms}
                              setForms={setForms}
                              selectedForm={selectedForm}
                              setSelectedForm={setSelectedForm}
                              moveToNextStep={moveToNextStep}
                              formValues={formValues}
                              setFormValues={setFormValues}
                            />
                          )}
                          {instance.workflow.nodes.find(
                            (node) => node.id === instance.currentStep,
                          )?.type === "form" ? null : (
                            <Button
                              onClick={() => moveToNextStep(instance)}
                              disabled={!canInteractWithStep(instance)}
                            >
                              Move to Next Step
                            </Button>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={isCreatingInstance} onOpenChange={setIsCreatingInstance}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Workflow Instance</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="workflowId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Workflow</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a workflow" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {existingWorkflows.map((workflow) => (
                          <SelectItem
                            key={workflow.id}
                            value={workflow.id.toString()}
                          >
                            {workflow.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Priority
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800">
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md bg-white shadow-lg dark:bg-gray-800">
                        {priorities.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                            className="flex items-center space-x-2 py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <span className="flex items-center space-x-2">
                              <priority.icon
                                className={`h-4 w-4 ${priority.color}`}
                              />
                              <span>{priority.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instance Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter instance name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Create Workflow Instance</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Separate component for priority display
function PriorityDisplay({ priority }: { priority: string }) {
  const priorityInfo =
    priorities.find((p) => p.value === priority) || priorities[2]; // Default to LOW if not found

  return (
    <div className="flex items-center space-x-2">
      <priorityInfo.icon className={`h-4 w-4 ${priorityInfo.color}`} />
      <span>{priorityInfo.label}</span>
    </div>
  );
}
