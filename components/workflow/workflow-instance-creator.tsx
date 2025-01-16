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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createWorkflowInstance,
  getAllWorkflowInstances,
  updateWorkflowInstance,
  updateWorkflowInstanceStep,
} from "@/core/workflowInstance/api";
import { getAllWorkflows } from "@/core/workflows/api";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types/user";
import { Edge, Workflow } from "@/lib/types/workflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getUserFromSessionStorage } from "../routes/sessionStorage";
import WorkflowFormRecord from "./workflow-form-record";
import { createFormRecord } from "@/core/formrecords/api";
import { FormRecord } from "@/lib/types/formRecords";

type WorkflowInstance = {
  id: number;
  workflowId: number;
  name: string;
  status: "Active" | "Completed" | "Suspended";
  startFormData?: Record<string, string>;
  currentStep?: string;
  workflow: Workflow;
  metadata: Record<string, string>;
};

const formSchema = z.object({
  workflowId: z.string().min(1, "Please select a workflow"),
  name: z.string().min(1, "Instance name is required"),
  startFormData: z.record(z.string()).optional(),
});

export default function WorkflowInstanceCreator() {
  const [workflowInstances, setWorkflowInstances] = useState<
    WorkflowInstance[]
  >([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null,
  );

  const [existingWorkflows, setExistingWorkflows] = useState<Workflow[]>([]);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState<any>();

  useEffect(() => {
    setUser(getUserFromSessionStorage());
  }, []);

  const closeDialog = () => {
    setSelectedInstanceId(null);
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

  const handleFormSubmit = async (
    formData: FormRecord,
  ): Promise<FormRecord | null> => {
    setIsSubmitting(true);
    try {
      const response = await createFormRecord(formData);
      console.log("Form record created:", response);
      toast({
        title: "Success",
        description: "Form record created successfully!",
      });
      setFormValues({});
      setSelectedForm(null);
      return response;
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to create form record. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const wfs = await getAllWorkflows();
        setExistingWorkflows(wfs);
        await fetchInstances();
      } catch (error) {
        console.error("Failed to fetch workflows:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch workflows",
        });
      }
    };

    fetchWorkflows();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workflowId: "",
      name: "",
      startFormData: {},
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const newInstance: any = {
        workflow: { id: parseInt(data.workflowId) },
        name: data.name,
        status: "Active",
      };
      await createWorkflowInstance(newInstance);
      await fetchInstances();
      form.reset();
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

  const handleWorkflowSelect = (workflowId: string) => {
    const workflow = existingWorkflows.find(
      (w) => w.id.toString() === workflowId,
    );
    setSelectedWorkflow(workflow || null);
  };

  const canInteractWithStep = (instance: any) => {
    if (!instance.currentStep) return false;

    const currentNode = instance.workflow.nodes.find(
      (node: any) => node.id === instance.currentStep,
    );

    if (!currentNode.data.assignee) return false;

    // Check user assignment
    if (currentNode.data.assignee.assignee_type === "user") {
      return parseInt(currentNode.data.assignee.assignee_id) === user?.id;
    }

    // Check role assignment
    if (currentNode.data.assignee.assignee_type === "role") {
      return user?.roles?.some(
        (role: any) =>
          role.id === parseInt(currentNode.data.assignee.assignee_id),
      );
    }

    return false;
  };

  const moveToNextStep = async (instance: WorkflowInstance) => {
    try {
      const possibleEdges = instance.workflow.edges.filter(
        (edge: Edge) => edge.source === instance.currentStep,
      );
      const currentNode = instance.workflow.nodes.find(
        (node) => node.id === instance.currentStep,
      );

      if (currentNode?.type === "form") {
        console.log("Submitting form");
        const formSubmitted = await handleFormSubmit({
          form: selectedForm,
          formFieldValues: Object.entries(formValues).map(
            ([fieldId, value]) => ({
              formField: { id: fieldId } as any,
              value,
            }),
          ),
          userId: user.id as number,
          createdBy: user.id,
          createdDate: new Date().toISOString(),
        } as FormRecord);

        if (!formSubmitted) {
          return;
        }
        instance.metadata[instance.currentStep!.toString()] =
          formSubmitted.id?.toString() || "";
        await updateWorkflowInstance(instance.id!.toString(), instance);
      }

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

      closeDialog();
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
      <CardHeader>
        <CardTitle>Workflow Instance Creator</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create">Create Instance</TabsTrigger>
            <TabsTrigger value="view">View Instances</TabsTrigger>
          </TabsList>
          <TabsContent value="create">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="workflowId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Workflow</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleWorkflowSelect(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a workflow" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white bg-opacity-100">
                          {existingWorkflows.map((workflow) => (
                            <SelectItem
                              key={workflow.id}
                              value={workflow.id.toString()}
                            >
                              <div className="flex items-center">
                                <span>{workflow.name}</span>
                              </div>
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
          </TabsContent>
          <TabsContent value="view">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Instance Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflowInstances &&
                  workflowInstances.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell>{instance.workflow?.name}</TableCell>
                      <TableCell>{instance.name}</TableCell>
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
                            <DialogTrigger>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 m-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                          )}
                          <DialogContent className="bg-white bg-opacity-100">
                            <DialogHeader>
                              <DialogTitle>Instance Details</DialogTitle>
                            </DialogHeader>
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
                              {instance.startFormData && (
                                <div>
                                  <h4 className="font-semibold">
                                    Start Form Data
                                  </h4>
                                  <div className="bg-muted p-4 rounded-md">
                                    {Object.entries(instance.startFormData).map(
                                      ([key, value]) => (
                                        <p key={key}>
                                          <strong>{key}:</strong> {value}
                                        </p>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
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
                                  instance.metadata["formInstanceId"]
                                }
                                workflowInstance={instance}
                                currentStep={instance.currentStep!}
                                forms={forms}
                                setForms={setForms}
                                selectedForm={selectedForm}
                                setSelectedForm={setSelectedForm}
                                formValues={formValues}
                                setFormValues={setFormValues}
                              />
                            )}
                            <Button
                              onClick={() => moveToNextStep(instance)}
                              disabled={!canInteractWithStep(instance)}
                            >
                              Move to Next Step
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
