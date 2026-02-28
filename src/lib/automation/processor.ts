import { type NotificationAdapter, type NotificationPayload } from "./types";
import { type NotificationChannel } from "@/lib/supabase/types";
import { EmailAdapter } from "./adapters/email";
import { SmsAdapter } from "./adapters/sms";
import { WhatsAppAdapter } from "./adapters/whatsapp";
import { shouldSendFollowUp } from "./stages";
import { generateSubject, generateBody } from "./templates";
import { daysOverdue as calcDaysOverdue } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";

const adapters: Record<NotificationChannel, NotificationAdapter> = {
  email: new EmailAdapter(),
  sms: new SmsAdapter(),
  whatsapp: new WhatsAppAdapter(),
};

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface ProcessorResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
  details: Array<{
    invoiceId: string;
    action: string;
    success: boolean;
    error?: string;
  }>;
}

export async function processFollowUps(): Promise<ProcessorResult> {
  const supabase = getSupabaseAdmin();
  const result: ProcessorResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  console.log(`[Processor] Starting follow-up processing at ${new Date().toISOString()}`);

  // Fetch all overdue, unpaid invoices with client and user data
  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients(*),
      user:users(*)
    `)
    .in("status", ["unpaid", "overdue", "partial"])
    .lte("due_date", new Date().toISOString().split("T")[0]);

  if (fetchError) {
    console.error("[Processor] Error fetching invoices:", fetchError);
    return result;
  }

  if (!invoices || invoices.length === 0) {
    console.log("[Processor] No overdue invoices found");
    return result;
  }

  console.log(`[Processor] Found ${invoices.length} overdue invoices`);

  for (const invoice of invoices) {
    result.processed++;

    // Get user settings
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", invoice.user_id)
      .single();

    if (!settings?.automation_enabled) {
      result.skipped++;
      result.details.push({
        invoiceId: invoice.id,
        action: "Skipped - automation disabled",
        success: true,
      });
      continue;
    }

    const overdueDays = calcDaysOverdue(invoice.due_date);
    const decision = shouldSendFollowUp(
      overdueDays,
      invoice.stage,
      invoice.last_follow_up_sent_at,
      settings.follow_up_interval_hours
    );

    if (!decision.shouldSend || !decision.stage) {
      result.skipped++;
      result.details.push({
        invoiceId: invoice.id,
        action: `Skipped - ${decision.reason}`,
        success: true,
      });
      continue;
    }

    // Generate message
    const client = invoice.client;
    const user = invoice.user;

    if (!client || !user) {
      result.errors++;
      result.details.push({
        invoiceId: invoice.id,
        action: "Error - missing client or user data",
        success: false,
      });
      continue;
    }

    const templateData = {
      clientName: client.name,
      companyName: user.company_name || user.email,
      invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8),
      amount: invoice.amount,
      dueDate: invoice.due_date,
      daysOverdue: overdueDays,
    };

    const subject = generateSubject(decision.stage, templateData);
    const body = generateBody(decision.stage, settings.tone_preference, templateData);

    // Send via enabled channels
    const enabledChannels = settings.enabled_channels || ["email"];
    let anySent = false;

    for (const channel of enabledChannels) {
      const adapter = adapters[channel as NotificationChannel];

      if (!adapter || !adapter.isConfigured()) {
        continue;
      }

      const payload: NotificationPayload = {
        to: channel === "email" ? client.email : (client.phone || client.email),
        subject,
        body,
        invoiceId: invoice.id,
        clientName: client.name,
      };

      const sendResult = await adapter.send(payload);

      if (sendResult.success) {
        anySent = true;

        // Log follow-up
        await supabase.from("follow_up_logs").insert({
          invoice_id: invoice.id,
          stage: decision.stage.stage,
          message_sent: body,
          channel: channel as NotificationChannel,
          sent_at: new Date().toISOString(),
        });
      } else {
        console.error(`[Processor] Failed to send ${channel} for invoice ${invoice.id}:`, sendResult.error);
      }
    }

    if (anySent) {
      // Update invoice
      await supabase
        .from("invoices")
        .update({
          stage: decision.stage.stage,
          escalation_level: decision.stage.escalationLevel,
          last_follow_up_sent_at: new Date().toISOString(),
          status: overdueDays >= 1 ? "overdue" : invoice.status,
        })
        .eq("id", invoice.id);

      result.sent++;
      result.details.push({
        invoiceId: invoice.id,
        action: `Sent stage ${decision.stage.stage}: ${decision.stage.name}`,
        success: true,
      });
    } else {
      result.errors++;
      result.details.push({
        invoiceId: invoice.id,
        action: "Error - no channels succeeded",
        success: false,
      });
    }
  }

  console.log(`[Processor] Completed. Processed: ${result.processed}, Sent: ${result.sent}, Skipped: ${result.skipped}, Errors: ${result.errors}`);

  return result;
}
