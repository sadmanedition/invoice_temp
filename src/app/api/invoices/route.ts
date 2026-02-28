import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { getInvoices, createInvoice } from "@/lib/store/local-store";
import { seedDemoData } from "@/lib/store/seed";

export async function GET() {
  try {
    seedDemoData();
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = getInvoices(user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const invoice = createInvoice({
      user_id: user.id,
      client_id: body.client_id,
      invoice_number: body.invoice_number,
      description: body.description,
      amount: Number(body.amount),
      due_date: body.due_date,
      status: body.status || "unpaid",
      source: body.source || "manual",
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
