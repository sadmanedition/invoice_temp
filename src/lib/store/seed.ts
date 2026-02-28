import {
  createUser,
  createClient,
  createInvoice,
  simpleHash,
  getUsers,
} from "./local-store";

/**
 * Seeds the local store with demo data for testing.
 * Only runs if no users exist yet.
 */
export function seedDemoData(): void {
  const existingUsers = getUsers();
  if (existingUsers.length > 0) return;

  console.log("[Seed] Creating demo data...");

  // Create admin user
  const admin = createUser({
    email: "admin@invoicerecover.com",
    company_name: "InvoiceRecover HQ",
    role: "admin",
    password_hash: simpleHash("admin123"),
  });

  // Create customer user
  const customer = createUser({
    email: "demo@company.com",
    company_name: "Demo Corp",
    role: "customer",
    password_hash: simpleHash("demo123"),
  });

  // Create clients for the customer
  const client1 = createClient({
    user_id: customer.id,
    name: "Acme Industries",
    email: "billing@acme.com",
    phone: "+1 555-0101",
  });

  const client2 = createClient({
    user_id: customer.id,
    name: "TechStart LLC",
    email: "accounts@techstart.io",
    phone: "+1 555-0202",
  });

  const client3 = createClient({
    user_id: customer.id,
    name: "GlobalTrade Inc",
    email: "finance@globaltrade.com",
    phone: "+1 555-0303",
  });

  const client4 = createClient({
    user_id: customer.id,
    name: "QuickService Co",
    email: "pay@quickservice.co",
  });

  // Create invoices with various statuses
  const now = new Date();

  // Paid invoices (recovered)
  createInvoice({
    user_id: customer.id,
    client_id: client1.id,
    invoice_number: "INV-001",
    description: "Web development - Phase 1",
    amount: 5000,
    due_date: new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0],
    status: "paid",
  });

  createInvoice({
    user_id: customer.id,
    client_id: client2.id,
    invoice_number: "INV-002",
    description: "API Integration Services",
    amount: 3200,
    due_date: new Date(now.getTime() - 20 * 86400000).toISOString().split("T")[0],
    status: "paid",
  });

  // Overdue invoices
  createInvoice({
    user_id: customer.id,
    client_id: client3.id,
    invoice_number: "INV-003",
    description: "Consulting - Q4 2025",
    amount: 8500,
    due_date: new Date(now.getTime() - 12 * 86400000).toISOString().split("T")[0],
    status: "overdue",
  });

  createInvoice({
    user_id: customer.id,
    client_id: client1.id,
    invoice_number: "INV-004",
    description: "Web development - Phase 2",
    amount: 7200,
    due_date: new Date(now.getTime() - 5 * 86400000).toISOString().split("T")[0],
    status: "overdue",
  });

  createInvoice({
    user_id: customer.id,
    client_id: client4.id,
    invoice_number: "INV-005",
    description: "Monthly Maintenance",
    amount: 1500,
    due_date: new Date(now.getTime() - 2 * 86400000).toISOString().split("T")[0],
    status: "unpaid",
  });

  // Upcoming / current invoices
  createInvoice({
    user_id: customer.id,
    client_id: client2.id,
    invoice_number: "INV-006",
    description: "Mobile App Development",
    amount: 12000,
    due_date: new Date(now.getTime() + 5 * 86400000).toISOString().split("T")[0],
    status: "unpaid",
  });

  createInvoice({
    user_id: customer.id,
    client_id: client3.id,
    invoice_number: "INV-007",
    description: "Annual Support Contract",
    amount: 4800,
    due_date: new Date(now.getTime() + 15 * 86400000).toISOString().split("T")[0],
    status: "unpaid",
  });

  // Partial payment
  createInvoice({
    user_id: customer.id,
    client_id: client4.id,
    invoice_number: "INV-008",
    description: "Design System Overhaul",
    amount: 6000,
    due_date: new Date(now.getTime() - 8 * 86400000).toISOString().split("T")[0],
    status: "partial",
  });

  console.log("[Seed] Demo data created successfully!");
  console.log("[Seed] Admin login: admin@invoicerecover.com / admin123");
  console.log("[Seed] Customer login: demo@company.com / demo123");
}
