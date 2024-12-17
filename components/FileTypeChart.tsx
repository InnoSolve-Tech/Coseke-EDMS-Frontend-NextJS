"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const data = [
  { name: "PDF", value: 400 },
  { name: "DOCX", value: 300 },
  { name: "XLSX", value: 200 },
  { name: "JPG", value: 100 },
  { name: "Others", value: 50 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function FileTypeChart() {
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
        PDF: {
          label: "PDF",
          color: COLORS[0],
        },
        DOCX: {
          label: "DOCX",
          color: COLORS[1],
        },
        XLSX: {
          label: "XLSX",
          color: COLORS[2],
        },
        JPG: {
          label: "JPG",
          color: COLORS[3],
        },
        Others: {
          label: "Others",
          color: COLORS[4],
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <ChartTooltip config={config} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
