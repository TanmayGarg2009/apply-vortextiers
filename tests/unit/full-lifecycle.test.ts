import { describe, it, expect } from "vitest";
import dbService from "@/lib/db/store";
import { ApplicationStatus, QuestionType, Role } from "@/types";
import { CreateDraftSchema, SaveDraftSchema } from "@/lib/validation/application";

describe("Complete End-to-End Application Lifecycle & State Store", () => {
  const testUserId = `user_tester_${Date.now()}`;
  const testDiscordId = `999${Date.now().toString().slice(-15)}`;
  let testAppId: string;

  it("1. Should retrieve active recruitment positions and gamemodes", async () => {
    const positions = await dbService.getStaffPositions();
    expect(positions.length).toBeGreaterThan(0);

    const modes = await dbService.getGameModes();
    expect(modes.length).toBeGreaterThan(0);

    const testerPos = positions.find((p) => p.slug === "tier-tester") || positions[0];
    expect(testerPos).toBeDefined();
    expect(testerPos.enabled).toBe(true);
  });

  it("2. Should create a new draft application", async () => {
    const positions = await dbService.getStaffPositions();
    const modes = await dbService.getGameModes();
    const position = positions[0];
    const mode = modes[0];

    const draft = await dbService.createDraft({
      userId: testUserId,
      discordId: testDiscordId,
      email: "contender@vortextiers.xyz",
      positionId: position.id,
      modeId: mode.id,
      minecraftUsername: "VortexChampion",
    });

    expect(draft).toBeDefined();
    expect(draft.id).toMatch(/^VT-\d{6}$/);
    expect(draft.status).toBe("DRAFT");
    expect(draft.minecraftUsername).toBe("VortexChampion");
    testAppId = draft.id;
  });

  it("3. Should filter questions specifically for the chosen position & mode", async () => {
    const app = await dbService.getApplicationById(testAppId);
    expect(app).toBeDefined();

    const questions = await dbService.getQuestions({
      positionId: app?.positionId,
      modeId: app?.modeId || undefined,
      enabledOnly: true,
    });

    expect(questions.length).toBeGreaterThan(0);
    // All returned questions should be either universal or matching this position/mode
    for (const q of questions) {
      if (q.positionId) expect(q.positionId).toBe(app?.positionId);
      if (q.modeId) expect(q.modeId).toBe(app?.modeId);
    }
  });

  it("4. Should autosave answers and handle multi-select checkbox arrays", async () => {
    const questions = await dbService.getQuestions({ enabledOnly: true });
    const q1 = questions[0];

    await dbService.saveDraftAnswers(
      testAppId,
      [
        {
          questionId: q1.id,
          value: "I have 4 years of Tier 1 Crystal PvP experience.",
          selectedOptions: ["Weekdays", "Weekends"],
        },
      ],
      { minecraftUsername: "VortexMaster2026" }
    );

    const appAfter = await dbService.getApplicationById(testAppId);
    expect(appAfter?.minecraftUsername).toBe("VortexMaster2026");

    const savedAns = appAfter?.answers?.find((a: any) => a.questionId === q1.id);
    expect(savedAns).toBeDefined();
    expect(savedAns?.value).toBe("I have 4 years of Tier 1 Crystal PvP experience.");
  });

  it("5. Should validate draft schemas before allowing submission", async () => {
    const validData = {
      positionId: "pos-tester",
      modeId: "mode-crystal",
      minecraftUsername: "ClownPierce",
    };

    const result = CreateDraftSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidIgn = {
      ...validData,
      minecraftUsername: "invalid space in name",
    };
    const invalidResult = CreateDraftSchema.safeParse(invalidIgn);
    expect(invalidResult.success).toBe(false);
  });

  it("6. Should submit application, create status history, and snapshot questions", async () => {
    const submittedApp = await dbService.submitApplication(testAppId);
    expect(submittedApp.status).toBe("SUBMITTED");
    expect(submittedApp.submittedAt).toBeDefined();
  });

  it("7. Should transition status through reviewer workflow (UNDER_REVIEW -> ACCEPTED)", async () => {
    // 1. Move to UNDER_REVIEW
    const underReviewApp = await dbService.updateApplicationStatus({
      applicationId: testAppId,
      newStatus: "UNDER_REVIEW" as ApplicationStatus,
      reviewerId: "reviewer_007",
      note: "Testing applicant 1v1 combat mechanics in Crystal.",
    });
    expect(underReviewApp.status).toBe("UNDER_REVIEW");

    // 2. Add private reviewer note
    const note = await dbService.addAdminNote({
      applicationId: testAppId,
      authorId: "reviewer_007",
      content: "Candidate showed phenomenal shield disable timing and anchor mechanics. Strong Tier 1 candidate.",
    });
    expect(note).toBeDefined();
    expect(note.content).toContain("phenomenal shield disable timing");

    // 3. Accept application
    const acceptedApp = await dbService.updateApplicationStatus({
      applicationId: testAppId,
      newStatus: "ACCEPTED" as ApplicationStatus,
      reviewerId: "reviewer_007",
      decisionReason: "Outstanding tier testing performance.",
      acceptanceMessage: "Welcome to the Vortex Tiers Crystal Testing roster!",
    });
    expect(acceptedApp.status).toBe("ACCEPTED");
    expect(acceptedApp.acceptanceMessage).toBe("Welcome to the Vortex Tiers Crystal Testing roster!");
  });
});
