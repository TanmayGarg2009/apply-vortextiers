"use client";

import React from "react";
import { QuestionData } from "@/types";
import { MinecraftAvatar } from "@/components/shared/MinecraftAvatar";

interface DynamicQuestionFieldProps {
  question: QuestionData;
  value: string;
  selectedOptions?: string[];
  onChange: (value: string, selectedOptions?: string[]) => void;
  error?: string;
}

export function DynamicQuestionField({
  question,
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
    <div className="space-y-3">
      {/* Field based on type */}
      {question.type === "SHORT_TEXT" && (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value, selectedOptions)}
            placeholder="Enter short response..."
            maxLength={question.maxLength || 200}
            className="w-full rounded-xl border border-border bg-[#121721] px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
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
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value, selectedOptions)}
          placeholder="https://youtube.com/watch?v=... or medal.tv/..."
          className="w-full rounded-xl border border-border bg-[#121721] px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
        />
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
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer font-mono text-xs ${
                  active
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-sm"
                    : "border-border/70 bg-[#121721] text-muted-foreground hover:border-border hover:text-white"
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
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer font-mono text-xs ${
                  active
                    ? "border-primary bg-primary/15 text-primary font-bold shadow-sm"
                    : "border-border/70 bg-[#121721] text-muted-foreground hover:border-border hover:text-white"
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
  );
}
