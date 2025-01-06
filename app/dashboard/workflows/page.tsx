"use client";

import { WorkflowList } from "@/components/workflow/workflow-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function WorkflowsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-6">Workflows</h1>
        <Button asChild>
          <Link href="/dashboard/workflows/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Workflow
          </Link>
        </Button>
      </div>
      <WorkflowList />
    </div>
  );
}
