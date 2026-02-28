import { NextResponse } from "next/server";
import { getOverdueInvoices, getUserSettings, updateInvoice, createFollowUpLog } from "@/lib/store/local-store";
import { shouldSendFollowUp } from "@/lib/automation/stages";
import { generateSubject, generateBody } from "@/lib/automation/templates";
import type { TonePreference } from "@/lib/supabase/types";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "dev-cron-secret";
  const token = authHeader?.replace("Bearer ", "");

  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overdueInvoices = getOverdueInvoices();
    console.log(`[Cron] Processing ${overdueInvoices.length} overdue invoices`);

    let processed = 0;
    let skipped = 0;

    for (const invoice of overdueInvoices) {
      const dueDate = new Date(invoice.due_date);
      const daysOverdue = Math.ceil((Date.now() - dueDate.getTime()) / 86400000);

      const settings = getUserSettings(invoice.user_id);
      if (!settings?.automation_enabled) {
        skipped++;
        continue;
      }

      const decision = shouldSendFollowUp(
        daysOverdue,
        invoice.stage,
        invoice.last_follow_up_sent_at,
        settings.follow_up_interval_hours
      );

      if (!decision.shouldSend || !decision.stage) {
        skipped++;
        continue;
      }

      const tone: TonePreference = settings.tone_preference || "professional";
      const templateData = {
        clientName: invoice.client?.name || "Client",
        invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8),
        amount: Number(invoice.amount),
        dueDate: invoice.due_date,
        daysOverdue,
        companyName: invoice.user?.company_name || "Our Team",
      };

      const subject = generateSubject(decision.stage, templateData);
      const body = generateBody(decision.stage, tone, templateData);

      // Log the follow-up (email simulation)
      createFollowUpLog({
        invoice_id: invoice.id,
        stage: decision.stage.stage,
        message_sent: `Subject: ${subject}\n\n${body}`,
        channel: "email",
      });

      // Update invoice
      updateInvoice(invoice.id, {
        stage: decision.stage.stage,
        escalation_level: decision.stage.escalationLevel,
        last_follow_up_sent_at: new Date().toISOString(),
        ...(daysOverdue > 0 ? { status: "overdue" as const } : {}),
      });

      processed++;
      console.log(`[Cron] Sent stage ${decision.stage.stage} follow-up for invoice ${invoice.invoice_number || invoice.id}`);
    }

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      total: overdueInvoices.length,
    });
  } catch (error) {
    console.error("[Cron] Error processing follow-ups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
