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
import { createWorkflow } from "@/core/workflows/api";
import { useWorkflow } from "@/lib/contexts/workflow-context";
import { Edge } from "@/lib/types/workflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/core/hooks/use-toast";

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
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workflow?.name || "",
      description: workflow?.description || "",
    },
  });

  const traceEdges = (edges: Edge[], start: any, endNodes: any[]): boolean => {
    if (!start || endNodes.length === 0) {
      return false;
    }

    if (edges.length === 0) {
      return false;
    }

    const visited = new Set<string>();
    const queue: string[] = [start.id];

    while (queue.length > 0) {
      const currentNode = queue.shift()!;

      // Check if current node is any of the end nodes
      if (endNodes.some((endNode) => endNode.id === currentNode)) {
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
      let wf: any = {
        ...workflow,
        ...values,
      };
      updateWorkflow(wf);
      console.log(wf);

      if (wf.nodes.filter((node: any) => node.type === "start").length === 0) {
        throw new Error("Workflow must have a start node.");
      }

      let start = wf.nodes.find((node: any) => node.type === "start");

      if (wf.nodes.filter((node: any) => node.type === "end").length === 0) {
        throw new Error("Workflow must have an end node.");
      }

      // Get all end nodes instead of just one
      let endNodes = wf.nodes.filter((node: any) => node.type === "end");
      let edges = wf.edges;

      // Check for shared target nodes
      const targetCounts = edges.reduce(
        (acc: { [key: string]: string[] }, edge: any) => {
          if (!acc[edge.source]) {
            acc[edge.source] = [];
          }
          acc[edge.source].push(edge.target);
          return acc;
        },
        {},
      );

      // Validate shared targets
      for (const [targetId, targets] of Object.entries(targetCounts) as [
        string,
        string[],
      ][]) {
        if (targets.length > 1) {
          const targetNode = wf.nodes.find((node: any) => node.id === targetId);
          if (!targetNode) {
            throw new Error(`Invalid target node: ${targetId}`);
          }

          if (targetNode.type !== "decision") {
            throw new Error(
              `Node "${targetNode.data?.label || targetId}" has multiple outgoing connections, consider using a decision node.`,
            );
          } else if (targetNode.type === "decision") {
            if (targets.length !== 2) {
              throw new Error(
                `Decision node "${targetNode.data?.label || targetId}" must have exactly 2 outgoing connections.`,
              );
            }
          }
        }
      }

      // Modified to check for path to any end node
      if (!traceEdges(edges, start, endNodes)) {
        throw new Error(
          "Workflow must have a path from start to at least one end node.",
        );
      }

      if (
        wf.nodes.map((node: any) => node.data.assignee).includes(null) ||
        wf.nodes.map((node: any) => node.data.assignee).includes(undefined)
      ) {
        throw new Error("Workflow must have assignee for each node.");
      }

      await createWorkflow(wf);

      toast({
        title: "Success",
        color: "success",
        description: "Workflow has been saved successfully.",
      });

      router.push("/dashboard/workflows");
    } catch (error) {
      console.error("Failed to create workflow:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create workflow",
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
