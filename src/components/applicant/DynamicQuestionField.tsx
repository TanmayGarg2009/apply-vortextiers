"use client";

import React, { memo } from "react";
import { QuestionData } from "@/types";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";
import { Video, Image, FileText, Link2, UploadCloud, HelpCircle, CheckCircle2 } from "lucide-react";

interface DynamicQuestionFieldProps {
  question: QuestionData;
  questionNumber?: number;
  value: string;
  selectedOptions?: string[];
  onChange: (value: string, selectedOptions?: string[]) => void;
  error?: string;
}

export const DynamicQuestionField = memo(function DynamicQuestionField({
  question,
  questionNumber,
  value = "",
  selectedOptions = [],
  onChange,
  error,
}: DynamicQuestionFieldProps) {
  const currentLength = (value || "").length;

  const handleOptionToggle = (option: string) => {
    const current = selectedOptions || [];
    let updated: string[];
    if (current.includes(option)) {
      updated = current.filter((o) => o !== option);
    } else {
      if (question.maxSelections && current.length >= question.maxSelections) {
        return;
      }
      updated = [...current, option];
    }
    onChange(value, updated);
  };

  const isSelected = (opt: string) => (selectedOptions || []).includes(opt);

  return (
    <div className="rounded-2xl border border-border/80 bg-[#0e1218] p-5 space-y-4 shadow-lg transition-all hover:border-border">
      {/* Question Header: Title & Description */}
      <div className="space-y-1.5 border-b border-border/40 pb-3">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-bold text-white font-mono leading-snug">
            {questionNumber ? (
              <span className="text-primary mr-1.5 font-black">{questionNumber}.</span>
            ) : null}
            {question.title}{" "}
            {question.required ? <span className="text-red-400">*</span> : null}
          </label>

          {question.required ? (
            <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold text-red-400 font-mono shrink-0">
              Required
            </span>
          ) : (
            <span className="rounded-full bg-secondary/80 border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground font-mono shrink-0">
              Optional
            </span>
          )}
        </div>

        {question.description && (
          <p className="text-xs text-muted-foreground leading-relaxed font-sans">
            {question.description}
          </p>
        )}
      </div>

      {/* Field Input based on question type */}
      <div className="space-y-3 pt-1">
        {question.type === "SHORT_TEXT" && (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value, selectedOptions)}
              placeholder="Enter your response..."
              maxLength={question.maxLength || 200}
              className="w-full rounded-xl border border-border bg-[#121721] px-4 py-3 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
            />
            {question.maxLength && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">
                {currentLength}/{question.maxLength}
              </span>
            )}
          </div>
        )}

        {question.type === "PARAGRAPH" && (
          <div className="space-y-1.5">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value, selectedOptions)}
              placeholder="Type your thorough explanation here..."
              rows={4}
              maxLength={question.maxLength || 2000}
              className="w-full rounded-xl border border-border bg-[#121721] p-3 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed transition-all resize-y"
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
              <span>Minimum detail recommended</span>
              <span>
                {currentLength} / {question.maxLength || 2000} chars
              </span>
            </div>
          </div>
        )}

        {question.type === "MINECRAFT_USERNAME" && (
          <div className="flex items-center gap-3">
            <MinecraftAvatar username={value} size={36} />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value.trim(), selectedOptions)}
              placeholder="Java IGN (e.g. ClownPierce)"
              maxLength={16}
              className="w-full rounded-xl border border-border bg-[#121721] px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        )}

        {question.type === "URL" && (
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value, selectedOptions)}
              placeholder="https://youtube.com/watch?v=... or medal.tv/..."
              className="w-full rounded-xl border border-border bg-[#121721] pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        )}

        {(question.type === "VIDEO" || question.type === "IMAGE" || question.type === "FILE") && (
          <div className="space-y-2 rounded-xl border border-border/80 bg-[#121721] p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-white">
                {question.type === "VIDEO" ? (
                  <Video className="h-4 w-4 text-primary" />
                ) : question.type === "IMAGE" ? (
                  <Image className="h-4 w-4 text-primary" />
                ) : (
                  <FileText className="h-4 w-4 text-primary" />
                )}
                <span>
                  {question.type === "VIDEO"
                    ? "Gameplay Clip Link or Attachment"
                    : question.type === "IMAGE"
                    ? "Screenshot Link or Attachment"
                    : "Evidence Document or File Link"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Direct upload available in Step 4
              </span>
            </div>

            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value, selectedOptions)}
              placeholder={
                question.type === "VIDEO"
                  ? "Paste YouTube / Medal.tv / Google Drive clip link here..."
                  : question.type === "IMAGE"
                  ? "Paste Imgur / screenshot link or enter evidence note..."
                  : "Paste document link or description..."
              }
              className="w-full rounded-lg border border-border/70 bg-[#0a0d13] px-3 py-2 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>
        )}

        {question.type === "MULTIPLE_CHOICE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(question.options || []).map((opt) => {
              const active = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(opt, selectedOptions)}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer font-mono text-xs ${
                    active
                      ? "border-primary bg-primary/15 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                      : "border-border/70 bg-[#121721] text-muted-foreground hover:border-border hover:text-white hover:bg-[#161c28]"
                  }`}
                >
                  <span>{opt}</span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      active ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {active && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {question.type === "MULTIPLE_SELECT" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(question.options || []).map((opt) => {
              const active = isSelected(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOptionToggle(opt)}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer font-mono text-xs ${
                    active
                      ? "border-primary bg-primary/15 text-primary font-bold shadow-sm ring-1 ring-primary/40"
                      : "border-border/70 bg-[#121721] text-muted-foreground hover:border-border hover:text-white hover:bg-[#161c28]"
                  }`}
                >
                  <span>{opt}</span>
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      active ? "border-primary bg-primary text-black font-bold text-[10px]" : "border-border"
                    }`}
                  >
                    {active && "✓"}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {question.type === "NUMBER" && (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value, selectedOptions)}
            placeholder="Enter numeric value..."
            min={question.minNumber ?? undefined}
            max={question.maxNumber ?? undefined}
            className="w-full rounded-xl border border-border bg-[#121721] px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        )}

        {error && (
          <p className="text-[11px] font-mono text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
