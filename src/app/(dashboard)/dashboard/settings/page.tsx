"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  Bell,
  Clock,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Copy,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { UserSettings, TonePreference, NotificationChannel } from "@/lib/supabase/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stripe
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState("");
  const [copied, setCopied] = useState(false);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/stripe`
    : "/api/webhooks/stripe";

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await fetch("/api/settings");
      if (res.ok) {
        setSettings(await res.json());
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        follow_up_interval_hours: settings.follow_up_interval_hours,
        tone_preference: settings.tone_preference,
        enabled_channels: settings.enabled_channels,
        automation_enabled: settings.automation_enabled,
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleStripeSync = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncResult(null);

    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setSyncError(data.error || "Sync failed");
      } else {
        setSyncResult(data);
      }
    } catch {
      setSyncError("Failed to connect to Stripe");
    } finally {
      setSyncing(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleChannel = (channel: NotificationChannel) => {
    if (!settings) return;
    const channels = settings.enabled_channels.includes(channel)
      ? settings.enabled_channels.filter((c) => c !== channel)
      : [...settings.enabled_channels, channel];
    setSettings({ ...settings, enabled_channels: channels });
  };

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground">Loading settings...</div>
    );
  }

  if (!settings) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground">Failed to load settings</div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your invoice recovery preferences</p>
      </div>

      {/* Stripe Integration */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Stripe Integration</CardTitle>
          </div>
          <CardDescription>
            Connect Stripe to automatically sync invoices and detect payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Webhook URL */}
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add this URL in your Stripe Dashboard → Developers → Webhooks
            </p>
          </div>

          {/* Setup instructions */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm space-y-2">
            <p className="font-medium text-primary">Setup Instructions:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
              <li>Add <code className="px-1 py-0.5 rounded bg-muted">STRIPE_SECRET_KEY</code> to your <code className="px-1 py-0.5 rounded bg-muted">.env</code> file</li>
              <li>Add <code className="px-1 py-0.5 rounded bg-muted">STRIPE_WEBHOOK_SECRET</code> to your <code className="px-1 py-0.5 rounded bg-muted">.env</code> file</li>
              <li>Register the webhook URL above in Stripe Dashboard</li>
              <li>Select events: <code className="px-1 py-0.5 rounded bg-muted">invoice.*</code> and <code className="px-1 py-0.5 rounded bg-muted">customer.*</code></li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              For local testing: <code className="px-1 py-0.5 rounded bg-muted">stripe listen --forward-to {webhookUrl}</code>
            </p>
          </div>

          {/* Sync Button */}
          <div className="flex items-center gap-3">
            <Button onClick={handleStripeSync} disabled={syncing} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
            {syncResult && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500">
                  {syncResult.synced} new, {syncResult.updated} updated
                </span>
              </div>
            )}
            {syncError && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">{syncError}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Automation Toggle */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Automation Engine</CardTitle>
              <CardDescription>Enable or disable automated follow-ups</CardDescription>
            </div>
            <Switch
              checked={settings.automation_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, automation_enabled: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Follow-up Timing */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Follow-up Timing</CardTitle>
          </div>
          <CardDescription>How often the system checks for overdue invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="interval">Check interval (hours)</Label>
            <Input
              id="interval"
              type="number"
              min={1}
              max={168}
              value={settings.follow_up_interval_hours}
              onChange={(e) =>
                setSettings({ ...settings, follow_up_interval_hours: parseInt(e.target.value) || 6 })
              }
            />
            <p className="text-xs text-muted-foreground">
              The engine will process overdue invoices every {settings.follow_up_interval_hours} hours
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tone Preference */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Message Tone</CardTitle>
          </div>
          <CardDescription>Set the overall tone for follow-up messages</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.tone_preference}
            onValueChange={(v) => setSettings({ ...settings, tone_preference: v as TonePreference })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">🤝 Friendly — Warm and approachable</SelectItem>
              <SelectItem value="professional">💼 Professional — Business-appropriate</SelectItem>
              <SelectItem value="firm">⚡ Firm — Direct and assertive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Notification Channels</CardTitle>
          </div>
          <CardDescription>Choose how follow-ups are delivered</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["email", "sms", "whatsapp"] as NotificationChannel[]).map((channel) => (
            <div key={channel} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium capitalize">{channel}</span>
                {channel !== "email" && (
                  <Badge variant="outline" className="text-xs">Coming soon</Badge>
                )}
              </div>
              <Switch
                checked={settings.enabled_channels.includes(channel)}
                onCheckedChange={() => toggleChannel(channel)}
                disabled={channel !== "email"}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
        {saved && (
          <span className="text-sm text-emerald-500 animate-fade-in">Settings saved successfully!</span>
        )}
      </div>
    </div>
  );
}
