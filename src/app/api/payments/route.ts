import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { createPayment, getInvoiceById } from "@/lib/store/local-store";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Verify the invoice belongs to the user
    const invoice = getInvoiceById(body.invoice_id);
    if (!invoice || invoice.user_id !== user.id) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payment = createPayment({
      invoice_id: body.invoice_id,
      amount: Number(body.amount),
      paid_at: body.paid_at || new Date().toISOString(),
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
