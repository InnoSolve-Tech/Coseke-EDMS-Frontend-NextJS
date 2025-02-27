"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { WorkflowInstance } from "@/lib/types/workflowInstance";

export function WorkflowStatusChart({
  workflowInstances,
}: {
  workflowInstances: WorkflowInstance[];
}) {
  const data = workflowInstances.reduce(
    (acc: { status: string; count: number }[], instance: WorkflowInstance) => {
      const status = instance.status;
      const existing = acc.find((item) => item.status === status);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ status, count: 1 });
      }
      return acc;
    },
    [] as { status: string; count: number }[],
  );

  const config = {
    count: {
      label: "Workflows",
      color: "hsl(var(--chart-1))",
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
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis
            dataKey="status"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
              value.charAt(0).toUpperCase() + value.slice(1)
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => Math.floor(value).toString()}
            allowDecimals={false}
          />
          <ChartTooltip config={config} />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
            barSize={100}
            fillOpacity={0.9}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
