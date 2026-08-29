"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Globe,
  Flame,
  FileCheck,
  Eye,
  Crosshair,
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

  // Sector / Server Selection: Vortex Network vs Vortex Tiers
  const [organization, setOrganization] = useState<"TIERS" | "NETWORK">(() => {
    if (
      initialApplication.positionId?.includes("trial") ||
      initialApplication.positionId?.includes("mod") ||
      initialApplication.positionId?.includes("admin") ||
      initialApplication.positionId?.includes("net")
    ) {
      return "NETWORK";
    }
    return "TIERS";
  });

  const [positionId, setPositionId] = useState(initialApplication.positionId || "");
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
      const savedDraftStr = localStorage.getItem(`vortex_local_draft_${user.id}`);
      if (savedDraftStr) {
        const draft = JSON.parse(savedDraftStr);
        if (draft.minecraftUsername) setMinecraftUsername(draft.minecraftUsername);
        if (draft.organization) setOrganization(draft.organization);
        if (draft.positionId) setPositionId(draft.positionId);
        if (draft.modeId) setModeId(draft.modeId);
        if (draft.answers && Object.keys(draft.answers).length > 0) {
          setAnswers((prev) => ({
            ...draft.answers,
            ...prev,
          }));
        }
      } else {
        // Default position selection based on initial organization
        const defaultTierPos = positions.find((p) => p.slug === "tier-tester" || p.slug === "screensharer") || positions[0];
        if (defaultTierPos && !positionId) {
          setPositionId(defaultTierPos.id);
        }
      }
    } catch (e) {
      console.warn("Failed to restore local draft:", e);
    }
  }, [user.id, positions]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadData[]>(initialApplication.uploads || []);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const triggerAutosave = (
    currentAnswers = answers,
    currentUsername = minecraftUsername,
    currentPosId = positionId,
    currentModeId = modeId,
    currentOrg = organization
  ) => {
    try {
      localStorage.setItem(
        `vortex_local_draft_${user.id}`,
        JSON.stringify({
          organization: currentOrg,
          positionId: currentPosId,
          modeId: currentModeId,
          minecraftUsername: currentUsername,
          answers: currentAnswers,
          updatedAt: new Date().toISOString(),
        })
      );
      setAutosaveStatus("saved");
      setLastSavedAt(new Date());
    } catch (e) {
      setAutosaveStatus("error");
    }
  };

  // Filter positions by selected organization & enabled status
  const availablePositions = useMemo(() => {
    if (organization === "TIERS") {
      const tierRoles = positions.filter(
        (p) =>
          (p.slug === "tier-tester" ||
            p.slug === "screensharer" ||
            p.slug === "tiers-helper" ||
            p.name.toLowerCase().includes("tier") ||
            p.name.toLowerCase().includes("screenshar")) &&
          p.enabled !== false
      );
      return tierRoles.length > 0 ? tierRoles : positions;
    } else {
      // Vortex Network positions (Trial Staff by default, or other open positions)
      const networkRoles = positions.filter(
        (p) =>
          p.slug !== "tier-tester" &&
          p.slug !== "screensharer" &&
          p.slug !== "tiers-helper" &&
          !p.name.toLowerCase().includes("tier tester") &&
          p.enabled !== false
      );
      return networkRoles.length > 0 ? networkRoles : positions;
    }
  }, [positions, organization]);

  // When switching organization, auto-select a valid position for that sector
  const handleSelectOrganization = (org: "TIERS" | "NETWORK") => {
    setOrganization(org);
    if (org === "TIERS") {
      const tierPos =
        positions.find(
          (p) =>
            (p.slug === "tier-tester" || p.slug === "screensharer") &&
            p.enabled !== false
        ) || positions[0];
      const newPosId = tierPos ? tierPos.id : positionId;
      setPositionId(newPosId);
      triggerAutosave(answers, minecraftUsername, newPosId, modeId, org);
    } else {
      const netPos =
        positions.find(
          (p) =>
            (p.slug === "trial-staff" || p.slug === "moderator") &&
            p.enabled !== false
        ) || positions[0];
      const newPosId = netPos ? netPos.id : positionId;
      setPositionId(newPosId);
      setModeId(""); // Gamemode not applicable for general network staff
      triggerAutosave(answers, minecraftUsername, newPosId, "", org);
    }
  };

  // Filter applicable questions for currently selected position & game mode
  const applicableQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Exclude redundant IGN question (collected in Step 1)
      if (
        q.type === "MINECRAFT_USERNAME" ||
        q.title.toLowerCase().includes("in-game name") ||
        q.title.toLowerCase().includes("minecraft ign")
      ) {
        return false;
      }
      // Exclude media upload questions from Step 3 (handled in Step 4 dedicated uploader)
      if (q.type === "IMAGE" || q.type === "VIDEO") {
        return false;
      }
      if (q.positionId && q.positionId !== positionId) return false;
      if (q.modeId && q.modeId !== modeId) return false;
      return true;
    });
  }, [questions, positionId, modeId]);

  const handleUsernameChange = (val: string) => {
    setMinecraftUsername(val);
    triggerAutosave(answers, val, positionId, modeId, organization);
  };

  const handleAnswerChange = (questionId: string, value: string, selectedOptions?: string[]) => {
    const updated = {
      ...answers,
      [questionId]: { value, selectedOptions },
    };
    setAnswers(updated);
    triggerAutosave(updated, minecraftUsername, positionId, modeId, organization);
  };

  const handlePositionChange = (posId: string) => {
    setPositionId(posId);
    triggerAutosave(answers, minecraftUsername, posId, modeId, organization);
  };

  const handleModeChange = (selectedModeId: string) => {
    // Toggle mode
    const newModeId = modeId === selectedModeId ? "" : selectedModeId;
    setModeId(newModeId);
    triggerAutosave(answers, minecraftUsername, positionId, newModeId, organization);
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
      const payloadAnswers = Object.entries(answers).map(([qId, data]) => ({
        questionId: qId,
        value: data.value,
        selectedOptions: data.selectedOptions,
      }));

      // Submit directly to API
      const submitRes = await fetch(`/api/applications/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          positionId,
          modeId: organization === "TIERS" ? modeId || null : null,
          minecraftUsername: minecraftUsername.trim(),
          answers: payloadAnswers,
          uploads: uploadedFiles,
          confirmAccuracy: true,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || "Submission failed.");
      }

      const resData = await submitRes.json();

      try {
        localStorage.removeItem(`vortex_local_draft_${user.id}`);
      } catch {}

      router.push(`/dashboard?submitted=${resData.application?.id || "true"}`);
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
    { num: 2, title: "Division & Role", subtitle: "Branch Selection", icon: Shield },
    { num: 3, title: "Assessment", subtitle: "Candidate Questionnaire", icon: HelpCircle },
    { num: 4, title: "Evidence", subtitle: "Media & Clips", icon: UploadCloud },
    { num: 5, title: "Review", subtitle: "Verification & Submit", icon: CheckCircle2 },
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
              {organization === "TIERS" ? "Vortex Tiers" : "Vortex Network"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Candidate Recruitment Portal. Application progress is preserved locally in real-time.
          </p>
        </div>

        <AutosavePill status={autosaveStatus} lastSavedAt={lastSavedAt} />
      </div>

      {/* Mobile Step Bar */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Step {currentStep} of 5: <strong className="text-white">{steps[currentStep - 1].title}</strong></span>
          <span>{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`h-full flex-1 transition-all ${
                currentStep >= s.num ? "bg-primary" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Stepped Tactical Header */}
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
              <User className="h-5 w-5 text-primary" /> Step 1: Candidate Identity
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Verify your Discord account credentials and enter your primary Minecraft Java username.
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
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="e.g. ClownPierce, IntelEdits..."
                className="w-full rounded-xl border border-border bg-[#0e1218] px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter your exact in-game name. Skin verification and live Vortex tier ratings are queried automatically.
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
                Proceed to Division & Role <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: DIVISION & ROLE SELECTION */}
      {currentStep === 2 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Step 2: Division & Position Selection
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Select which division you are applying for: the official Tierlist or the main Minecraft Network.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-7 pt-6">
            {/* 1. Branch / Sector Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-white font-mono">
                1. Choose Division <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vortex Tiers Card */}
                <button
                  type="button"
                  onClick={() => handleSelectOrganization("TIERS")}
                  className={`text-left rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden ${
                    organization === "TIERS"
                      ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-border/70 bg-[#0e1218] hover:border-border hover:bg-[#161c28]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Swords className="h-5 w-5" />
                    </div>
                    {organization === "TIERS" && (
                      <span className="rounded-full bg-amber-500 text-black px-2.5 py-0.5 text-[10px] font-black font-mono">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-white font-mono">
                    Vortex Tiers (Tierlist Staff)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Evaluate player skill levels in 1v1 duels, conduct screenshares for illicit clients/mods, score competitive tiers (HT1-LT5), or assist with queue moderation.
                  </p>
                </button>

                {/* Vortex Network Card */}
                <button
                  type="button"
                  onClick={() => handleSelectOrganization("NETWORK")}
                  className={`text-left rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden ${
                    organization === "NETWORK"
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                      : "border-border/70 bg-[#0e1218] hover:border-border hover:bg-[#161c28]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Globe className="h-5 w-5" />
                    </div>
                    {organization === "NETWORK" && (
                      <span className="rounded-full bg-blue-500 text-white px-2.5 py-0.5 text-[10px] font-black font-mono">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-white font-mono">
                    Vortex Network (Minecraft Server)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Moderate the main Minecraft server & Discord, assist players, handle support tickets, run network events, and maintain server order (Trial Staff).
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Position Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-white font-mono">
                  2. Desired Position <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {organization === "NETWORK" ? "Open positions for Vortex Network" : "Open positions for Vortex Tiers"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePositions.map((pos) => {
                  const isSelected = positionId === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => handlePositionChange(pos.id)}
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
                            Evidence Required
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

            {/* 3. Game Mode Selector (For Vortex Tiers) */}
            {organization === "TIERS" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                    3. Target PvP Discipline / Gamemode <span className="text-muted-foreground font-normal">(Optional: Pick 1 or All Modes)</span>
                  </label>
                  {modeId ? (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Specific Mode Selected
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" /> All Gamemodes (Global)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose a specific PvP discipline you specialize in, or leave unselected to apply as a multi-mode tester across all gamemodes:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* All Gamemodes Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setModeId("");
                      triggerAutosave(answers, minecraftUsername, positionId, "", organization);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      !modeId
                        ? "border-amber-500 bg-amber-500/20 text-white font-bold shadow-md shadow-amber-500/10"
                        : "border-border/70 bg-[#0e1218] text-muted-foreground hover:border-border hover:text-white"
                    }`}
                  >
                    <div className="h-6 w-6 rounded bg-secondary/80 flex items-center justify-center p-1 flex-shrink-0 text-amber-400">
                      <Globe className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono font-bold truncate">All Gamemodes</span>
                  </button>

                  {/* 8 Specific Modes */}
                  {gameModes.map((mode) => {
                    const isSelected = modeId === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleModeChange(mode.id)}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/20 text-white font-bold shadow-md shadow-amber-500/10"
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
            ) : (
              <div className="rounded-xl border border-border/70 bg-[#0e1218] p-4 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <Globe className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>Vortex Network Staff applies server-wide across all network lobbies and game modes.</span>
              </div>
            )}

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
                Proceed to Assessment <ChevronRight className="h-4 w-4" />
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
                  <HelpCircle className="h-5 w-5 text-primary" /> Step 3: Candidate Questionnaire
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Answer the evaluation questions tailored to your selected position and division.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {applicableQuestions.length} Questions
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {applicableQuestions.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white font-mono">No Written Questions Required</p>
                <p className="text-xs text-muted-foreground">
                  You can proceed directly to evidence & clip submission.
                </p>
              </div>
            ) : (
              applicableQuestions.map((q) => {
                const ans = answers[q.id] || { value: "", selectedOptions: [] };
                return (
                  <DynamicQuestionField
                    key={q.id}
                    question={q}
                    value={ans.value || ""}
                    selectedOptions={ans.selectedOptions || []}
                    onChange={(val, selected) => handleAnswerChange(q.id, val, selected)}
                  />
                );
              })
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

      {/* STEP 4: EVIDENCE & MEDIA UPLOAD */}
      {currentStep === 4 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" /> Step 4: Evidence, Media & Clips
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Attach screenshots of tier ratings, duel clips, or screenshare tooling credentials to support your candidacy.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <EvidenceUploader
              applicationId="draft"
              uploadedFiles={uploadedFiles}
              onUploadSuccess={handleUploadSuccess}
              onFileRemove={handleFileRemove}
              maxFiles={6}
              maxFileSizeMb={150}
              label={
                selectedPosition?.slug === "screensharer"
                  ? "Attach Screensharing Tooling Proof / Past Logs (Screenshots or Video)"
                  : selectedPosition?.slug === "tier-tester"
                  ? "Attach 1v1 Duel Clips or Tier Score Proof (MP4, MOV, PNG)"
                  : "Attach Moderation Credentials or Community Proof (Optional)"
              }
              description="Upload duel recordings (MP4/WebM/MOV) or verification screenshots (PNG/JPEG). Files are stored securely."
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

      {/* STEP 5: FINAL VERIFICATION & SUBMISSION */}
      {currentStep === 5 && (
        <Card className="border-border/80 bg-[#121721] shadow-xl">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-black text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Step 5: Final Review & Submission
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Review your application details. Once submitted, your dossier is locked for staff committee review.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {submitError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-400 font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Application Summary Box */}
            <div className="rounded-2xl border border-border/80 bg-[#0e1218] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <MinecraftAvatar username={minecraftUsername} size={40} />
                  <div>
                    <h3 className="font-bold text-white font-mono text-sm">
                      {minecraftUsername}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      Discord: {user.discordUsername} ({user.discordId})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 border border-primary/40 px-2.5 py-1 text-xs font-mono font-bold text-primary">
                    {organization === "TIERS" ? "Vortex Tiers" : "Vortex Network"}
                  </span>
                  <span className="rounded bg-secondary border border-border px-2.5 py-1 text-xs font-mono font-bold text-white">
                    {selectedPosition?.name || "Staff Role"}
                  </span>
                  {organization === "TIERS" && (
                    selectedMode ? (
                      <ModeBadge slug={selectedMode.slug} name={selectedMode.name} />
                    ) : (
                      <span className="rounded bg-secondary/80 border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                        All Modes
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Answers Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Submitted Answers ({applicableQuestions.length})
                </h4>
                {applicableQuestions.map((q, idx) => {
                  const ans = answers[q.id];
                  const displayVal = ans?.value || (ans?.selectedOptions && ans.selectedOptions.join(", ")) || "—";
                  return (
                    <div key={q.id} className="rounded-lg border border-border/60 bg-[#121721] p-3 space-y-1">
                      <span className="text-xs font-bold text-muted-foreground font-mono block">
                        {idx + 1}. {q.title}
                      </span>
                      <p className="text-xs text-white whitespace-pre-wrap font-sans">
                        {displayVal}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Uploads Breakdown */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                    Attached Evidence ({uploadedFiles.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedFiles.map((file, i) => (
                      <div key={file.id || i} className="flex items-center gap-2 p-2 rounded-lg bg-[#121721] border border-border text-xs font-mono text-white">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{file.filename || (file as any).fileName || "Attached File"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Checkbox
                id="accuracy-check"
                checked={confirmAccuracy}
                onCheckedChange={(c) => setConfirmAccuracy(c === true)}
                className="mt-0.5"
              />
              <label htmlFor="accuracy-check" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                I hereby confirm that all information provided in this application is accurate and truthful. I understand that submitting false credentials, forged clips, or deceptive answers will result in immediate disqualification and a permanent ban from staff eligibility.
              </label>
            </div>

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
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-sm px-6 h-11 gap-2 shadow-lg shadow-emerald-500/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
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
