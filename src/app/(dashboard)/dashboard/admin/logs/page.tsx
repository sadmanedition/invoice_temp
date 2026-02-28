"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Activity, Mail, MessageSquare, Phone } from "lucide-react";

interface LogEntry {
  id: string;
  invoice_id: string;
  stage: number;
  message_sent: string;
  channel: string;
  sent_at: string;
  invoice?: {
    invoice_number: string;
    amount: number;
    user?: { email: string };
  };
}

const channelIcons: Record<string, React.FC<{ className?: string }>> = {
  email: Mail,
  sms: Phone,
  whatsapp: MessageSquare,
};

const stageNames: Record<number, string> = {
  1: "Friendly Reminder",
  2: "Social Framing",
  3: "Firm Reminder",
  4: "Escalation",
};

const stageColors: Record<number, "success" | "secondary" | "warning" | "destructive"> = {
  1: "success",
  2: "secondary",
  3: "warning",
  4: "destructive",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch("/api/admin/logs?limit=100");
      if (res.ok) setLogs(await res.json());
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground">Follow-up activity across all users</p>
      </div>

      <Card className="glass-card">
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Activity className="h-10 w-10 opacity-50" />
              <p>No follow-up activity yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const ChannelIcon = channelIcons[log.channel] || Mail;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.sent_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.invoice?.invoice_number || log.invoice_id?.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.invoice?.user?.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stageColors[log.stage] || "secondary"}>
                          {stageNames[log.stage] || `Stage ${log.stage}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="capitalize text-sm">{log.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                        {log.message_sent.slice(0, 100)}...
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
