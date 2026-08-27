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
import { PlayerTierPreview } from "./PlayerTierPreview";
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
  Sparkles,
  Swords,
  Layers,
  FileCheck,
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

  // Restore local draft on mount if available
  useEffect(() => {
    try {
      const savedDraftStr = localStorage.getItem(`vortex_draft_${user.id}_${initialApplication.id}`);
      if (savedDraftStr) {
        const draft = JSON.parse(savedDraftStr);
        if (draft.minecraftUsername && !initialApplication.minecraftUsername) {
          setMinecraftUsername(draft.minecraftUsername);
        }
        if (draft.positionId && !initialApplication.positionId) {
          setPositionId(draft.positionId);
        }
        if (draft.modeId && !initialApplication.modeId) {
          setModeId(draft.modeId);
        }
        if (draft.answers && Object.keys(draft.answers).length > 0) {
          setAnswers((prev) => ({
            ...draft.answers,
            ...prev,
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to restore local draft:", e);
    }
  }, [user.id, initialApplication.id, initialApplication.minecraftUsername, initialApplication.positionId, initialApplication.modeId]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadData[]>(initialApplication.uploads || []);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounced Autosave Timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = () => {
    // 1. Immediately persist to localStorage
    try {
      localStorage.setItem(
        `vortex_draft_${user.id}_${initialApplication.id}`,
        JSON.stringify({
          positionId,
          modeId,
          minecraftUsername,
          answers,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {}

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
          credentials: "include",
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
    }, 1000);
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
      setSubmitError("Please confirm your application details before submitting.");
      return;
    }

    if (!minecraftUsername.trim()) {
      setSubmitError("Please specify your Minecraft Java IGN in Step 1.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Final sync save
      const payloadAnswers = Object.entries(answers).map(([qId, data]) => ({
        questionId: qId,
        value: data.value,
        selectedOptions: data.selectedOptions,
      }));

      await fetch(`/api/applications/${initialApplication.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        credentials: "include",
        body: JSON.stringify({ confirmAccuracy: true }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || "Submission failed.");
      }

      try {
        localStorage.removeItem(`vortex_draft_${user.id}_${initialApplication.id}`);
      } catch {}

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
    { num: 1, title: "Identity", subtitle: "Discord & Minecraft IGN", icon: User },
    { num: 2, title: "Role & Mode", subtitle: "Position Selection", icon: Shield },
    { num: 3, title: "Assessment", subtitle: "Written Questions", icon: HelpCircle },
    { num: 4, title: "Evidence", subtitle: "Media & Clips", icon: UploadCloud },
    { num: 5, title: "Review", subtitle: "Final Verification", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Top Header & Autosave Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white font-mono uppercase">
              Staff Application
            </h1>
            <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded border border-primary/40 bg-primary/10">
              {initialApplication.id}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Vortex Tiers recruitment protocol. Autosaving changes live.
          </p>
        </div>

        <AutosavePill status={autosaveStatus} lastSavedAt={lastSavedAt} />
      </div>

      {/* Mobile Step Indicator */}
      <div className="sm:hidden rounded-xl border border-border/80 bg-[#121721] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary/20 text-primary border border-primary/40 font-mono text-xs font-bold flex items-center justify-center">
              {currentStep}
            </span>
            <span className="text-xs font-bold font-mono text-white">
              {steps[currentStep - 1]?.title}
            </span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-secondary/80 h-1.5 rounded-full overflow-hidden flex gap-1">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex-1 h-full rounded-full transition-all cursor-pointer ${
                s.num === currentStep
                  ? "bg-primary"
                  : s.num < currentStep
                  ? "bg-emerald-500"
                  : "bg-border/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop & Tablet Stepped Tactical Header */}
      <div className="hidden sm:grid grid-cols-5 gap-2 sm:gap-3">
        {steps.map((s) => {
          const isPassed = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          const Icon = s.icon;

          return (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                isCurrent
                  ? "border-primary bg-primary/15 text-primary font-bold shadow-md shadow-primary/10"
                  : isPassed
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold"
                  : "border-border/60 bg-[#121721] text-muted-foreground hover:border-border hover:bg-[#161c28]"
              }`}
            >
              <div className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold font-mono">
                {isPassed ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{s.num}</span>}
              </div>
              <span className="text-xs font-bold font-mono truncate w-full block">
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: APPLICANT IDENTITY & MINECRAFT LOOKUP */}
      {currentStep === 1 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Step 1: Applicant Profile
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Verify your authenticated Discord passport and link your Minecraft Java Edition username.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Authenticated Discord Passport */}
            <div className="rounded-xl border border-border/80 bg-[#0e1218] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-border flex items-center justify-center bg-[#5865F2]/20 text-[#5865F2] font-bold text-sm">
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
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">
                      {user.discordGlobalName || user.discordUsername}
                    </span>
                    <span className="rounded bg-[#5865F2]/15 border border-[#5865F2]/30 px-1.5 py-0.5 text-[10px] font-bold text-[#5865F2] font-mono">
                      Discord Verified
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono block">
                    ID: {user.discordId} • {user.email || "No Email Provided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Minecraft Username Input & Live Tier Preview */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-white font-mono">
                Minecraft Java IGN <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={minecraftUsername}
                onChange={(e) => {
                  setMinecraftUsername(e.target.value);
                  triggerAutosave();
                }}
                placeholder="e.g. ClownPierce, IntelEdits..."
                className="w-full rounded-xl border border-border bg-[#0e1218] px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter your exact in-game name. We automatically verify your skin and check live Vortex tier rankings.
              </p>

              {/* Live Tier Preview Component */}
              <PlayerTierPreview username={minecraftUsername} />
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!minecraftUsername.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono gap-1.5"
              >
                Proceed to Role Selection <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: POSITION & GAME MODE */}
      {currentStep === 2 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Step 2: Role & Game Mode Selection
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Choose the staff role you are applying for and your primary Minecraft PvP discipline.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Position Cards */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-white font-mono">
                Desired Staff Role <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {positions.map((pos) => {
                  const isSelected = positionId === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => {
                        setPositionId(pos.id);
                        triggerAutosave();
                      }}
                      className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                          : "border-border/70 bg-[#0e1218] hover:border-border hover:bg-[#161c28]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-sm font-mono ${isSelected ? "text-primary" : "text-white"}`}>
                          {pos.name}
                        </span>
                        {pos.requiredEvidence && (
                          <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 font-mono">
                            Clips Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {pos.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game Mode Selector with Official SVG Icons */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-white font-mono">
                Primary PvP Discipline / Gamemode <span className="text-muted-foreground font-normal">(Optional for general mod)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {gameModes.map((mode) => {
                  const isSelected = modeId === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setModeId(isSelected ? "" : mode.id);
                        triggerAutosave();
                      }}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/15 text-white font-bold"
                          : "border-border/70 bg-[#0e1218] text-muted-foreground hover:border-border hover:text-white"
                      }`}
                    >
                      <div className="h-6 w-6 rounded bg-secondary/80 flex items-center justify-center p-1 flex-shrink-0">
                        <img
                          src={
                            mode.slug === "crystal"
                              ? "/icons/vanilla.svg"
                              : mode.slug === "neth-pot"
                              ? "/icons/nethop.svg"
                              : `/icons/${mode.slug}.svg`
                          }
                          alt={mode.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/icons/sword.svg";
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold truncate">{mode.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="font-mono text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!positionId}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono gap-1.5"
              >
                Proceed to Questions <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: DYNAMIC ASSESSMENT QUESTIONS */}
      {currentStep === 3 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" /> Step 3: Candidate Assessment
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Answer the evaluation questions specific to {selectedPosition?.name || "your role"}.
                </CardDescription>
              </div>
              <span className="font-mono text-xs text-primary font-bold">
                {applicableQuestions.length} Questions
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {applicableQuestions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground font-mono text-sm">
                No custom questions configured for this position. You may proceed directly to Evidence & Submission.
              </div>
            ) : (
              <div className="space-y-6">
                {applicableQuestions.map((q, idx) => (
                  <div key={q.id} className="rounded-xl border border-border/70 bg-[#0e1218] p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-primary/15 text-[11px] font-bold text-primary font-mono">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white block">
                          {q.title} {q.required && <span className="text-red-400">*</span>}
                        </span>
                        {q.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {q.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <DynamicQuestionField
                      question={q}
                      value={answers[q.id]?.value || ""}
                      selectedOptions={answers[q.id]?.selectedOptions || []}
                      onChange={(val, opts) => handleAnswerChange(q.id, val, opts)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="font-mono text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono gap-1.5"
              >
                Proceed to Evidence <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: EVIDENCE & MEDIA */}
      {currentStep === 4 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" /> Step 4: Evidence & PvP Clips
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Attach unedited PvP duel recordings, testing footage, or past staff credentials.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <EvidenceUploader
              applicationId={initialApplication.id}
              uploadedFiles={uploadedFiles}
              onUploadSuccess={handleUploadSuccess}
              onFileRemove={handleFileRemove}
            />

            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="font-mono text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono gap-1.5"
              >
                Review & Confirm <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: FINAL REVIEW & SUBMIT */}
      {currentStep === 5 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Step 5: Review & Final Submission
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Inspect your application snapshot. Once submitted, answers become immutable for review.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Applicant Summary Dossier */}
            <div className="rounded-xl border border-border/80 bg-[#0e1218] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <MinecraftAvatar username={minecraftUsername} type="bust" size={48} />
                  <div>
                    <span className="font-mono font-black text-base text-white block">
                      {minecraftUsername}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Discord: {user.discordGlobalName || user.discordUsername} ({user.discordId})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/15 border border-primary/30 px-2.5 py-1 text-xs font-bold text-primary font-mono">
                    {selectedPosition?.name || "No Position"}
                  </span>
                  {selectedMode && (
                    <ModeBadge slug={selectedMode.slug} name={selectedMode.name} />
                  )}
                </div>
              </div>

              {/* Answers Inspection */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Recorded Responses ({applicableQuestions.length})
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {applicableQuestions.map((q) => {
                    const ans = answers[q.id];
                    return (
                      <div key={q.id} className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-1">
                        <span className="text-xs font-bold text-white block font-mono">
                          {q.title}
                        </span>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                          {ans?.value || (ans?.selectedOptions && ans.selectedOptions.join(", ")) || "No answer provided"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uploads Inspection */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  Attached Clips & Evidence: {uploadedFiles.length} file(s)
                </span>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start space-x-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Checkbox
                id="confirm"
                checked={confirmAccuracy}
                onCheckedChange={(c) => setConfirmAccuracy(!!c)}
                className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
              />
              <div className="space-y-1">
                <label htmlFor="confirm" className="text-xs font-bold text-white cursor-pointer font-mono">
                  I confirm all information provided is accurate and authentic.
                </label>
                <p className="text-[11px] text-muted-foreground">
                  I understand that falsifying evidence or tier history will result in immediate blacklisting from Vortex Tiers recruitment.
                </p>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400 font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(4)}
                disabled={submitting}
                className="font-mono text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !confirmAccuracy}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black font-mono text-sm px-6 gap-2 shadow-lg shadow-primary/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit Application
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
