import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { getAllInvoicesWithUsers, updateInvoice } from "@/lib/store/local-store";

async function isAdmin() {
  const user = await getSession();
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = getAllInvoicesWithUsers();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const updated = updateInvoice(body.invoice_id, {
      status: body.status,
      ...(body.status === "paid" ? { recovered_at: new Date().toISOString() } : {}),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
