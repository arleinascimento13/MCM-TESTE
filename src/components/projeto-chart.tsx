"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  chartAxisStroke,
  chartAxisTick,
  chartGrid,
  chartPrimaryFill,
  chartTooltipStyle,
} from "./chart-theme";

export function ProjetoChart({ data }: { data: { projectName: string; totalHoras: string }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid {...chartGrid} vertical={false} />
          <XAxis dataKey="projectName" tick={chartAxisTick} stroke={chartAxisStroke} />
          <YAxis tick={chartAxisTick} stroke={chartAxisStroke} />
          <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar dataKey="totalHoras" fill={chartPrimaryFill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
