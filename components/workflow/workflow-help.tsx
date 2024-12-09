"use client";

import {
  HelpCircle,
  MousePointer,
  Plus,
  ArrowUpRight,
  UserCircle2,
  FormInput,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface WorkflowHelpProps {
  type?: "designer" | "process";
}

export function WorkflowHelp({ type = "designer" }: WorkflowHelpProps) {
  const designerSteps = [
    { icon: Plus, text: "Click node buttons to add them to the canvas" },
    { icon: MousePointer, text: "Drag nodes to position them" },
    { icon: ArrowUpRight, text: "Connect nodes by dragging from dots" },
    { icon: UserCircle2, text: "Click nodes to assign users/roles" },
    { icon: FormInput, text: "Build custom forms for each node" },
  ];

  const processHelp = "Design your workflow by adding and connecting nodes. Each node represents a step in your process and can be customized with forms and assignments.";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-4">
          {type === "designer" ? (
            <div className="space-y-3">
              <p className="font-medium">How to use the designer:</p>
              <ul className="space-y-2">
                {designerSteps.map((step, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <step.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{step.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm">{processHelp}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}