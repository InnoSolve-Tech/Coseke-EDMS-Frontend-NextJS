"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Workflow } from "@/lib/types/workflow";

interface WorkflowJsonProps {
  workflow: Partial<Workflow>;
}

export function WorkflowJson({ workflow }: WorkflowJsonProps) {
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(workflow, null, 2);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Export JSON</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-opacity-100 bg-white text-black">
        <DialogHeader>
          <DialogTitle>Workflow JSON</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="w-full"
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <pre className="text-sm">{formattedJson}</pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}