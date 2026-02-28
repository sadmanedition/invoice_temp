import fs from "fs";
import path from "path";
import type {
  User,
  Client,
  Invoice,
  Payment,
  FollowUpLog,
  UserSettings,
  InvoiceStatus,
  UserRole,
  NotificationChannel,
  TonePreference,
} from "@/lib/supabase/types";

const DATA_DIR = path.join(process.cwd(), ".data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateId(): string {
  // Use crypto.randomUUID if available, fallback to timestamp-based
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

function readTable<T>(table: string): T[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeTable<T>(table: string, data: T[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${table}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ============================================
// USERS
// ============================================

export function getUsers(): User[] {
  return readTable<User>("users");
}

export function getUserById(id: string): User | null {
  return getUsers().find((u) => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
  return getUsers().find((u) => u.email === email) || null;
}

export function createUser(data: {
  email: string;
  company_name?: string;
  role?: UserRole;
  password_hash: string;
}): User {
  const users = getUsers();
  const user: User & { password_hash: string } = {
    id: generateId(),
    email: data.email,
    role: data.role || "customer",
    company_name: data.company_name || null,
    created_at: new Date().toISOString(),
    password_hash: data.password_hash,
  };
  users.push(user);
  writeTable("users", users);

  // Auto-create user settings
  createUserSettings(user.id);

  // Return without password_hash
  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

export function updateUser(id: string, data: Partial<User>): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data };
  writeTable("users", users);
  return users[idx];
}

export function verifyPassword(email: string, password: string): User | null {
  const users = readTable<User & { password_hash: string }>("users");
  const user = users.find((u) => u.email === email);
  if (!user) return null;

  // Simple hash comparison (in production, use bcrypt)
  const hash = simpleHash(password);
  if (user.password_hash !== hash) return null;

  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

export function simpleHash(str: string): string {
  // Simple hash for local dev — NOT for production
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `local_hash_${Math.abs(hash).toString(36)}`;
}

// ============================================
// CLIENTS
// ============================================

export function getClients(userId?: string): Client[] {
  const clients = readTable<Client>("clients");
  if (userId) return clients.filter((c) => c.user_id === userId);
  return clients;
}

export function getClientById(id: string): Client | null {
  return readTable<Client>("clients").find((c) => c.id === id) || null;
}

export function getClientByEmail(email: string, userId: string): Client | null {
  return readTable<Client>("clients").find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.user_id === userId
  ) || null;
}

export function createClient(data: {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  stripe_id?: string;
}): Client {
  const clients = getClients();
  const client: any = {
    id: generateId(),
    user_id: data.user_id,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    created_at: new Date().toISOString(),
    ...(data.stripe_id ? { stripe_id: data.stripe_id } : {}),
  };
  clients.push(client);
  writeTable("clients", clients);
  return client;
}

// ============================================
// INVOICES
// ============================================

export function getInvoices(userId?: string): Invoice[] {
  const invoices = readTable<Invoice>("invoices");
  const clients = readTable<Client>("clients");

  const enriched = invoices.map((inv) => ({
    ...inv,
    client: clients.find((c) => c.id === inv.client_id) || undefined,
  }));

  if (userId) return enriched.filter((i) => i.user_id === userId);
  return enriched;
}

export function getInvoiceById(id: string): Invoice | null {
  return readTable<Invoice>("invoices").find((i) => i.id === id) || null;
}

export function getInvoiceByStripeId(stripeId: string): Invoice | null {
  return readTable<any>("invoices").find((i: any) => i.stripe_id === stripeId) || null;
}

export function getOverdueInvoices(): (Invoice & { client?: Client; user?: User })[] {
  const invoices = readTable<Invoice>("invoices");
  const clients = readTable<Client>("clients");
  const users = getUsers();
  const today = new Date().toISOString().split("T")[0];

  return invoices
    .filter((i) => i.status !== "paid" && i.due_date <= today)
    .map((inv) => ({
      ...inv,
      client: clients.find((c) => c.id === inv.client_id),
      user: users.find((u) => u.id === inv.user_id),
    }));
}

export function createInvoice(data: {
  user_id: string;
  client_id: string;
  invoice_number?: string;
  description?: string;
  amount: number;
  due_date: string;
  status?: InvoiceStatus;
  source?: "manual" | "stripe" | "api";
  stripe_id?: string;
}): Invoice {
  const invoices = readTable<Invoice>("invoices");
  const invoice: any = {
    id: generateId(),
    user_id: data.user_id,
    client_id: data.client_id,
    invoice_number: data.invoice_number || null,
    description: data.description || null,
    amount: data.amount,
    due_date: data.due_date,
    status: data.status || "unpaid",
    source: data.source || "manual",
    stage: 0,
    escalation_level: 0,
    last_follow_up_sent_at: null,
    recovered_at: null,
    created_at: new Date().toISOString(),
    ...(data.stripe_id ? { stripe_id: data.stripe_id } : {}),
  };
  invoices.push(invoice);
  writeTable("invoices", invoices);
  return invoice;
}

export function updateInvoice(id: string, data: Partial<Invoice>): Invoice | null {
  const invoices = readTable<Invoice>("invoices");
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  invoices[idx] = { ...invoices[idx], ...data };
  writeTable("invoices", invoices);
  return invoices[idx];
}

// ============================================
// PAYMENTS
// ============================================

export function getPayments(invoiceId?: string): Payment[] {
  const payments = readTable<Payment>("payments");
  if (invoiceId) return payments.filter((p) => p.invoice_id === invoiceId);
  return payments;
}

export function createPayment(data: {
  invoice_id: string;
  amount: number;
  paid_at?: string;
}): Payment {
  const payments = readTable<Payment>("payments");
  const payment: Payment = {
    id: generateId(),
    invoice_id: data.invoice_id,
    amount: data.amount,
    paid_at: data.paid_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  payments.push(payment);
  writeTable("payments", payments);

  // Auto-update invoice status (like the DB trigger)
  const allPayments = getPayments(data.invoice_id);
  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const invoice = getInvoiceById(data.invoice_id);

  if (invoice) {
    if (totalPaid >= Number(invoice.amount)) {
      updateInvoice(invoice.id, { status: "paid", recovered_at: new Date().toISOString() });
    } else if (totalPaid > 0) {
      updateInvoice(invoice.id, { status: "partial" });
    }
  }

  return payment;
}

// ============================================
// FOLLOW-UP LOGS
// ============================================

export function getFollowUpLogs(invoiceId?: string): FollowUpLog[] {
  const logs = readTable<FollowUpLog>("follow_up_logs");
  if (invoiceId) return logs.filter((l) => l.invoice_id === invoiceId);
  return logs;
}

export function getAllFollowUpLogs(limit: number = 50, offset: number = 0): any[] {
  const logs = readTable<FollowUpLog>("follow_up_logs");
  const invoices = readTable<Invoice>("invoices");
  const users = getUsers();

  return logs
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
    .slice(offset, offset + limit)
    .map((log) => {
      const invoice = invoices.find((i) => i.id === log.invoice_id);
      const user = invoice ? users.find((u) => u.id === invoice.user_id) : null;
      return {
        ...log,
        invoice: invoice
          ? { invoice_number: invoice.invoice_number, amount: invoice.amount, user: user ? { email: user.email } : null }
          : null,
      };
    });
}

export function createFollowUpLog(data: {
  invoice_id: string;
  stage: number;
  message_sent: string;
  channel: NotificationChannel;
  sent_at?: string;
}): FollowUpLog {
  const logs = readTable<FollowUpLog>("follow_up_logs");
  const log: FollowUpLog = {
    id: generateId(),
    invoice_id: data.invoice_id,
    stage: data.stage,
    message_sent: data.message_sent,
    channel: data.channel,
    sent_at: data.sent_at || new Date().toISOString(),
  };
  logs.push(log);
  writeTable("follow_up_logs", logs);
  return log;
}

// ============================================
// USER SETTINGS
// ============================================

export function getUserSettings(userId: string): UserSettings | null {
  const settings = readTable<UserSettings>("user_settings");
  return settings.find((s) => s.user_id === userId) || null;
}

export function createUserSettings(userId: string): UserSettings {
  const settings = readTable<UserSettings>("user_settings");

  const existing = settings.find((s) => s.user_id === userId);
  if (existing) return existing;

  const newSettings: UserSettings = {
    id: generateId(),
    user_id: userId,
    follow_up_interval_hours: 6,
    tone_preference: "professional",
    enabled_channels: ["email"],
    automation_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  settings.push(newSettings);
  writeTable("user_settings", settings);
  return newSettings;
}

export function updateUserSettings(
  userId: string,
  data: Partial<Omit<UserSettings, "id" | "user_id" | "created_at">>
): UserSettings | null {
  const settings = readTable<UserSettings>("user_settings");
  const idx = settings.findIndex((s) => s.user_id === userId);
  if (idx === -1) return null;
  settings[idx] = { ...settings[idx], ...data, updated_at: new Date().toISOString() };
  writeTable("user_settings", settings);
  return settings[idx];
}

// ============================================
// ALL INVOICES (Admin view with user data)
// ============================================

export function getAllInvoicesWithUsers(): any[] {
  const invoices = readTable<Invoice>("invoices");
  const clients = readTable<Client>("clients");
  const users = getUsers();

  return invoices.map((inv) => ({
    ...inv,
    client: clients.find((c) => c.id === inv.client_id) || null,
    user: (() => {
      const u = users.find((u) => u.id === inv.user_id);
      return u ? { email: u.email, company_name: u.company_name } : null;
    })(),
  }));
}

// ============================================
// ADMIN: Get all users with settings
// ============================================

export function getAllUsersWithSettings(): any[] {
  const users = getUsers();
  const allSettings = readTable<UserSettings>("user_settings");

  return users.map((u) => ({
    ...u,
    user_settings: allSettings.filter((s) => s.user_id === u.id),
  }));
}
