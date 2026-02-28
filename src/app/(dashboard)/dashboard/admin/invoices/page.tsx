"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import type { Invoice, InvoiceStatus } from "@/lib/supabase/types";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    const res = await fetch("/api/admin/invoices");
    if (res.ok) setInvoices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleStatusChange = async (invoiceId: string, status: InvoiceStatus) => {
    await fetch("/api/admin/invoices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: invoiceId, status }),
    });
    fetchInvoices();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">All Invoices</h1>
        <p className="text-muted-foreground">View and manage invoices across all users</p>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : (
            <InvoiceTable
              invoices={invoices}
              showUser
              onStatusChange={handleStatusChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
