"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ApplicationData,
  StaffPositionData,
  GameModeData,
  QuestionData,
  UploadData,
  SessionUser,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AutosavePill } from "./AutosavePill";
import { DynamicQuestionField } from "./DynamicQuestionField";
import { EvidenceUploader } from "./EvidenceUploader";
import { ModeBadge } from "@/components/shared/ModeBadge";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import {
  User,
  Shield,
  Gamepad2,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";

interface ApplicationWizardProps {
  user: SessionUser;
  initialApplication: ApplicationData;
  positions: StaffPositionData[];
  gameModes: GameModeData[];
  questions: QuestionData[];
}

export function ApplicationWizard({
  user,
  initialApplication,
  positions,
  gameModes,
  questions,
}: ApplicationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [positionId, setPositionId] = useState(initialApplication.positionId || positions[0]?.id || "");
  const [modeId, setModeId] = useState(initialApplication.modeId || "");
  const [minecraftUsername, setMinecraftUsername] = useState(initialApplication.minecraftUsername || "");
  
  // Answers state mapping: questionId -> { value, selectedOptions }
  const [answers, setAnswers] = useState<Record<string, { value: string; selectedOptions?: string[] }>>(() => {
    const map: Record<string, { value: string; selectedOptions?: string[] }> = {};
    if (initialApplication.answers) {
      for (const ans of initialApplication.answers) {
        map[ans.questionId] = {
          value: ans.value || "",
          selectedOptions: ans.selectedOptions || [],
        };
      }
    }
    return map;
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadData[]>(initialApplication.uploads || []);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounced Autosave Timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setAutosaveStatus("saving");
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payloadAnswers = Object.entries(answers).map(([qId, data]) => ({
          questionId: qId,
          value: data.value,
          selectedOptions: data.selectedOptions,
        }));

        const res = await fetch(`/api/applications/${initialApplication.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionId,
            modeId: modeId || null,
            minecraftUsername: minecraftUsername || null,
            answers: payloadAnswers,
          }),
        });

        if (!res.ok) throw new Error("Failed to save");

        setAutosaveStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setAutosaveStatus("error");
      }
    }, 1200);
  };

  // Filter applicable questions for currently selected position & game mode
  const applicableQuestions = questions.filter((q) => {
    if (q.positionId && q.positionId !== positionId) return false;
    if (q.modeId && q.modeId !== modeId) return false;
    return true;
  });

  const handleAnswerChange = (questionId: string, value: string, selectedOptions?: string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { value, selectedOptions },
    }));
    triggerAutosave();
  };

  const handleUploadSuccess = (file: UploadData) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!confirmAccuracy) {
      setSubmitError("Please check the confirmation box to verify your submission.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Perform final sync save
      const payloadAnswers = Object.entries(answers).map(([qId, data]) => ({
        questionId: qId,
        value: data.value,
        selectedOptions: data.selectedOptions,
      }));

      await fetch(`/api/applications/${initialApplication.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionId,
          modeId: modeId || null,
          minecraftUsername: minecraftUsername || null,
          answers: payloadAnswers,
        }),
      });

      // 2. Submit application
      const submitRes = await fetch(`/api/applications/${initialApplication.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmAccuracy: true }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || "Submission failed.");
      }

      router.push(`/dashboard?submitted=${initialApplication.id}`);
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit application.");
      setSubmitting(false);
    }
  };

  const selectedPosition = positions.find((p) => p.id === positionId);
  const selectedMode = gameModes.find((m) => m.id === modeId);

  const steps = [
    { num: 1, title: "Applicant Identity", icon: User },
    { num: 2, title: "Position & Mode", icon: Shield },
    { num: 3, title: "Questions", icon: HelpCircle },
    { num: 4, title: "Evidence & Media", icon: UploadCloud },
    { num: 5, title: "Review & Submit", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Top Header & Autosave Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Staff Application
            </h1>
            <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded border border-primary/40 bg-primary/10">
              {initialApplication.id}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Vortex Tiers staff recruitment application form. Complete each section accurately.
          </p>
        </div>

        <AutosavePill status={autosaveStatus} lastSavedAt={lastSavedAt} />
      </div>

      {/* Step Stepper Progress Bar */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        {steps.map((s) => {
          const isPassed = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          const Icon = s.icon;

          return (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                isCurrent
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                  : isPassed
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold"
                  : "border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <div className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold font-mono">
                {isPassed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span className="text-[11px] font-medium hidden sm:inline leading-tight">
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: APPLICANT IDENTITY */}
      {currentStep === 1 && (
        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Step 1 — Applicant Identity & Minecraft Profile
            </CardTitle>
            <CardDescription>
              Discord information is automatically verified through OAuth. Enter your Minecraft Java IGN below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Discord Information Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center font-bold">
                  {user.discordAvatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`}
                      alt={user.discordUsername}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.discordUsername.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">
                      {user.discordGlobalName || user.discordUsername}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Discord Verified
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {user.discordId} • {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Minecraft Username Field */}
            <div className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-5">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Minecraft Java In-Game Name (IGN)
                <span className="text-destructive font-mono">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Enter your exact Minecraft Java Edition in-game name. Your skin avatar will preview automatically.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <MinecraftAvatar username={minecraftUsername} size={42} />
                <div className="flex-1">
                  <input
                    type="text"
                    value={minecraftUsername}
                    onChange={(e) => {
                      setMinecraftUsername(e.target.value.trim());
                      triggerAutosave();
                    }}
                    placeholder="e.g. Minikloon"
                    maxLength={16}
                    className="flex h-10 w-full rounded-lg border border-border bg-secondary/40 px-3.5 py-2 text-sm font-mono font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: POSITION & GAME MODE */}
      {currentStep === 2 && (
        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Step 2 — Staff Position & Primary Game Mode
            </CardTitle>
            <CardDescription>
              Select the staff position you are applying for and your primary PvP specialty mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Position Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Select Staff Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {positions.map((pos) => {
                  const isSelected = positionId === pos.id;
                  return (
                    <div
                      key={pos.id}
                      onClick={() => {
                        setPositionId(pos.id);
                        triggerAutosave();
                      }}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/80 bg-secondary/30 hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{pos.name}</span>
                        {pos.requiredEvidence && (
                          <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 font-mono">
                            Evidence Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {pos.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game Mode Selection */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Primary PvP Game Mode (Optional / Specialty)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {gameModes.map((mode) => {
                  const isSelected = modeId === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => {
                        setModeId(isSelected ? "" : mode.id);
                        triggerAutosave();
                      }}
                      className={`cursor-pointer rounded-lg border p-3 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/15 font-bold shadow-sm"
                          : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      <ModeBadge slug={mode.slug} name={mode.name} className="mx-auto" />
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: QUESTIONS */}
      {currentStep === 3 && (
        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Step 3 — Application Questions
            </CardTitle>
            <CardDescription>
              Answer all questions thoroughly. Answers are autosaved as you type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicableQuestions.map((q) => (
              <DynamicQuestionField
                key={q.id}
                question={q}
                value={answers[q.id]?.value || ""}
                selectedOptions={answers[q.id]?.selectedOptions || []}
                onChange={(val, selectedOpts) => handleAnswerChange(q.id, val, selectedOpts)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* STEP 4: EVIDENCE UPLOADS */}
      {currentStep === 4 && (
        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Step 4 — Evidence & Gameplay Media
            </CardTitle>
            <CardDescription>
              Attach testing footage, screenshots of tiers, or vouches. Files are stored securely in Google Drive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <EvidenceUploader
              applicationId={initialApplication.id}
              uploadedFiles={uploadedFiles}
              onUploadSuccess={handleUploadSuccess}
              onFileRemove={handleFileRemove}
              maxFiles={6}
              maxFileSizeMb={150}
            />
          </CardContent>
        </Card>
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {currentStep === 5 && (
        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Step 5 — Final Review & Confirmation
            </CardTitle>
            <CardDescription>
              Review all details carefully before final submission. Editing is locked once submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Review Block */}
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Application Summary
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Position</span>
                  <span className="font-bold text-foreground">{selectedPosition?.name || "None"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">PvP Mode</span>
                  <span className="font-bold text-foreground">{selectedMode?.name || "General"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Minecraft IGN</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MinecraftAvatar username={minecraftUsername} size={20} />
                    <span className="font-mono font-bold text-foreground">{minecraftUsername || "Not provided"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Answered Questions Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                Completed Responses ({Object.keys(answers).length} / {applicableQuestions.length})
              </h4>
              <div className="space-y-2">
                {applicableQuestions.map((q) => {
                  const ans = answers[q.id];
                  const hasAnswer = ans && (ans.value || (ans.selectedOptions && ans.selectedOptions.length > 0));

                  return (
                    <div
                      key={q.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 p-3 text-sm"
                    >
                      <span className="font-medium text-foreground truncate max-w-md">
                        {q.title}
                      </span>
                      {hasAnswer ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Answered
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 font-mono">
                          {q.required ? "Required" : "Optional"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attached Files Review */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Attached Files ({uploadedFiles.length})
                </h4>
                <div className="space-y-1.5">
                  {uploadedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-foreground truncate">{f.filename}</span>
                      <span className="text-muted-foreground font-mono">{f.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Confirmation Checkbox */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <label
                onClick={() => setConfirmAccuracy(!confirmAccuracy)}
                className="flex cursor-pointer items-start gap-3 text-sm font-medium text-amber-200"
              >
                <Checkbox
                  checked={confirmAccuracy}
                  onCheckedChange={(checked) => setConfirmAccuracy(!!checked)}
                  className="mt-0.5"
                />
                <span>
                  I confirm that all information provided in this staff application is accurate, truthful, and represents my own work and experience.
                </span>
              </label>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom Step Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-border/70">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1 || submitting}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Previous Step
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            className="gap-2 font-bold"
          >
            Next Step <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !confirmAccuracy}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-sm shadow-emerald-900/30"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Staff Application
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
