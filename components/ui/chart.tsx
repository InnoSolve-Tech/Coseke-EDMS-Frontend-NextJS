"use client";

import * as React from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Grid } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";

import { cn } from "@/lib/utils";

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: "var(--background)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  padding: "0.5rem",
};

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: { name: string; value: number }[];
}

export function Chart({ className, data, ...props }: ChartProps) {
  const width = 350;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const x = (d: { name: string }) => d.name;
  const y = (d: { value: number }) => d.value;

  const xScale = scaleBand<string>({
    range: [0, xMax],
    round: true,
    domain: data.map(x),
    padding: 0.4,
  });
  const yScale = scaleLinear<number>({
    range: [yMax, 0],
    round: true,
    domain: [0, Math.max(...data.map(y))],
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ name: string; value: number }>();

  const { TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  return (
    <div className={cn("", className)} {...props}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            stroke="var(--border)"
            strokeOpacity={0.1}
          />
          <AxisBottom
            top={yMax}
            scale={xScale}
            tickLabelProps={() => ({
              fill: "var(--foreground)",
              fontSize: 11,
              textAnchor: "middle",
            })}
          />
          <AxisLeft
            scale={yScale}
            tickLabelProps={() => ({
              fill: "var(--foreground)",
              fontSize: 11,
              textAnchor: "end",
              dy: "0.33em",
            })}
            tickFormat={(value) => `$${value}`}
          />
          {data.map((d) => {
            const barWidth = xScale.bandwidth();
            const barHeight = yMax - (yScale(y(d)) ?? 0);
            const barX = xScale(x(d));
            const barY = yMax - barHeight;
            return (
              <Bar
                key={`bar-${x(d)}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill="var(--primary)"
                onMouseLeave={() => hideTooltip()}
                onMouseMove={() => {
                  const top = barY + margin.top;
                  const left = (barX ?? 0) + barWidth / 2 + margin.left;
                  showTooltip({
                    tooltipData: d,
                    tooltipTop: top,
                    tooltipLeft: left,
                  });
                }}
              />
            );
          })}
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div className="flex flex-col">
            <span className="text-sm font-bold">{tooltipData.name}</span>
            <span className="text-xs">${tooltipData.value}</span>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: Record<string, { label: string; color: string }>;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <div className={cn("", className)} {...props}>
      <style jsx>{`
        :root {
          ${Object.entries(config)
            .map(([key, value]) => `--color-${key}: ${value.color};`)
            .join("\n")}
        }
      `}</style>
      {children}
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey: string }>;
  label?: string;
  config: Record<string, { label: string; color: string }>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  config,
}: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 shadow-md">
        <p className="font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: config[entry.dataKey]?.color }}>
            {config[entry.dataKey]?.label || entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

interface ChartTooltipContentProps {
  payload?: Array<{ value: number; name: string; dataKey: string }>;
  label?: string;
  config: Record<string, { label: string; color: string }>;
}

export function ChartTooltipContent({
  payload,
  label,
  config,
}: ChartTooltipContentProps) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="bg-background border border-border p-2 shadow-md">
      <p className="font-bold">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: config[entry.dataKey]?.color }}>
          {config[entry.dataKey]?.label || entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}
