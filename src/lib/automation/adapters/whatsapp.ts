import { type NotificationAdapter, type NotificationPayload, type NotificationResult } from "../types";

/**
 * WhatsApp Notification Adapter
 *
 * This is an abstract implementation that provides the interface
 * for WhatsApp notifications. To use a real provider, implement the
 * send method with your provider's SDK (e.g., Twilio WhatsApp, Meta Business API, etc.)
 *
 * Example Meta Business API:
 * ```
 * const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } })
 * });
 * ```
 */
export class WhatsAppAdapter implements NotificationAdapter {
  channel = "whatsapp" as const;

  isConfigured(): boolean {
    return !!(
      process.env.WHATSAPP_API_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID
    );
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        channel: this.channel,
        error: "WhatsApp adapter is not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars.",
      };
    }

    try {
      // TODO: Replace with actual WhatsApp provider integration
      console.log(`[WhatsApp] Would send to ${payload.to}: ${payload.subject}`);

      return {
        success: true,
        channel: this.channel,
        messageId: `wa-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        channel: this.channel,
        error: error instanceof Error ? error.message : "Unknown WhatsApp error",
      };
    }
  }
}
