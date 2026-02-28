import { type NotificationAdapter, type NotificationPayload, type NotificationResult } from "../types";

/**
 * SMS Notification Adapter
 *
 * This is an abstract implementation that provides the interface
 * for SMS notifications. To use a real SMS provider, implement the
 * send method with your provider's SDK (e.g., Twilio, Vonage, etc.)
 *
 * Example Twilio implementation:
 * ```
 * import twilio from 'twilio';
 * const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
 * await client.messages.create({ body, from, to });
 * ```
 */
export class SmsAdapter implements NotificationAdapter {
  channel = "sms" as const;

  isConfigured(): boolean {
    // Return true when SMS provider credentials are set
    return !!(
      process.env.SMS_PROVIDER_KEY &&
      process.env.SMS_FROM_NUMBER
    );
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        channel: this.channel,
        error: "SMS adapter is not configured. Set SMS_PROVIDER_KEY and SMS_FROM_NUMBER env vars.",
      };
    }

    try {
      // TODO: Replace with actual SMS provider integration
      console.log(`[SMS] Would send to ${payload.to}: ${payload.subject}`);

      return {
        success: true,
        channel: this.channel,
        messageId: `sms-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        channel: this.channel,
        error: error instanceof Error ? error.message : "Unknown SMS error",
      };
    }
  }
}
