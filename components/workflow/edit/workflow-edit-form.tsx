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
import { Workflow } from "@/lib/types/workflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
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
  const initialWorkflowRef = useRef(workflow); // Track the initial workflow

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workflow?.name || "",
      description: workflow?.description || "",
    },
  });

  useEffect(() => {
    // Check if workflow has actually changed and if the form values need resetting
    if (
      workflow?.name !== initialWorkflowRef.current?.name ||
      workflow?.description !== initialWorkflowRef.current?.description
    ) {
      initialWorkflowRef.current = workflow; // Update the ref
      form.reset({
        name: workflow?.name || "",
        description: workflow?.description || "",
      });
    }
  }, [workflow, form]);
  

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    updateWorkflow({
      ...workflow,
      ...values,
    });

    await editWorkflow({
      ...workflow,
      ...values,
    } as Workflow)
    console.log(workflow);
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
