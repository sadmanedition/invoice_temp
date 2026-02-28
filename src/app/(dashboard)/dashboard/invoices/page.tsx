"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceTable } from "@/components/dashboard/invoice-table";
import { InvoiceForm } from "@/components/dashboard/invoice-form";
import { CSVUpload } from "@/components/dashboard/csv-upload";
import type { Invoice } from "@/lib/supabase/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    const res = await fetch("/api/invoices");
    if (res.ok) {
      const data = await res.json();
      setInvoices(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track all your invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVUpload onImportComplete={fetchInvoices} />
          <InvoiceForm onSuccess={fetchInvoices} />
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : (
            <InvoiceTable invoices={invoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
