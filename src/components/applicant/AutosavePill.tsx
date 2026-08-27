import React, { memo } from "react";
import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";

interface AutosavePillProps {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt?: Date | null;
}

export const AutosavePill = memo(function AutosavePill({ status, lastSavedAt }: AutosavePillProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs text-muted-foreground font-mono">
      {status === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="text-primary font-medium">Autosaving draft...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-emerald-400/90 font-medium">Draft saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-destructive font-medium">Unable to save</span>
        </>
      )}
      {status === "idle" && (
        <>
          <Cloud className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span>
            {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Draft mode"}
          </span>
        </>
      )}
    </div>
  );
});
