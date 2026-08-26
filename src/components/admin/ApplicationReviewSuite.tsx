"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationData, SessionUser, ApplicationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ModeBadge } from "@/components/shared/ModeBadge";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate, formatBytes } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  History,
  FileText,
  ExternalLink,
  Shield,
  Film,
  Image as ImageIcon,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ApplicationReviewSuiteProps {
  application: ApplicationData;
  currentUser: SessionUser;
}

export function ApplicationReviewSuite({
  application: initialApp,
  currentUser,
}: ApplicationReviewSuiteProps) {
  const router = useRouter();
  const [app, setApp] = useState<ApplicationData>(initialApp);

  // Status Action Modals
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [acceptanceMessage, setAcceptanceMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Internal Notes State
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Email Retry State
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);

  // Media Lightbox
  const [activeMediaUrl, setActiveMediaUrl] = useState<{ url: string; type: "IMAGE" | "VIDEO"; filename: string } | null>(null);

  const handleStatusChange = async (
    newStatus: ApplicationStatus,
    payload?: { acceptanceMessage?: string; rejectionReason?: string; note?: string }
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/applications/${app.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...payload,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status.");
      }

      const data = await res.json();
      setApp(data.application);
      setAcceptDialogOpen(false);
      setRejectDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Error updating application status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setAddingNote(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          content: noteContent.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add note.");

      const data = await res.json();
      setApp((prev) => ({
        ...prev,
        adminNotes: [data.note, ...(prev.adminNotes || [])],
      }));
      setNoteContent("");
    } catch (err: any) {
      alert(err.message || "Error adding note.");
    } finally {
      setAddingNote(false);
    }
  };

  const handleRetryEmail = async (emailEventId: string) => {
    setRetryingEmailId(emailEventId);
    try {
      const res = await fetch("/api/admin/email-retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEventId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to retry email delivery.");
      }

      alert("Email re-sent successfully.");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Email retry failed.");
    } finally {
      setRetryingEmailId(null);
    }
  };

  const isDecided = app.status === "ACCEPTED" || app.status === "REJECTED";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Sticky Action Top Bar */}
      <div className="sticky top-16 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/90 bg-[#121722]/95 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-black text-primary">
            {app.id}
          </span>
          <StatusBadge status={app.status} />
          {app.mode && <ModeBadge slug={app.mode.slug} name={app.mode.name} />}
        </div>

        {/* Reviewer Action Buttons */}
        <div className="flex items-center gap-2">
          {app.status === "SUBMITTED" && (
            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={() => handleStatusChange("UNDER_REVIEW")}
              className="border-blue-500/40 text-blue-300 hover:bg-blue-500/15"
            >
              <Clock className="h-3.5 w-3.5 mr-1" /> Move to Under Review
            </Button>
          )}

          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => setAcceptDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-sm shadow-emerald-950"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Accept Application
          </Button>

          <Button
            size="sm"
            variant="destructive"
            disabled={actionLoading}
            onClick={() => setRejectDialogOpen(true)}
            className="font-bold gap-1.5"
          >
            <XCircle className="h-3.5 w-3.5" /> Reject Application
          </Button>
        </div>
      </div>

      {/* Main Review Grid: Left Column (Answers & Evidence) / Right Column (Sidebar: Profile, Notes, History) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Answers & Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Staff Role Application
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Submitted {formatDate(app.submittedAt || app.createdAt)}
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-foreground mt-1">
                {app.position?.name || "Staff"} Position
              </CardTitle>
              <CardDescription>
                {app.position?.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Submitted Responses (Using immutable question snapshots) */}
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Submitted Applicant Responses ({(app.answers || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {(app.answers || []).length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">No answers recorded.</p>
              ) : (
                (app.answers || []).map((ans, idx) => {
                  const q = ans.questionSnapshot || ans.question;
                  return (
                    <div
                      key={ans.id || idx}
                      className="rounded-xl border border-border/70 bg-secondary/30 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground font-mono">
                          Q{idx + 1}: {q?.title || "Question"}
                        </span>
                        {q?.type && (
                          <span className="text-[10px] font-mono text-muted-foreground/70 uppercase">
                            {q.type}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-card/50 p-3 rounded-lg border border-border/50">
                        {ans.value || (ans.selectedOptions ? ans.selectedOptions.join(", ") : "—")}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Evidence Media Gallery */}
          {(app.uploads || []).length > 0 && (
            <Card className="border-border/80 bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Film className="h-4 w-4 text-primary" />
                  Attached Evidence & Media ({app.uploads?.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {app.uploads?.map((file) => {
                    const isVideo = file.mimeType.startsWith("video/");
                    const isImage = file.mimeType.startsWith("image/");
                    const mediaStreamUrl = `/api/drive/file/${file.googleDriveFileId}`;

                    return (
                      <div
                        key={file.id}
                        className="flex flex-col rounded-xl border border-border/80 bg-secondary/30 overflow-hidden"
                      >
                        {/* Video / Image Embedded Preview */}
                        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                          {isVideo ? (
                            <video
                              src={mediaStreamUrl}
                              controls
                              preload="metadata"
                              className="h-full w-full object-contain"
                            />
                          ) : isImage ? (
                            <img
                              src={mediaStreamUrl}
                              alt={file.filename}
                              className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() =>
                                setActiveMediaUrl({ url: mediaStreamUrl, type: "IMAGE", filename: file.filename })
                              }
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                              <FileText className="h-8 w-8 text-primary" />
                              <span className="text-xs font-mono">{file.filename}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 flex items-center justify-between">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-foreground truncate">
                              {file.filename}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatBytes(file.sizeBytes)} • {file.category}
                            </span>
                          </div>

                          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                            <a href={mediaStreamUrl} target="_blank" rel="noreferrer">
                              Open <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (1 Col): Profile, Private Notes, Timeline, Email Logs */}
        <div className="space-y-6">
          {/* Applicant Identity Sidebar Card */}
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Applicant Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center font-bold">
                  {app.user?.discordAvatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${app.user.discordId}/${app.user.discordAvatar}.png`}
                      alt={app.user.discordUsername}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    app.user?.discordUsername.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-foreground text-sm truncate">
                    {app.user?.discordGlobalName || app.user?.discordUsername}
                  </span>
                  <span className="text-muted-foreground font-mono">@{app.user?.discordUsername}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Discord Snowflake ID</span>
                  <span className="font-mono font-bold text-foreground">{app.discordId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Verified Email</span>
                  <span className="font-mono text-foreground truncate block">{app.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Minecraft IGN</span>
                  <div className="flex items-center gap-2 mt-1">
                    <MinecraftAvatar username={app.minecraftUsername} size={20} />
                    <span className="font-mono font-bold text-foreground">
                      {app.minecraftUsername || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Internal Private Notes Thread (Isolated from applicant) */}
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                Staff Internal Notes (Private)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add private staff note or second reviewer remarks..."
                  rows={2}
                  className="text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingNote || !noteContent.trim()}
                  className="w-full h-8 text-xs font-bold gap-1"
                >
                  {addingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Add Private Note
                </Button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pt-2 divide-y divide-border/40">
                {(app.adminNotes || []).length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic py-2 text-center">
                    No staff notes yet.
                  </p>
                ) : (
                  (app.adminNotes || []).map((note) => (
                    <div key={note.id} className="pt-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300">
                          {note.author.discordGlobalName || note.author.discordUsername}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status History & Audit Log */}
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Status History Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              {(app.statusHistory || []).map((sh) => (
                <div key={sh.id} className="flex flex-col gap-1 border-l-2 border-primary/40 pl-3 py-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-foreground text-[11px]">
                      {sh.fromStatus} → {sh.toStatus}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(sh.createdAt)}
                    </span>
                  </div>
                  {sh.note && <p className="text-muted-foreground text-[11px]">{sh.note}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email Delivery Audit & Retry Panel */}
          {(app.emailEvents || []).length > 0 && (
            <Card className="border-border/80 bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-amber-400" /> Transactional Email Log
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                {(app.emailEvents || []).map((evt) => (
                  <div
                    key={evt.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-secondary/30 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-foreground">
                        {evt.type}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          evt.status === "SENT"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Attempts: {evt.attempts}</span>
                      <span>{formatDate(evt.sentAt || evt.failedAt || evt.createdAt)}</span>
                    </div>

                    {evt.error && (
                      <p className="text-[10px] text-destructive font-mono">{evt.error}</p>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={retryingEmailId === evt.id}
                      onClick={() => handleRetryEmail(evt.id)}
                      className="h-6 text-[10px] font-bold gap-1 mt-1"
                    >
                      {retryingEmailId === evt.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      Resend Email Notification
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ACCEPT DIALOG */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Accept Staff Application
            </DialogTitle>
            <DialogDescription>
              Accepting will update the application status to <strong>ACCEPTED</strong> and dispatch an acceptance email notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-bold text-foreground block">
              Optional Welcome Remarks / Next Steps (Included in Email)
            </label>
            <Textarea
              value={acceptanceMessage}
              onChange={(e) => setAcceptanceMessage(e.target.value)}
              placeholder="e.g. Welcome to the Vortex Tiers team! Please ping Head Tester in Discord for your orientation..."
              rows={3}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Leaving this empty will send the standard professional acceptance letter.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={actionLoading}
              onClick={() =>
                handleStatusChange("ACCEPTED", {
                  acceptanceMessage: acceptanceMessage.trim() || undefined,
                  note: "Application accepted by reviewer.",
                })
              }
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {actionLoading ? "Accepting..." : "Confirm & Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Reject Staff Application
            </DialogTitle>
            <DialogDescription>
              Rejecting will mark the application as <strong>REJECTED</strong> and send a polite decision email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-bold text-foreground block">
              Optional Rejection Feedback (Included in Email)
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. We are currently looking for players with more tournament referee experience..."
              rows={3}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Optional. If omitted, no awkward empty feedback section will be shown in the email.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() =>
                handleStatusChange("REJECTED", {
                  rejectionReason: rejectionReason.trim() || undefined,
                  note: "Application rejected by reviewer.",
                })
              }
              className="font-bold"
            >
              {actionLoading ? "Rejecting..." : "Confirm & Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
