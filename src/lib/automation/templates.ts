import { type TonePreference } from "@/lib/supabase/types";
import { type StageConfig } from "./types";
import { formatCurrency } from "@/lib/utils";

interface TemplateData {
  clientName: string;
  companyName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

export function generateSubject(stage: StageConfig, data: TemplateData): string {
  switch (stage.stage) {
    case 1:
      return `Friendly Reminder: Invoice ${data.invoiceNumber} is due`;
    case 2:
      return `Follow-up: Invoice ${data.invoiceNumber} — ${data.daysOverdue} days overdue`;
    case 3:
      return `Important: Invoice ${data.invoiceNumber} requires immediate attention`;
    case 4:
      return `URGENT: Invoice ${data.invoiceNumber} — Final Notice`;
    default:
      return `Invoice ${data.invoiceNumber} Payment Reminder`;
  }
}

export function generateBody(
  stage: StageConfig,
  tone: TonePreference,
  data: TemplateData
): string {
  const amount = formatCurrency(data.amount);

  switch (stage.stage) {
    case 1:
      return generateStage1(tone, data, amount);
    case 2:
      return generateStage2(tone, data, amount);
    case 3:
      return generateStage3(tone, data, amount);
    case 4:
      return generateStage4(tone, data, amount);
    default:
      return generateStage1(tone, data, amount);
  }
}

function generateStage1(tone: TonePreference, data: TemplateData, amount: string): string {
  if (tone === "friendly") {
    return `Hi ${data.clientName},

Hope you're doing well! Just a quick heads-up that invoice ${data.invoiceNumber} for ${amount} was due on ${data.dueDate}. It might have slipped through the cracks — no worries!

Could you take a moment to process the payment when you get a chance?

Thanks so much!
${data.companyName}`;
  }

  if (tone === "professional") {
    return `Dear ${data.clientName},

This is a courteous reminder that invoice ${data.invoiceNumber} for ${amount} was due on ${data.dueDate}. We would appreciate your prompt attention to this matter.

If payment has already been sent, please disregard this notice.

Best regards,
${data.companyName}`;
  }

  // firm
  return `Dear ${data.clientName},

Please be advised that invoice ${data.invoiceNumber} for ${amount} was due on ${data.dueDate} and is currently ${data.daysOverdue} day(s) overdue.

We request that payment be processed at your earliest convenience.

Regards,
${data.companyName}`;
}

function generateStage2(tone: TonePreference, data: TemplateData, amount: string): string {
  if (tone === "friendly") {
    return `Hi ${data.clientName},

We value our partnership and wanted to follow up on invoice ${data.invoiceNumber} for ${amount}. It's been ${data.daysOverdue} days since the due date of ${data.dueDate}.

Most of our clients find it helpful to set up recurring payments — happy to assist if that's something you'd find useful!

Looking forward to hearing from you.
${data.companyName}`;
  }

  if (tone === "professional") {
    return `Dear ${data.clientName},

As valued partners, we want to bring to your attention that invoice ${data.invoiceNumber} for ${amount} is now ${data.daysOverdue} days past due (original due date: ${data.dueDate}).

Timely payments help us maintain the quality of service you've come to expect. We would appreciate your prompt response.

Best regards,
${data.companyName}`;
  }

  // firm
  return `Dear ${data.clientName},

This is our second notice regarding invoice ${data.invoiceNumber} for ${amount}, which has been outstanding for ${data.daysOverdue} days past the due date of ${data.dueDate}.

Per our standard terms, we expect payment to be processed promptly. Please respond with a payment timeline.

Regards,
${data.companyName}`;
}

function generateStage3(tone: TonePreference, data: TemplateData, amount: string): string {
  if (tone === "friendly") {
    return `Hi ${data.clientName},

I'm reaching out again about invoice ${data.invoiceNumber} for ${amount} — it's been ${data.daysOverdue} days overdue now. I understand things get busy, but I wanted to make sure everything is okay on your end.

If there's an issue with the invoice or you need to discuss a payment plan, I'm here to help!

Please let me know.
${data.companyName}`;
  }

  if (tone === "professional") {
    return `Dear ${data.clientName},

This is an important reminder that invoice ${data.invoiceNumber} for ${amount} remains unpaid, now ${data.daysOverdue} days past the due date of ${data.dueDate}.

Please treat this matter as urgent. If there are any disputes or concerns, we ask that you contact us immediately so we can resolve them.

Failure to respond may result in escalation of this matter.

Best regards,
${data.companyName}`;
  }

  // firm
  return `Dear ${data.clientName},

IMPORTANT: Invoice ${data.invoiceNumber} for ${amount} is now ${data.daysOverdue} days overdue. Despite our previous reminders, we have not received payment or a response.

We require immediate payment or a written response outlining your payment plan within 48 hours. Without resolution, we will be forced to take further action.

Regards,
${data.companyName}`;
}

function generateStage4(tone: TonePreference, data: TemplateData, amount: string): string {
  if (tone === "friendly") {
    return `Hi ${data.clientName},

This is a final notice regarding invoice ${data.invoiceNumber} for ${amount}, which is now ${data.daysOverdue} days overdue. We've reached out several times and haven't heard back.

We'd really like to resolve this before taking any formal steps. Please reach out today so we can find a solution together.

Thank you for your attention to this.
${data.companyName}`;
  }

  if (tone === "professional") {
    return `Dear ${data.clientName},

FINAL NOTICE

Invoice ${data.invoiceNumber} for ${amount} has been outstanding for ${data.daysOverdue} days. This is our final attempt to resolve this matter amicably.

If full payment or a formal payment arrangement is not received within 5 business days, we will be compelled to escalate this matter to our collections department.

We strongly encourage you to contact us immediately to avoid further action.

Best regards,
${data.companyName}`;
  }

  // firm
  return `Dear ${data.clientName},

FINAL DEMAND

This serves as our final demand for payment of invoice ${data.invoiceNumber} in the amount of ${amount}, overdue by ${data.daysOverdue} days.

You have 5 business days from the date of this notice to remit full payment. Failure to do so will result in:
• Referral to our collections department
• Potential legal proceedings
• Reporting to credit agencies

Contact us immediately to make payment arrangements.

Regards,
${data.companyName}`;
}
