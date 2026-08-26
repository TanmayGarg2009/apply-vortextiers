"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Save, CheckCircle2, Loader2 } from "lucide-react";

interface SettingsManagerProps {
  initialSettings: Record<string, any>;
}

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const [settings, setSettings] = useState<Record<string, any>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to update settings.");

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Platform Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Global operational controls, application submission toggles, and limits.
          </p>
        </div>

        <Button type="submit" disabled={saving} className="gap-2 font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Settings updated successfully.
        </div>
      )}

      {/* Global Toggles */}
      <Card className="border-border/80 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold">Application System Status</CardTitle>
          <CardDescription>
            Control public submission access and applicant cooldown policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-foreground block">Accepting Staff Applications</span>
              <span className="text-xs text-muted-foreground">
                When turned off, applicants see the closed notice and cannot start or submit applications.
              </span>
            </div>
            <Switch
              checked={settings.applications_open !== false}
              onCheckedChange={(checked) => setSettings({ ...settings, applications_open: checked })}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-foreground block">Allow Re-application after Cooldown</span>
              <span className="text-xs text-muted-foreground">
                Allow rejected applicants to re-apply once the cooldown duration has passed.
              </span>
            </div>
            <Switch
              checked={settings.resubmissions_allowed !== false}
              onCheckedChange={(checked) => setSettings({ ...settings, resubmissions_allowed: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Numerical Constraints */}
      <Card className="border-border/80 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold">Cooldowns & File Upload Limits</CardTitle>
          <CardDescription>
            Configure timing restrictions and Google Drive storage limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-foreground block">Re-application Cooldown (Days)</label>
            <Input
              type="number"
              value={settings.cooldown_days || 14}
              onChange={(e) => setSettings({ ...settings, cooldown_days: parseInt(e.target.value, 10) || 14 })}
              min={1}
              max={365}
            />
            <p className="text-[11px] text-muted-foreground">
              Days an applicant must wait after being rejected before submitting a new application.
            </p>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-foreground block">Max File Upload Size (MB)</label>
            <Input
              type="number"
              value={settings.max_upload_size_mb || 150}
              onChange={(e) => setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value, 10) || 150 })}
              min={5}
              max={500}
            />
            <p className="text-[11px] text-muted-foreground">
              Maximum allowable size for single gameplay video or image attachments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Announcement Banner */}
      <Card className="border-border/80 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-bold">Public Announcement Banner</CardTitle>
          <CardDescription>
            Banner text displayed prominently on the public homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <Input
            value={settings.announcement_banner || ""}
            onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
            placeholder="e.g. Applications for Season 2026 Tier Testers are currently OPEN."
          />
          <p className="text-[11px] text-muted-foreground">
            Leave blank to hide the announcement pill on the home page.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
