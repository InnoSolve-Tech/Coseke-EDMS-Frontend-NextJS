"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const data = [
  { status: "Completed", count: 45 },
  { status: "In Progress", count: 30 },
  { status: "Pending", count: 15 },
  { status: "Rejected", count: 5 },
];

export function WorkflowStatusChart() {
  const config = {
    storage: {
      label: "Storage (GB)",
      color: "hsl(var(--chart-1))",
    },
    bandwidth: {
      label: "Bandwidth (GB)",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <ChartContainer
      config={{
        count: {
          label: "Count",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="status" />
          <YAxis />
          <ChartTooltip config={config} />
          <Bar dataKey="count" fill="var(--color-count)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
