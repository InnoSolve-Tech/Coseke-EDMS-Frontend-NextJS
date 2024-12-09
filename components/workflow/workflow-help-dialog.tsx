"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MousePointer,
  Plus,
  ArrowUpRight,
  UserCircle2,
  FormInput,
  Info,
} from "lucide-react";

const nodeInstructions = [
  {
    icon: Plus,
    title: "Add Nodes",
    description: "Click node buttons at the top to add them to the canvas",
  },
  {
    icon: MousePointer,
    title: "Position Nodes",
    description: "Drag nodes around the canvas to arrange your workflow",
  },
  {
    icon: ArrowUpRight,
    title: "Connect Nodes",
    description: "Drag from the bottom dot of one node to the top dot of another to create connections",
  },
  {
    icon: UserCircle2,
    title: "Assign Tasks",
    description: "Click any node to assign users or roles responsible for that step",
  },
  {
    icon: FormInput,
    title: "Create Forms",
    description: "Build custom forms for each node to collect necessary information",
  },
];

export function WorkflowHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>How to Use the Workflow Designer</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              Design your workflow by adding and connecting nodes. Each node represents
              a step in your process and can be customized with forms and assignments.
            </p>

            <div className="grid gap-4">
              {nodeInstructions.map((instruction, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <instruction.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{instruction.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mt-0">
                      {instruction.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tips</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Start with a "Start Process" node and end with an "End Process" node</li>
                <li>Use decision nodes to create conditional branches in your workflow</li>
                <li>Parallel tasks can be used for steps that can happen simultaneously</li>
                <li>Always merge parallel branches using a merge node</li>
                <li>Save your workflow regularly by exporting the JSON</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}