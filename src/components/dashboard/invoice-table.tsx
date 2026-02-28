"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, daysOverdue } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/lib/supabase/types";
import { Search, ArrowUpDown } from "lucide-react";

interface InvoiceTableProps {
  invoices: Invoice[];
  compact?: boolean;
  showUser?: boolean;
  onStatusChange?: (invoiceId: string, status: InvoiceStatus) => void;
}

const statusVariant: Record<InvoiceStatus, "success" | "destructive" | "warning" | "secondary"> = {
  paid: "success",
  unpaid: "secondary",
  overdue: "destructive",
  partial: "warning",
};

export function InvoiceTable({ invoices, compact, showUser, onStatusChange }: InvoiceTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"amount" | "due_date" | "created_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = invoices
    .filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const clientName = inv.client?.name?.toLowerCase() || "";
        const invNumber = inv.invoice_number?.toLowerCase() || "";
        return clientName.includes(q) || invNumber.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = sortField === "amount" ? Number(a[sortField]) : new Date(a[sortField]).getTime();
      const bVal = sortField === "amount" ? Number(b[sortField]) : new Date(b[sortField]).getTime();
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              {showUser && <TableHead>User</TableHead>}
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 gap-1"
                  onClick={() => toggleSort("amount")}
                >
                  Amount <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 h-8 gap-1"
                  onClick={() => toggleSort("due_date")}
                >
                  Due Date <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              {!compact && <TableHead>Days Overdue</TableHead>}
              {onStatusChange && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={compact ? 6 : 8} className="text-center text-muted-foreground py-8">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number || invoice.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{invoice.client?.name || "—"}</TableCell>
                  {showUser && <TableCell>{(invoice as any).user?.email || "—"}</TableCell>}
                  <TableCell className="font-medium">{formatCurrency(Number(invoice.amount))}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {invoice.stage > 0
                        ? `Stage ${invoice.stage}`
                        : "—"}
                    </span>
                  </TableCell>
                  {!compact && (
                    <TableCell>
                      {invoice.status !== "paid" && daysOverdue(invoice.due_date) > 0
                        ? `${daysOverdue(invoice.due_date)}d`
                        : "—"}
                    </TableCell>
                  )}
                  {onStatusChange && (
                    <TableCell>
                      <Select
                        value={invoice.status}
                        onValueChange={(v) => onStatusChange(invoice.id, v as InvoiceStatus)}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
