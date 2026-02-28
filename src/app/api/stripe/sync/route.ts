import { NextResponse } from "next/server";
import { getSession } from "@/lib/store/auth";
import { getStripe, isStripeConfigured, mapStripeInvoice } from "@/lib/stripe/stripe";
import {
  getClientByEmail,
  createClient,
  getInvoiceByStripeId,
  createInvoice,
  updateInvoice,
} from "@/lib/store/local-store";

/**
 * Manual sync — pulls all open/past_due invoices from Stripe
 */
export async function POST() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY in your .env" }, { status: 400 });
    }

    const stripe = getStripe()!;
    let synced = 0;
    let updated = 0;
    let skipped = 0;

    // Fetch open and past_due invoices
    const invoices = await stripe.invoices.list({
      status: "open",
      limit: 100,
      expand: ["data.customer"],
    });

    // Also fetch past_due
    const pastDue = await stripe.invoices.list({
      status: "open",
      limit: 100,
      collection_method: "send_invoice",
      expand: ["data.customer"],
    });

    const allInvoices = [...invoices.data, ...pastDue.data];
    // Deduplicate
    const seen = new Set<string>();
    const unique = allInvoices.filter((inv) => {
      if (seen.has(inv.id)) return false;
      seen.add(inv.id);
      return true;
    });

    for (const stripeInvoice of unique) {
      const mapped = mapStripeInvoice(stripeInvoice);

      // Find or create client
      let clientId: string | null = null;
      if (mapped.customer_email) {
        const existingClient = getClientByEmail(mapped.customer_email, user.id);
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const newClient = createClient({
            user_id: user.id,
            name: mapped.customer_name || mapped.customer_email,
            email: mapped.customer_email,
          });
          clientId = newClient.id;
        }
      }

      // Check if already synced
      const existing = getInvoiceByStripeId(stripeInvoice.id);
      if (existing) {
        updateInvoice(existing.id, {
          status: mapped.status,
          amount: mapped.amount,
          due_date: mapped.due_date,
        });
        updated++;
        continue;
      }

      if (!clientId) {
        skipped++;
        continue;
      }

      createInvoice({
        user_id: user.id,
        client_id: clientId,
        invoice_number: mapped.invoice_number || undefined,
        description: mapped.description,
        amount: mapped.amount,
        due_date: mapped.due_date,
        status: mapped.status,
        source: "stripe",
        stripe_id: stripeInvoice.id,
      });
      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      updated,
      skipped,
      total: unique.length,
    });
  } catch (error: any) {
    console.error("[Stripe Sync] Error:", error);
    return NextResponse.json(
      { error: error.message || "Stripe sync failed" },
      { status: 500 }
    );
  }
}
