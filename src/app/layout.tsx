import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvoiceRecover — Automated Invoice Recovery System",
  description: "Recover unpaid invoices with psychology-based automated follow-ups. Track outstanding payments, send staged reminders, and maximize revenue recovery.",
  keywords: ["invoice recovery", "payment automation", "accounts receivable", "debt collection", "invoice management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
