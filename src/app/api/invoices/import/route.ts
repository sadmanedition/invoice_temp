import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { getClientByEmail, createClient, createInvoice } from "@/lib/store/local-store";
import Papa from "papaparse";

interface CSVRow {
  client_name?: string;
  client_email?: string;
  invoice_number?: string;
  amount?: string;
  due_date?: string;
  description?: string;
  status?: string;
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();

    // Parse CSV
    const { data, errors } = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    if (errors.length > 0 && data.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV", details: errors.slice(0, 5) },
        { status: 400 }
      );
    }

    const results = {
      total: data.length,
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Header is row 1

      // Validate required fields
      if (!row.amount || !row.due_date) {
        results.errors.push(`Row ${rowNum}: Missing required field (amount or due_date)`);
        results.skipped++;
        continue;
      }

      const amount = parseFloat(row.amount.replace(/[^0-9.-]/g, ""));
      if (isNaN(amount) || amount <= 0) {
        results.errors.push(`Row ${rowNum}: Invalid amount "${row.amount}"`);
        results.skipped++;
        continue;
      }

      // Validate date format
      const dateStr = row.due_date.trim();
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        results.errors.push(`Row ${rowNum}: Invalid date "${row.due_date}"`);
        results.skipped++;
        continue;
      }
      const dueDate = parsedDate.toISOString().split("T")[0];

      // Find or create client
      const clientEmail = row.client_email?.trim() || `imported-${Date.now()}-${i}@csv.local`;
      const clientName = row.client_name?.trim() || clientEmail;

      let client = getClientByEmail(clientEmail, user.id);
      if (!client) {
        client = createClient({
          user_id: user.id,
          name: clientName,
          email: clientEmail,
        });
      }

      // Determine status
      let status: "unpaid" | "overdue" | "paid" | "partial" = "unpaid";
      if (row.status) {
        const s = row.status.trim().toLowerCase();
        if (["paid", "overdue", "unpaid", "partial"].includes(s)) {
          status = s as any;
        }
      }
      // Auto-mark as overdue if past due
      if (status === "unpaid" && new Date(dueDate) < new Date()) {
        status = "overdue";
      }

      // Create invoice
      createInvoice({
        user_id: user.id,
        client_id: client.id,
        invoice_number: row.invoice_number?.trim() || undefined,
        description: row.description?.trim() || undefined,
        amount,
        due_date: dueDate,
        status,
        source: "api",
      });

      results.created++;
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("[CSV Import] Error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
