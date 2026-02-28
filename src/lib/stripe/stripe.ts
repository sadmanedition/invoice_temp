import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }

  return stripeClient;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Map a Stripe Invoice to our app's invoice format
 */
export function mapStripeInvoice(stripeInvoice: Stripe.Invoice) {
  const status = (() => {
    switch (stripeInvoice.status) {
      case "paid":
        return "paid" as const;
      case "open":
      case "uncollectible":
        // Check if past due
        if (stripeInvoice.due_date && stripeInvoice.due_date * 1000 < Date.now()) {
          return "overdue" as const;
        }
        return "unpaid" as const;
      case "void":
        return "paid" as const; // treat void as resolved
      default:
        return "unpaid" as const;
    }
  })();

  return {
    stripe_id: stripeInvoice.id,
    invoice_number: stripeInvoice.number || stripeInvoice.id,
    description: stripeInvoice.description || `Stripe Invoice ${stripeInvoice.number || ""}`.trim(),
    amount: (stripeInvoice.amount_due || 0) / 100, // Stripe uses cents
    due_date: stripeInvoice.due_date
      ? new Date(stripeInvoice.due_date * 1000).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status,
    source: "stripe" as const,
    customer_email: stripeInvoice.customer_email || null,
    customer_name: stripeInvoice.customer_name || null,
  };
}

/**
 * Map a Stripe Customer to our client format
 */
export function mapStripeCustomer(customer: Stripe.Customer) {
  return {
    stripe_id: customer.id,
    name: customer.name || customer.email || "Unknown",
    email: customer.email || "",
    phone: customer.phone || null,
  };
}
