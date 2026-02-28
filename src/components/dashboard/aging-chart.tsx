"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Invoice } from "@/lib/supabase/types";
import { daysOverdue } from "@/lib/utils";

interface AgingChartProps {
  invoices: Invoice[];
}

export function AgingChart({ invoices }: AgingChartProps) {
  const unpaidInvoices = invoices.filter((i) => i.status !== "paid");

  const ageGroups = [
    { name: "Current", min: 0, max: 0, count: 0, color: "hsl(152, 60%, 45%)" },
    { name: "1-7 days", min: 1, max: 7, count: 0, color: "hsl(43, 74%, 56%)" },
    { name: "8-14 days", min: 8, max: 14, count: 0, color: "hsl(27, 87%, 57%)" },
    { name: "15-30 days", min: 15, max: 30, count: 0, color: "hsl(0, 84%, 60%)" },
    { name: "30+ days", min: 31, max: Infinity, count: 0, color: "hsl(0, 60%, 45%)" },
  ];

  unpaidInvoices.forEach((invoice) => {
    const days = daysOverdue(invoice.due_date);
    const group = ageGroups.find((g) => days >= g.min && days <= g.max);
    if (group) group.count++;
  });

  const data = ageGroups.map((g) => ({
    name: g.name,
    count: g.count,
    color: g.color,
  }));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Aging Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {unpaidInvoices.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No unpaid invoices to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
