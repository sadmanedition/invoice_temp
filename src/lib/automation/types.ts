import { type NotificationChannel } from "@/lib/supabase/types";

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
  invoiceId: string;
  clientName: string;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

export interface NotificationAdapter {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<NotificationResult>;
  isConfigured(): boolean;
}

export interface StageConfig {
  stage: number;
  name: string;
  minDaysOverdue: number;
  maxDaysOverdue: number;
  escalationLevel: number;
  toneDescriptions: {
    friendly: string;
    professional: string;
    firm: string;
  };
}

export interface FollowUpDecision {
  shouldSend: boolean;
  stage: StageConfig | null;
  reason: string;
}
