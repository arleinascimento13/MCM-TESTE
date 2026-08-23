"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  chartAxisStroke,
  chartAxisTick,
  chartGrid,
  chartPrimaryFill,
  chartTooltipStyle,
} from "./chart-theme";

export function PeriodChart({ data }: { data: { mes: number; ano: number; totalHoras: string }[] }) {
  const chartData = data.map((d) => ({
    name: `${String(d.mes).padStart(2, "0")}/${d.ano}`,
    value: d.totalHoras,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid {...chartGrid} vertical={false} />
          <XAxis dataKey="name" tick={chartAxisTick} stroke={chartAxisStroke} />
          <YAxis tick={chartAxisTick} stroke={chartAxisStroke} />
          <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar dataKey="value" fill={chartPrimaryFill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
