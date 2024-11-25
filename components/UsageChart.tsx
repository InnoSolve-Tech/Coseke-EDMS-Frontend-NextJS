"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

const data = [
  { month: "Jan", storage: 20, bandwidth: 30 },
  { month: "Feb", storage: 25, bandwidth: 35 },
  { month: "Mar", storage: 30, bandwidth: 40 },
  { month: "Apr", storage: 35, bandwidth: 45 },
  { month: "May", storage: 40, bandwidth: 50 },
  { month: "Jun", storage: 45, bandwidth: 55 },
]

export function UsageChart() {
  // Define the chart configuration
  const config = {
    storage: {
      label: "Storage (GB)",
      color: "hsl(var(--chart-1))",
    },
    bandwidth: {
      label: "Bandwidth (GB)",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <ChartContainer
      config={config}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          {/* Pass the config to the ChartTooltip */}
          <ChartTooltip config={config} />
          {/* Define lines with dynamic stroke color */}
          <Line type="monotone" dataKey="storage" stroke="var(--color-storage)" strokeWidth={2} />
          <Line type="monotone" dataKey="bandwidth" stroke="var(--color-bandwidth)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
