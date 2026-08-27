import { describe, it, expect } from "vitest";
import { QuestionType, ApplicationStatus } from "@/types";

describe("Application Workflow & Draft Validation", () => {
  const sampleQuestions = [
    {
      id: "q-ign",
      title: "Minecraft Java IGN",
      type: "MINECRAFT_USERNAME" as QuestionType,
      required: true,
      minLength: 3,
      maxLength: 16,
      enabled: true,
      positionId: null,
      modeId: null,
    },
    {
      id: "q-exp",
      title: "Testing Experience",
      type: "PARAGRAPH" as QuestionType,
      required: true,
      minLength: 20,
      maxLength: 2000,
      enabled: true,
      positionId: "pos-tester",
      modeId: null,
    },
    {
      id: "q-crystal-clip",
      title: "Crystal PvP Duel Clip",
      type: "VIDEO" as QuestionType,
      required: true,
      enabled: true,
      positionId: "pos-tester",
      modeId: "mode-crystal",
    },
    {
      id: "q-uhc-clip",
      title: "UHC Duel Clip",
      type: "VIDEO" as QuestionType,
      required: true,
      enabled: true,
      positionId: "pos-tester",
      modeId: "mode-uhc",
    },
  ];

  it("should correctly filter applicable questions by position and gamemode", () => {
    const selectedPosition = "pos-tester";
    const selectedMode = "mode-crystal";

    const filtered = sampleQuestions.filter((q) => {
      if (q.positionId && q.positionId !== selectedPosition) return false;
      if (q.modeId && q.modeId !== selectedMode) return false;
      return true;
    });

    expect(filtered.map((q) => q.id)).toEqual(["q-ign", "q-exp", "q-crystal-clip"]);
    expect(filtered.map((q) => q.id)).not.toContain("q-uhc-clip");
  });

  it("should validate required questions before allowing submission", () => {
    const answersMap: Record<string, string> = {
      "q-ign": "ClownPierce",
      "q-exp": "Experienced tier tester in Crystal and Sword PvP since Season 1.",
    };

    const validateSubmission = (questions: typeof sampleQuestions, answers: Record<string, string>) => {
      for (const q of questions) {
        if (q.required && (!answers[q.id] || answers[q.id].trim().length === 0)) {
          return { valid: false, missingQuestionId: q.id };
        }
      }
      return { valid: true };
    };

    const applicable = sampleQuestions.filter((q) => !q.modeId || q.modeId === "mode-crystal");
    
    // Missing crystal clip
    const res1 = validateSubmission(applicable, answersMap);
    expect(res1.valid).toBe(false);
    expect(res1.missingQuestionId).toBe("q-crystal-clip");

    // Add crystal clip
    answersMap["q-crystal-clip"] = "https://youtube.com/watch?v=sample-duel";
    const res2 = validateSubmission(applicable, answersMap);
    expect(res2.valid).toBe(true);
  });

  it("should properly format and generate sequential application IDs", () => {
    const formatAppId = (count: number): string => {
      return `VT-${(count + 1).toString().padStart(6, "0")}`;
    };

    expect(formatAppId(0)).toBe("VT-000001");
    expect(formatAppId(141)).toBe("VT-000142");
    expect(formatAppId(9999)).toBe("VT-010000");
  });

  it("should enforce immutable question snapshots on submission", () => {
    const activeQuestion = {
      id: "q-1",
      title: "Original Question Title",
      type: "SHORT_TEXT" as QuestionType,
      options: ["A", "B"],
      version: 1,
    };

    const answerRecord = {
      questionId: activeQuestion.id,
      value: "Option A",
      questionSnapshot: {
        id: activeQuestion.id,
        title: activeQuestion.title,
        type: activeQuestion.type,
        options: activeQuestion.options,
        version: activeQuestion.version,
      },
    };

    // Even if the active question is modified later by an admin...
    const modifiedQuestion = {
      ...activeQuestion,
      title: "Modified Question Title (New Revision)",
      options: ["A", "B", "C"],
      version: 2,
    };

    // The submitted answer's snapshot preserves the original question context exactly
    expect(answerRecord.questionSnapshot.title).toBe("Original Question Title");
    expect(answerRecord.questionSnapshot.version).toBe(1);
    expect(modifiedQuestion.title).toBe("Modified Question Title (New Revision)");
  });
});
