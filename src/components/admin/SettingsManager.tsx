"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Save, CheckCircle2, Loader2, Globe, Swords, ShieldCheck, Megaphone } from "lucide-react";

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
          <h1 className="text-2xl font-black tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Platform & Division Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Control recruitment policies, cooldown timers, and intake rules for Vortex Network & Vortex Tiers.
          </p>
        </div>

        <Button type="submit" disabled={saving} className="gap-2 font-bold font-mono text-xs">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </Button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 font-mono">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Division recruitment settings updated successfully.
        </div>
      )}

      {/* Vortex Network Policies */}
      <Card className="border-border/80 bg-[#121721] shadow-lg">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            <div>
              <CardTitle className="text-sm font-bold text-white font-mono uppercase">
                Vortex Network (Minecraft Server Staff) Rules
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Recruitment intake policies for Server Trial Staff, Moderators, and Developers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white block font-mono">Accepting Network Staff Applications</span>
              <span className="text-xs text-muted-foreground">
                When enabled, candidates can apply for open Vortex Network positions (Trial Staff).
              </span>
            </div>
            <Switch
              checked={settings.network_applications_open !== false}
              onCheckedChange={(checked) => setSettings({ ...settings, network_applications_open: checked })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-white block">Network Re-application Cooldown (Days)</label>
              <Input
                type="number"
                value={settings.network_cooldown_days || 14}
                onChange={(e) => setSettings({ ...settings, network_cooldown_days: parseInt(e.target.value, 10) || 14 })}
                min={1}
                max={365}
                className="bg-[#0e1218] border-border text-white"
              />
              <p className="text-[10px] text-muted-foreground">
                Mandatory waiting duration before a rejected network applicant can re-apply.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white block">Trial Staff Evaluation Period (Days)</label>
              <Input
                type="number"
                value={settings.trial_duration_days || 14}
                onChange={(e) => setSettings({ ...settings, trial_duration_days: parseInt(e.target.value, 10) || 14 })}
                min={1}
                max={90}
                className="bg-[#0e1218] border-border text-white"
              />
              <p className="text-[10px] text-muted-foreground">
                Standard probationary period for newly accepted trial staff before promotion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vortex Tiers Policies */}
      <Card className="border-border/80 bg-[#121721] shadow-lg">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-amber-400" />
            <div>
              <CardTitle className="text-sm font-bold text-white font-mono uppercase">
                Vortex Tiers (Tierlist Staff) Rules
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Recruitment intake policies for Tier Testers, Screensharers, and Helpers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white block font-mono">Accepting Tierlist Staff Applications</span>
              <span className="text-xs text-muted-foreground">
                When enabled, candidates can apply for Tier Tester, Screensharer, and Helper roles.
              </span>
            </div>
            <Switch
              checked={settings.tiers_applications_open !== false}
              onCheckedChange={(checked) => setSettings({ ...settings, tiers_applications_open: checked })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-white block">Tiers Re-application Cooldown (Days)</label>
              <Input
                type="number"
                value={settings.tiers_cooldown_days || 14}
                onChange={(e) => setSettings({ ...settings, tiers_cooldown_days: parseInt(e.target.value, 10) || 14 })}
                min={1}
                max={365}
                className="bg-[#0e1218] border-border text-white"
              />
              <p className="text-[10px] text-muted-foreground">
                Days a rejected tester or screensharer candidate must wait before re-applying.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-white block">Max Upload File Size (MB)</label>
              <Input
                type="number"
                value={settings.max_upload_size_mb || 150}
                onChange={(e) => setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value, 10) || 150 })}
                min={10}
                max={500}
                className="bg-[#0e1218] border-border text-white"
              />
              <p className="text-[10px] text-muted-foreground">
                Google Drive storage threshold per duel clip or screenshare attachment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Announcement Banner */}
      <Card className="border-border/80 bg-[#121721] shadow-lg">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-bold text-white font-mono uppercase">
              Global Announcement Banner
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-4 font-mono text-xs">
          <Input
            value={settings.announcement_banner || ""}
            onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
            placeholder="e.g. Recruitment is now open for Season 2026 Trial Staff and Tier Testers."
            className="bg-[#0e1218] border-border text-white"
          />
          <p className="text-[10px] text-muted-foreground">
            Leave blank to hide the banner on the public portal.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
