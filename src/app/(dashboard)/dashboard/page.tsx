"use client";

import { useEffect, useState } from "react";
import { formatCurrency, getRecoveryRate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Invoice } from "@/lib/supabase/types";
import { RecoveryChart } from "@/components/dashboard/recovery-chart";
import { AgingChart } from "@/components/dashboard/aging-chart";
import { InvoiceTable } from "@/components/dashboard/invoice-table";

interface DashboardMetrics {
  totalOutstanding: number;
  totalRecovered: number;
  recoveryRate: number;
  overdueCount: number;
  totalInvoices: number;
  paidCount: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOutstanding: 0,
    totalRecovered: 0,
    recoveryRate: 0,
    overdueCount: 0,
    totalInvoices: 0,
    paidCount: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const invoiceData = await res.json();
        setInvoices(invoiceData);

        const outstanding = invoiceData
          .filter((i: Invoice) => i.status !== "paid")
          .reduce((sum: number, i: Invoice) => sum + Number(i.amount), 0);

        const recovered = invoiceData
          .filter((i: Invoice) => i.status === "paid")
          .reduce((sum: number, i: Invoice) => sum + Number(i.amount), 0);

        const overdue = invoiceData.filter(
          (i: Invoice) => i.status === "overdue" || (i.status !== "paid" && new Date(i.due_date) < new Date())
        ).length;

        const paid = invoiceData.filter((i: Invoice) => i.status === "paid").length;

        const totalAmount = invoiceData.reduce((sum: number, i: Invoice) => sum + Number(i.amount), 0);

        setMetrics({
          totalOutstanding: outstanding,
          totalRecovered: recovered,
          recoveryRate: getRecoveryRate(recovered, totalAmount),
          overdueCount: overdue,
          totalInvoices: invoiceData.length,
          paidCount: paid,
        });
      }
      setLoading(false);
    };

    fetchData();
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

  const metricCards = [
    {
      title: "Total Outstanding",
      value: formatCurrency(metrics.totalOutstanding),
      icon: DollarSign,
      trend: metrics.overdueCount > 0 ? "needs attention" : "on track",
      trendUp: false,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Recovered Amount",
      value: formatCurrency(metrics.totalRecovered),
      icon: CheckCircle2,
      trend: `${metrics.paidCount} invoices`,
      trendUp: true,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Recovery Rate",
      value: `${metrics.recoveryRate}%`,
      icon: TrendingUp,
      trend: metrics.recoveryRate > 70 ? "excellent" : metrics.recoveryRate > 40 ? "good" : "improving",
      trendUp: metrics.recoveryRate > 50,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Overdue Count",
      value: metrics.overdueCount.toString(),
      icon: AlertCircle,
      trend: `of ${metrics.totalInvoices} total`,
      trendUp: metrics.overdueCount === 0,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <Card key={i} className="glass-card hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <Badge variant={card.trendUp ? "success" : "warning"} className="gap-1">
                  {card.trendUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {card.trend}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecoveryChart invoices={invoices} />
        <AgingChart invoices={invoices} />
      </div>

      {/* Recent Invoices */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Badge variant="outline">{invoices.length} total</Badge>
        </CardHeader>
        <CardContent>
          <InvoiceTable invoices={invoices.slice(0, 10)} compact />
        </CardContent>
      </Card>
    </div>
  );
}
