export type UserRole = "admin" | "customer";
export type InvoiceStatus = "paid" | "unpaid" | "overdue" | "partial";
export type InvoiceSource = "manual" | "stripe" | "api";
export type TonePreference = "friendly" | "professional" | "firm";
export type NotificationChannel = "email" | "sms" | "whatsapp";

export interface User {
  id: string;
  role: UserRole;
  email: string;
  company_name: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  source: InvoiceSource;
  stage: number;
  last_follow_up_sent_at: string | null;
  escalation_level: number;
  recovered_at: string | null;
  created_at: string;
  invoice_number: string | null;
  description: string | null;
  // Joined fields
  client?: Client;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  paid_at: string;
  created_at: string;
}

export interface FollowUpLog {
  id: string;
  invoice_id: string;
  stage: number;
  message_sent: string;
  channel: NotificationChannel;
  sent_at: string;
  // Joined fields
  invoice?: Invoice;
}

export interface UserSettings {
  id: string;
  user_id: string;
  follow_up_interval_hours: number;
  tone_preference: TonePreference;
  enabled_channels: NotificationChannel[];
  automation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "created_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at">;
        Update: Partial<Omit<Client, "id" | "created_at">>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, "id" | "created_at" | "stage" | "escalation_level" | "last_follow_up_sent_at" | "recovered_at">;
        Update: Partial<Omit<Invoice, "id" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at">;
        Update: Partial<Omit<Payment, "id" | "created_at">>;
      };
      follow_up_logs: {
        Row: FollowUpLog;
        Insert: Omit<FollowUpLog, "id">;
        Update: Partial<Omit<FollowUpLog, "id">>;
      };
      user_settings: {
        Row: UserSettings;
        Insert: Omit<UserSettings, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<UserSettings, "id" | "created_at" | "updated_at">>;
      };
    };
  };
}
