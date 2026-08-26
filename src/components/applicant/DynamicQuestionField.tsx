"use client";

import React from "react";
import { QuestionData } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
        return; // Max reached
      }
      updated = [...current, option];
    }
    onChange(value, updated);
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-border/70 bg-card/60 p-5 transition-all focus-within:border-border">
      {/* Title & Help Text */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {question.title}
            {question.required && <span className="text-destructive font-mono">*</span>}
          </span>
          {question.type === "PARAGRAPH" && question.maxLength && (
            <span className={`text-xs font-mono ${currentLength > question.maxLength ? "text-destructive font-bold" : "text-muted-foreground"}`}>
              {currentLength} / {question.maxLength}
            </span>
          )}
        </label>
        {question.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {question.description}
          </p>
        )}
      </div>

      {/* Field Input based on Type */}
      <div className="pt-1">
        {question.type === "SHORT_TEXT" && (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value, selectedOptions)}
            placeholder="Your answer..."
            maxLength={question.maxLength || undefined}
          />
        )}

        {question.type === "PARAGRAPH" && (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value, selectedOptions)}
            placeholder="Type your detailed response here..."
            rows={4}
            maxLength={question.maxLength || undefined}
          />
        )}

        {question.type === "MINECRAFT_USERNAME" && (
          <div className="flex items-center gap-3">
            <MinecraftAvatar username={value} size={40} />
            <div className="flex-1">
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value.trim(), selectedOptions)}
                placeholder="e.g. Minikloon"
                maxLength={16}
                className="font-mono font-medium"
              />
            </div>
          </div>
        )}

        {question.type === "URL" && (
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value, selectedOptions)}
            placeholder="https://..."
          />
        )}

        {question.type === "NUMBER" && (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value, selectedOptions)}
            min={question.minNumber !== null && question.minNumber !== undefined ? question.minNumber : undefined}
            max={question.maxNumber !== null && question.maxNumber !== undefined ? question.maxNumber : undefined}
            placeholder="0"
          />
        )}

        {question.type === "MULTIPLE_CHOICE" && question.options && (
          <div className="space-y-2 pt-1">
            {question.options.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                  value === opt
                    ? "border-primary/60 bg-primary/10 text-foreground font-semibold"
                    : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt, selectedOptions)}
                  className="h-4 w-4 text-primary accent-primary"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === "MULTIPLE_SELECT" && question.options && (
          <div className="space-y-2 pt-1">
            {question.options.map((opt) => {
              const isChecked = (selectedOptions || []).includes(opt);
              return (
                <label
                  key={opt}
                  onClick={() => handleOptionToggle(opt)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                    isChecked
                      ? "border-primary/60 bg-primary/10 text-foreground font-semibold"
                      : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <Checkbox checked={isChecked} onCheckedChange={() => handleOptionToggle(opt)} />
                  <span>{opt}</span>
                </label>
              );
            })}
            {question.minSelections && (
              <p className="text-[11px] text-muted-foreground">
                Please select at least {question.minSelections} option{question.minSelections > 1 ? "s" : ""}.
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
