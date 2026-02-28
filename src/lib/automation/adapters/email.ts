import nodemailer from "nodemailer";
import { type NotificationAdapter, type NotificationPayload, type NotificationResult } from "../types";

export class EmailAdapter implements NotificationAdapter {
  channel = "email" as const;

  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  isConfigured(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        channel: this.channel,
        error: "Email adapter is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.",
      };
    }

    try {
      const info = await this.getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: payload.body.replace(/\n/g, "<br>"),
      });

      return {
        success: true,
        channel: this.channel,
        messageId: info.messageId,
      };
    } catch (error) {
      return {
        success: false,
        channel: this.channel,
        error: error instanceof Error ? error.message : "Unknown email error",
      };
    }
  }
}
