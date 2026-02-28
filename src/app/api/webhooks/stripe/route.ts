import { NextResponse } from "next/server";
import { getStripe, mapStripeInvoice, mapStripeCustomer } from "@/lib/stripe/stripe";
import {
  getClientByEmail,
  createClient,
  getInvoiceByStripeId,
  createInvoice,
  updateInvoice,
  getUsers,
} from "@/lib/store/local-store";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // In dev, allow unsigned events
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  // Get the first user (or admin) to own the synced data
  // In a multi-tenant SaaS, you'd map Stripe accounts to users
  const users = getUsers();
  const owner = users.find((u) => u.role === "admin") || users[0];
  if (!owner) {
    console.error("[Stripe Webhook] No users found to own synced data");
    return NextResponse.json({ error: "No owner user" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "invoice.created":
      case "invoice.updated":
      case "invoice.finalized":
      case "invoice.sent": {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        await syncInvoice(stripeInvoice, owner.id);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid": {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        await syncInvoice(stripeInvoice, owner.id);
        // Mark as paid
        const existing = getInvoiceByStripeId(stripeInvoice.id);
        if (existing) {
          updateInvoice(existing.id, {
            status: "paid",
            recovered_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.created":
      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer;
        syncCustomer(customer, owner.id);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function syncCustomer(stripeCustomer: Stripe.Customer, ownerId: string) {
  const mapped = mapStripeCustomer(stripeCustomer);
  if (!mapped.email) return null;

  const existing = getClientByEmail(mapped.email, ownerId);
  if (existing) return existing;

  return createClient({
    user_id: ownerId,
    name: mapped.name,
    email: mapped.email,
    phone: mapped.phone || undefined,
    stripe_id: mapped.stripe_id,
  });
}

async function syncInvoice(stripeInvoice: Stripe.Invoice, ownerId: string) {
  const mapped = mapStripeInvoice(stripeInvoice);

  // Find or create the client
  let clientId: string | null = null;
  if (mapped.customer_email) {
    const existingClient = getClientByEmail(mapped.customer_email, ownerId);
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = createClient({
        user_id: ownerId,
        name: mapped.customer_name || mapped.customer_email,
        email: mapped.customer_email,
      });
      clientId = newClient.id;
    }
  }

  // Check if invoice already exists
  const existingInvoice = getInvoiceByStripeId(stripeInvoice.id);

  if (existingInvoice) {
    // Update existing invoice
    updateInvoice(existingInvoice.id, {
      status: mapped.status,
      amount: mapped.amount,
      due_date: mapped.due_date,
      description: mapped.description,
      ...(mapped.status === "paid" ? { recovered_at: new Date().toISOString() } : {}),
    });
    console.log(`[Stripe] Updated invoice ${mapped.invoice_number}`);
  } else {
    // Create new invoice
    if (!clientId) {
      console.log(`[Stripe] Skipping invoice ${mapped.invoice_number} — no client email`);
      return;
    }

    createInvoice({
      user_id: ownerId,
      client_id: clientId,
      invoice_number: mapped.invoice_number || undefined,
      description: mapped.description,
      amount: mapped.amount,
      due_date: mapped.due_date,
      status: mapped.status,
      source: "stripe",
      stripe_id: stripeInvoice.id,
    });
    console.log(`[Stripe] Created invoice ${mapped.invoice_number}`);
  }
}
