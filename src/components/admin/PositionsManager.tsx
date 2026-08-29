"use client";

import React, { useState } from "react";
import { StaffPositionData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  Edit2,
  Trash2,
  Shield,
  Loader2,
  Globe,
  Swords,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

interface PositionsManagerProps {
  initialPositions: StaffPositionData[];
}

export function PositionsManager({ initialPositions }: PositionsManagerProps) {
  const [positions, setPositions] = useState<StaffPositionData[]>(initialPositions);
  const [activeTab, setActiveTab] = useState<"NETWORK" | "TIERS">("NETWORK");
  const [editing, setEditing] = useState<Partial<StaffPositionData> & { sector?: "NETWORK" | "TIERS" } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isTiersPosition = (p: StaffPositionData) =>
    p.slug === "tier-tester" ||
    p.slug === "screensharer" ||
    p.slug === "tiers-helper" ||
    p.name.toLowerCase().includes("tier") ||
    p.name.toLowerCase().includes("screenshar");

  const networkPositions = positions.filter((p) => !isTiersPosition(p));
  const tiersPositions = positions.filter((p) => isTiersPosition(p));

  const handleOpenCreate = (defaultSector = activeTab) => {
    setEditing({
      name: "",
      slug: "",
      description: "",
      requiredEvidence: false,
      enabled: defaultSector === "TIERS",
      order: positions.length + 1,
      sector: defaultSector,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: StaffPositionData) => {
    setEditing({
      ...p,
      sector: isTiersPosition(p) ? "TIERS" : "NETWORK",
    });
    setDialogOpen(true);
  };

  const handleToggleEnabled = async (p: StaffPositionData) => {
    const updated = { ...p, enabled: !p.enabled };
    setPositions((prev) => prev.map((item) => (item.id === p.id ? updated : item)));

    try {
      await fetch("/api/admin/positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err: any) {
      alert("Failed to toggle position status.");
    }
  };

  const handleSave = async () => {
    if (!editing?.name || !editing?.slug) return;
    setSaving(true);

    try {
      const isUpdate = !!editing.id;
      const res = await fetch("/api/admin/positions", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });

      if (!res.ok) throw new Error("Failed to save staff position.");

      const data = await res.json();
      if (isUpdate) {
        setPositions((prev) =>
          prev.map((item) => (item.id === data.position.id ? data.position : item))
        );
      } else {
        setPositions((prev) => [...prev, data.position]);
      }
      setDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return;
    try {
      await fetch(`/api/admin/positions?id=${id}`, { method: "DELETE" });
      setPositions((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentList = activeTab === "NETWORK" ? networkPositions : tiersPositions;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Staff Positions & Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Configure recruitment availability, evidence requirements, and duties for each server division.
          </p>
        </div>

        <Button onClick={() => handleOpenCreate(activeTab)} className="gap-2 font-bold font-mono text-xs">
          <PlusCircle className="h-4 w-4" /> Add Role to {activeTab === "NETWORK" ? "Network" : "Tiers"}
        </Button>
      </div>

      {/* Sector Tabs */}
      <div className="flex items-center rounded-xl bg-[#0e1218] p-1.5 border border-border/80 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab("NETWORK")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === "NETWORK"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Globe className="h-4 w-4 text-blue-400" /> Vortex Network Roles ({networkPositions.length})
        </button>

        <button
          onClick={() => setActiveTab("TIERS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === "TIERS"
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Swords className="h-4 w-4 text-amber-400" /> Vortex Tiers Roles ({tiersPositions.length})
        </button>
      </div>

      {/* Sector Info Alert */}
      <div className="rounded-xl border border-border/80 bg-[#121721] p-4 text-xs font-mono text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab === "NETWORK" ? (
            <Globe className="h-4 w-4 text-blue-400 shrink-0" />
          ) : (
            <Swords className="h-4 w-4 text-amber-400 shrink-0" />
          )}
          <span>
            {activeTab === "NETWORK"
              ? "Vortex Network: By default, public applicants can apply for Trial Staff. Open additional positions when hiring developers, moderators, or managers."
              : "Vortex Tiers: Tier Tester, Screensharer, and Helper positions. Candidates test players or verify clients in official 1v1 tier disciplines."}
          </span>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentList.map((pos) => (
          <div
            key={pos.id}
            className={`flex flex-col justify-between rounded-2xl border p-5 space-y-4 transition-all ${
              pos.enabled
                ? "border-border/80 bg-[#121721] shadow-md"
                : "border-border/40 bg-[#0e1218] opacity-75"
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white font-mono">{pos.name}</span>
                  {pos.enabled ? (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 font-mono">
                      Open for Applications
                    </span>
                  ) : (
                    <span className="rounded-full bg-secondary/80 border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground font-mono">
                      Closed / Internal
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground">Order #{pos.order}</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed font-sans">{pos.description}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  Slug: {pos.slug}
                </Badge>
                {pos.requiredEvidence && (
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/40 bg-amber-500/10 font-mono">
                    Clips / Evidence Required
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Switch
                  checked={pos.enabled}
                  onCheckedChange={() => handleToggleEnabled(pos)}
                />
                <span className="text-[11px] font-mono text-muted-foreground">
                  {pos.enabled ? "Open" : "Closed"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(pos)}
                  className="h-7 text-xs font-mono gap-1"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(pos.id)}
                  className="h-7 text-xs text-destructive hover:bg-destructive/15"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Position Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#121721] border-border text-white">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg text-white">
              {editing?.id ? `Edit ${editing.name}` : `Create ${editing?.sector === "NETWORK" ? "Network" : "Tiers"} Staff Role`}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2 text-xs font-mono">
              <div>
                <label className="font-bold text-white block mb-1">Division Sector</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, sector: "NETWORK" })}
                    className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                      editing.sector === "NETWORK"
                        ? "border-blue-500 bg-blue-500/20 text-white font-bold"
                        : "border-border bg-[#0e1218] text-muted-foreground"
                    }`}
                  >
                    Vortex Network
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, sector: "TIERS" })}
                    className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                      editing.sector === "TIERS"
                        ? "border-amber-500 bg-amber-500/20 text-white font-bold"
                        : "border-border bg-[#0e1218] text-muted-foreground"
                    }`}
                  >
                    Vortex Tiers
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Role Title *</label>
                <Input
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Trial Staff, Screensharer..."
                  className="bg-[#0e1218] border-border text-white"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1">System Slug *</label>
                <Input
                  value={editing.slug || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  placeholder="e.g. trial-staff"
                  className="bg-[#0e1218] border-border text-white"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Role Duties & Description</label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Responsibilities and guidelines for this role..."
                  rows={3}
                  className="bg-[#0e1218] border-border text-white"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch
                    checked={editing.enabled ?? true}
                    onCheckedChange={(checked) => setEditing({ ...editing, enabled: checked })}
                  />
                  <span className="font-bold text-white">Open for Candidate Applications</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Switch
                    checked={editing.requiredEvidence || false}
                    onCheckedChange={(checked) => setEditing({ ...editing, requiredEvidence: checked })}
                  />
                  <span className="font-bold text-white">Require Video Clips / Verification Evidence</span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-mono text-xs">
              Cancel
            </Button>
            <Button
              disabled={saving}
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono text-xs gap-1.5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
