"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { editWorkflow } from "@/core/workflows/api";
import { useWorkflow } from "@/lib/contexts/workflow-edit-context";
import { Edge, Workflow } from "@/lib/types/workflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Workflow name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

export function WorkflowForm() {
  const { workflow, updateWorkflow } = useWorkflow();
  const initialWorkflowRef = useRef(workflow);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workflow?.name || "",
      description: workflow?.description || "",
    },
  });

  useEffect(() => {
    if (
      workflow?.name !== initialWorkflowRef.current?.name ||
      workflow?.description !== initialWorkflowRef.current?.description
    ) {
      initialWorkflowRef.current = workflow;
      form.reset({
        name: workflow?.name || "",
        description: workflow?.description || "",
      });
    }
  }, [workflow, form]);

  const traceEdges = (edges: Edge[], start: any, end: any): boolean => {
    if (!start || !end) {
      return false;
    }

    if (edges.length === 0) {
      return false;
    }

    const visited = new Set<string>();
    const queue: string[] = [start.id];

    while (queue.length > 0) {
      const currentNode = queue.shift()!;

      if (currentNode === end.id) {
        return true;
      }

      visited.add(currentNode);
      const connectedEdges = edges.filter(
        (edge) => edge.source === currentNode,
      );

      for (const edge of connectedEdges) {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }
    return false;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let wf = {
        ...workflow,
        ...values,
      };

      if (wf.nodes!.filter((node: any) => node.type === "start").length === 0) {
        throw new Error("Workflow must have a start node.");
      }

      let start = wf.nodes!.find((node: any) => node.type === "start");

      if (wf.nodes!.filter((node: any) => node.type === "end").length === 0) {
        throw new Error("Workflow must have an end node.");
      }

      let end = wf.nodes!.find((node: any) => node.type === "end");
      let edges = wf.edges;

      if (!traceEdges(edges!, start, end)) {
        throw new Error("Workflow must have a path from start to end.");
      }

      if (
        wf.nodes!.map((node: any) => node.data.assignee).includes(null) ||
        wf.nodes!.map((node: any) => node.data.assignee).includes(undefined)
      ) {
        throw new Error("Workflow must have assignee for each node.");
      }

      updateWorkflow(wf);
      await editWorkflow(wf as Workflow);

      toast({
        title: "Success",
        description: "Workflow has been updated successfully.",
      });

      router.push("/dashboard/workflows");
    } catch (error) {
      console.error("Failed to update workflow:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update workflow",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workflow Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter workflow name" {...field} />
              </FormControl>
              <FormDescription>
                Give your workflow a descriptive name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the purpose of this workflow"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide details about what this workflow accomplishes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Workflow</Button>
      </form>
    </Form>
  );
}
