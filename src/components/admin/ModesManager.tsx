"use client";

import React, { useState } from "react";
import { GameModeData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeBadge } from "@/components/shared/ModeBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle, Edit2, Trash2, Gamepad2, Loader2 } from "lucide-react";

interface ModesManagerProps {
  initialModes: GameModeData[];
}

export function ModesManager({ initialModes }: ModesManagerProps) {
  const [modes, setModes] = useState<GameModeData[]>(initialModes);
  const [editing, setEditing] = useState<Partial<GameModeData> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditing({
      name: "",
      slug: "",
      description: "",
      enabled: true,
      order: modes.length + 1,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (m: GameModeData) => {
    setEditing(m);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing?.name || !editing?.slug) return;
    setSaving(true);

    try {
      const isUpdate = !!editing.id;
      const res = await fetch("/api/admin/modes", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });

      if (!res.ok) throw new Error("Failed to save mode.");

      const data = await res.json();
      if (isUpdate) {
        setModes((prev) =>
          prev.map((item) => (item.id === data.mode.id ? data.mode : item))
        );
      } else {
        setModes((prev) => [...prev, data.mode]);
      }
      setDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game mode?")) return;
    try {
      await fetch(`/api/admin/modes?id=${id}`, { method: "DELETE" });
      setModes((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" /> Supported PvP Game Modes
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage supported Minecraft PvP tiering disciplines in the Vortex Tiers ecosystem.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 font-bold">
          <PlusCircle className="h-4 w-4" /> Add Game Mode
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <ModeBadge slug={mode.slug} name={mode.name} />
              <span className="font-mono text-[11px] text-muted-foreground">Order: #{mode.order}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed min-h-[32px]">
              {mode.description || "No description provided."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button size="sm" variant="outline" onClick={() => handleOpenEdit(mode)} className="h-7 text-xs gap-1">
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(mode.id)} className="h-7 text-xs text-destructive hover:bg-destructive/15">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Mode Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Game Mode" : "Add New Game Mode"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Mode Display Name *</label>
                <Input
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Netherite Pot"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">URL Slug *</label>
                <Input
                  value={editing.slug || ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="e.g. neth-pot"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Description</label>
                <Input
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="e.g. Netherite Armor & Splash Potion PvP"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleSave} className="font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Mode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
