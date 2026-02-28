"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getRecoveryRate } from "@/lib/utils";
import { DollarSign, Users, FileText, TrendingUp, Activity, CheckCircle2, AlertCircle } from "lucide-react";

interface AdminMetrics {
  totalUsers: number;
  totalInvoices: number;
  totalOutstanding: number;
  totalRecovered: number;
  recoveryRate: number;
  activeFollowUps: number;
  overdueCount: number;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [usersRes, invoicesRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/invoices"),
        ]);

        if (usersRes.ok && invoicesRes.ok) {
          const users = await usersRes.json();
          const invoices = await invoicesRes.json();

          const outstanding = invoices
            .filter((i: any) => i.status !== "paid")
            .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

          const recovered = invoices
            .filter((i: any) => i.status === "paid" && i.recovered_at)
            .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

          const totalAmount = invoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0);

          const overdue = invoices.filter((i: any) => 
            i.status === "overdue" || (i.status !== "paid" && new Date(i.due_date) < new Date())
          ).length;

          const activeFollowUps = invoices.filter(
            (i: any) => i.stage > 0 && i.status !== "paid"
          ).length;

          setMetrics({
            totalUsers: users.length,
            totalInvoices: invoices.length,
            totalOutstanding: outstanding,
            totalRecovered: recovered,
            recoveryRate: getRecoveryRate(recovered, totalAmount),
            activeFollowUps,
            overdueCount: overdue,
          });
        }
      } catch (err) {
        console.error("Failed to fetch admin metrics:", err);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    { title: "Total Users", value: metrics.totalUsers.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Total Invoices", value: metrics.totalInvoices.toString(), icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "System Outstanding", value: formatCurrency(metrics.totalOutstanding), icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Total Recovered", value: formatCurrency(metrics.totalRecovered), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Recovery Rate", value: `${metrics.recoveryRate}%`, icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { title: "Active Follow-ups", value: metrics.activeFollowUps.toString(), icon: Activity, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Overdue Invoices", value: metrics.overdueCount.toString(), icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide metrics and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Card key={i} className="glass-card hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
