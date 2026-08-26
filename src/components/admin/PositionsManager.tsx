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
import { PlusCircle, Edit2, Trash2, Shield, Loader2 } from "lucide-react";

interface PositionsManagerProps {
  initialPositions: StaffPositionData[];
}

export function PositionsManager({ initialPositions }: PositionsManagerProps) {
  const [positions, setPositions] = useState<StaffPositionData[]>(initialPositions);
  const [editing, setEditing] = useState<Partial<StaffPositionData> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditing({
      name: "",
      slug: "",
      description: "",
      requiredEvidence: false,
      enabled: true,
      order: positions.length + 1,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: StaffPositionData) => {
    setEditing(p);
    setDialogOpen(true);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Staff Positions Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Define available staff roles, duties, evidence requirements, and ordering.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 font-bold">
          <PlusCircle className="h-4 w-4" /> Add Staff Role
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {positions.map((pos) => (
          <div
            key={pos.id}
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-foreground">{pos.name}</span>
                <span className="font-mono text-xs text-muted-foreground">Order: #{pos.order}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{pos.description}</p>
              {pos.requiredEvidence && (
                <Badge variant="outline" className="text-[10px] text-amber-400 font-mono">
                  Evidence Required
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button size="sm" variant="outline" onClick={() => handleOpenEdit(pos)} className="h-8 text-xs gap-1">
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(pos.id)} className="h-8 text-xs text-destructive hover:bg-destructive/15">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Position Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Position" : "Create Staff Position"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Position Name *</label>
                <Input
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Tier Tester"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">URL Slug *</label>
                <Input
                  value={editing.slug || ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="e.g. tier-tester"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Description</label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Role description and responsibilities..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={editing.requiredEvidence || false}
                    onCheckedChange={(checked) => setEditing({ ...editing, requiredEvidence: checked })}
                  />
                  <span className="font-semibold text-foreground">Require Evidence Uploads</span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleSave} className="font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
