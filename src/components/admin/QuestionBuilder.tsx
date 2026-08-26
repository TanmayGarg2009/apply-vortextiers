"use client";

import React, { useState } from "react";
import { QuestionData, StaffPositionData, GameModeData, QuestionType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  GripVertical,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  Copy,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";

interface QuestionBuilderProps {
  initialQuestions: QuestionData[];
  positions: StaffPositionData[];
  gameModes: GameModeData[];
}

export function QuestionBuilder({
  initialQuestions,
  positions,
  gameModes,
}: QuestionBuilderProps) {
  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuestionData> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [saving, setSaving] = useState(false);

  const questionTypes: QuestionType[] = [
    "SHORT_TEXT",
    "PARAGRAPH",
    "MULTIPLE_CHOICE",
    "MULTIPLE_SELECT",
    "NUMBER",
    "URL",
    "FILE",
    "IMAGE",
    "VIDEO",
    "MINECRAFT_USERNAME",
    "DISCORD_USERNAME",
  ];

  const handleOpenCreate = () => {
    setEditingQuestion({
      title: "",
      description: "",
      type: "SHORT_TEXT",
      required: false,
      enabled: true,
      order: questions.length + 1,
      minLength: null,
      maxLength: null,
      minSelections: null,
      maxSelections: null,
      options: [],
      maxFiles: 1,
      maxFileSizeMb: 25,
    });
    setOptionsText("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (q: QuestionData) => {
    setEditingQuestion(q);
    setOptionsText(q.options ? q.options.join("\n") : "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingQuestion?.title) return;
    setSaving(true);

    try {
      const optionsArray = optionsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...editingQuestion,
        options: optionsArray.length > 0 ? optionsArray : null,
      };

      const isUpdate = !!editingQuestion.id;
      const res = await fetch("/api/admin/questions", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save question.");
      }

      const data = await res.json();
      if (isUpdate) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === data.question.id ? data.question : q))
        );
      } else {
        setQuestions((prev) => [...prev, data.question]);
      }
      setDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete.");
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleEnabled = async (q: QuestionData) => {
    try {
      const updated = { ...q, enabled: !q.enabled };
      const res = await fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to toggle state.");
      setQuestions((prev) => prev.map((item) => (item.id === q.id ? updated : item)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const moveOrder = async (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const list = [...questions];
    const currentItem = list[index];
    const targetItem = list[targetIndex];

    const currentOrder = currentItem.order;
    currentItem.order = targetItem.order;
    targetItem.order = currentOrder;

    list[index] = targetItem;
    list[targetIndex] = currentItem;

    setQuestions(list);

    // Save order changes
    await Promise.all([
      fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentItem),
      }),
      fetch("/api/admin/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetItem),
      }),
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Staff Application Question Builder
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure dynamic questions, validation constraints, and role-specific requirements.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 font-bold">
          <PlusCircle className="h-4 w-4" /> Add New Question
        </Button>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
              q.enabled
                ? "border-border/80 bg-card hover:border-border"
                : "border-border/40 bg-card/40 opacity-60"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="flex flex-col gap-1 text-muted-foreground">
                <button
                  disabled={idx === 0}
                  onClick={() => moveOrder(idx, "UP")}
                  className="hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={idx === questions.length - 1}
                  onClick={() => moveOrder(idx, "DOWN")}
                  className="hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary">#{q.order}</span>
                  <span className="font-bold text-sm text-foreground truncate">{q.title}</span>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {q.type}
                  </Badge>
                  {q.required && (
                    <Badge variant="destructive" className="text-[10px] py-0">
                      Required
                    </Badge>
                  )}
                  {q.positionId && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Position Specific
                    </span>
                  )}
                </div>

                {q.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xl">
                    {q.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 mr-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {q.enabled ? "Active" : "Disabled"}
                </span>
                <Switch checked={q.enabled} onCheckedChange={() => handleToggleEnabled(q)} />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenEdit(q)}
                className="h-8 text-xs gap-1"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(q.id)}
                className="h-8 text-xs text-destructive hover:bg-destructive/15"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT QUESTION DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion?.id ? "Edit Question" : "Create New Application Question"}
            </DialogTitle>
            <DialogDescription>
              Configure question metadata, validation, and applicability rules.
            </DialogDescription>
          </DialogHeader>

          {editingQuestion && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Question Title *</label>
                <Input
                  value={editingQuestion.title || ""}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, title: e.target.value })
                  }
                  placeholder="e.g. Past Staff / Tiering Experience"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Help Text / Description</label>
                <Input
                  value={editingQuestion.description || ""}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, description: e.target.value })
                  }
                  placeholder="Additional context or instructions for applicants"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Question Type *</label>
                  <select
                    value={editingQuestion.type || "SHORT_TEXT"}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        type: e.target.value as QuestionType,
                      })
                    }
                    className="w-full h-10 rounded-lg border border-border bg-secondary/40 px-3 text-xs text-foreground"
                  >
                    {questionTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Role Applicability</label>
                  <select
                    value={editingQuestion.positionId || ""}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        positionId: e.target.value || null,
                      })
                    }
                    className="w-full h-10 rounded-lg border border-border bg-secondary/40 px-3 text-xs text-foreground"
                  >
                    <option value="">Global (All Positions)</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Character Limit Constraints */}
              {(editingQuestion.type === "SHORT_TEXT" || editingQuestion.type === "PARAGRAPH") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-foreground block mb-1">Min Characters</label>
                    <Input
                      type="number"
                      value={editingQuestion.minLength || ""}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          minLength: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-foreground block mb-1">Max Characters</label>
                    <Input
                      type="number"
                      value={editingQuestion.maxLength || ""}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          maxLength: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
              )}

              {/* MCQ / Multi Select Options Builder */}
              {(editingQuestion.type === "MULTIPLE_CHOICE" ||
                editingQuestion.type === "MULTIPLE_SELECT") && (
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Selectable Options (One per line)
                  </label>
                  <Textarea
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={editingQuestion.required || false}
                    onCheckedChange={(checked) =>
                      setEditingQuestion({ ...editingQuestion, required: checked })
                    }
                  />
                  <span className="font-semibold text-foreground">Required Field</span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleSave} className="font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
