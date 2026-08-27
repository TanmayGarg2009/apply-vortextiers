import prisma from "./prisma";
import { Prisma } from "@prisma/client";
import {
  ApplicationData,
  QuestionData,
  StaffPositionData,
  GameModeData,
  SessionUser,
  Role,
  ApplicationStatus,
  EmailType,
  EmailStatus,
  UploadCategory,
  StatusHistoryData,
  AdminNoteData,
  EmailEventData,
} from "@/types";

// In-Memory fallback store for dev/testing when PostgreSQL connection is unavailable
class InMemoryStore {
  users: Map<string, any> = new Map();
  positions: Map<string, any> = new Map();
  modes: Map<string, any> = new Map();
  questions: Map<string, any> = new Map();
  applications: Map<string, any> = new Map();
  answers: Map<string, any> = new Map();
  uploads: Map<string, any> = new Map();
  notes: Map<string, any> = new Map();
  statusHistory: Map<string, any> = new Map();
  emailEvents: Map<string, any> = new Map();
  settings: Map<string, any> = new Map();

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    // 1. Game modes
    const defaultModes = [
      { id: "mode-crystal", slug: "crystal", name: "Crystal", description: "End Crystal PvP tiering & testing", icon: "crystal", enabled: true, order: 1 },
      { id: "mode-nethpot", slug: "neth-pot", name: "Netherite Pot", description: "Netherite Armor & Splash Potion PvP", icon: "potion", enabled: true, order: 2 },
      { id: "mode-pot", slug: "pot", name: "Pot (Nodebuff)", description: "Diamond Pot & Nodebuff Speed II PvP", icon: "potion", enabled: true, order: 3 },
      { id: "mode-sword", slug: "sword", name: "Sword", description: "Vanilla 1.9+ Sword & Timing PvP", icon: "sword", enabled: true, order: 4 },
      { id: "mode-uhc", slug: "uhc", name: "UHC", description: "Ultra Hardcore PvP mechanics & rod combat", icon: "golden_apple", enabled: true, order: 5 },
      { id: "mode-smp", slug: "smp", name: "SMP", description: "Survival Multiplayer Shield & Axe combat", icon: "shield", enabled: true, order: 6 },
      { id: "mode-axe", slug: "axe", name: "Axe", description: "Axe & Shield PvP mechanics", icon: "axe", enabled: true, order: 7 },
      { id: "mode-mace", slug: "mace", name: "Mace", description: "1.21 Heavy Mace & Smash mechanics", icon: "mace", enabled: true, order: 8 },
    ];
    defaultModes.forEach((m) => this.modes.set(m.id, m));

    // 2. Positions
    const defaultPositions = [
      { id: "pos-tester", slug: "tier-tester", name: "Tier Tester", description: "Evaluate applicant skill levels in 1v1 duels, accurately scoring tiers (HT1-HT4, LT1-LT5).", requiredEvidence: true, enabled: true, order: 1 },
      { id: "pos-mod", slug: "moderator", name: "Moderator", description: "Enforce community standards, manage tiering queues, resolve disputes, and maintain Discord server integrity.", requiredEvidence: false, enabled: true, order: 2 },
      { id: "pos-trial", slug: "trial-staff", name: "Trial Staff", description: "Entry-level staff position assisting with queue moderation, ticket management, and initial screening.", requiredEvidence: false, enabled: true, order: 3 },
      { id: "pos-event", slug: "event-staff", name: "Event Staff", description: "Organize, stream, and referee official Vortex Tiers tournaments and community events.", requiredEvidence: true, enabled: true, order: 4 },
    ];
    defaultPositions.forEach((p) => this.positions.set(p.id, p));

    // 3. Questions
    const defaultQuestions = [
      {
        id: "q-ign",
        title: "Minecraft Java In-Game Name (IGN)",
        description: "Enter your primary Minecraft Java Edition username.",
        type: "MINECRAFT_USERNAME",
        required: true,
        order: 1,
        minLength: 3,
        maxLength: 16,
        enabled: true,
        version: 1,
      },
      {
        id: "q-region",
        title: "Age & Timezone / Region",
        description: "Please select your primary competitive region and specify your timezone.",
        type: "MULTIPLE_CHOICE",
        required: true,
        order: 2,
        options: ["NA (North America)", "EU (Europe)", "AS (Asia)", "ME (Middle East)", "AU/OCE (Oceania)", "SA (South America)"],
        enabled: true,
        version: 1,
      },
      {
        id: "q-availability",
        title: "Weekly Availability",
        description: "How many hours per week can you actively dedicate to Vortex Tiers testing or moderation?",
        type: "MULTIPLE_CHOICE",
        required: true,
        order: 3,
        options: ["5 - 10 hours", "10 - 20 hours", "20 - 35 hours", "35+ hours"],
        enabled: true,
        version: 1,
      },
      {
        id: "q-experience",
        title: "Past Staff / Tiering Experience",
        description: "Detail any past experience as a staff member, tier tester, or tournament referee in Minecraft competitive communities.",
        type: "PARAGRAPH",
        required: true,
        order: 4,
        minLength: 50,
        maxLength: 2000,
        enabled: true,
        version: 1,
      },
      {
        id: "q-motivation",
        title: "Why do you want to join Vortex Tiers Staff?",
        description: "Explain what motivates you to apply and what unique value you bring to the team.",
        type: "PARAGRAPH",
        required: true,
        order: 5,
        minLength: 80,
        maxLength: 2500,
        enabled: true,
        version: 1,
      },
      {
        id: "q-capabilities",
        title: "Microphone & Recording Capability",
        description: "Do you have a working microphone and the capability to record/clip 1080p 60fps gameplay for evidence?",
        type: "MULTIPLE_SELECT",
        required: true,
        order: 6,
        minSelections: 1,
        maxSelections: 3,
        options: [
          "Working microphone with clear audio",
          "Capable of recording/clipping 60+ FPS gameplay with OBS/GeForce Experience/Medal",
          "Familiar with screen-sharing / duel recording inspection",
        ],
        enabled: true,
        version: 1,
      },
      {
        id: "q-vouch",
        title: "Gameplay Highlights / Test Clips / Vouch Links",
        description: "Provide a YouTube/Medal link to your competitive PvP gameplay or past testing clips in your selected mode.",
        type: "URL",
        required: false,
        order: 7,
        enabled: true,
        version: 1,
      },
      {
        id: "q-evidence-img",
        title: "Competitive Tiering Evidence / Screenshots",
        description: "Upload screenshots of your current tiers, tournament placements, or past staff credentials.",
        type: "IMAGE",
        required: false,
        order: 8,
        maxFiles: 5,
        maxFileSizeMb: 20,
        allowedFileTypes: ["image/png", "image/jpeg", "image/webp"],
        enabled: true,
        version: 1,
      },
      {
        id: "q-evidence-vid",
        title: "Raw Gameplay / Testing Video Evidence",
        description: "Upload an unedited video file showing 1v1 testing or competitive duels (MP4, WebM, MOV).",
        type: "VIDEO",
        required: false,
        order: 9,
        positionId: "pos-tester",
        maxFiles: 2,
        maxFileSizeMb: 150,
        allowedFileTypes: ["video/mp4", "video/webm", "video/quicktime"],
        enabled: true,
        version: 1,
      },
    ];
    defaultQuestions.forEach((q) => this.questions.set(q.id, q));

    // 4. Settings
    this.settings.set("applications_open", { key: "applications_open", value: true, description: "Whether the staff application system is open." });
    this.settings.set("cooldown_days", { key: "cooldown_days", value: 14, description: "Cooldown days after rejection." });
    this.settings.set("max_upload_size_mb", { key: "max_upload_size_mb", value: 150, description: "Max file size in MB." });
    this.settings.set("resubmissions_allowed", { key: "resubmissions_allowed", value: true, description: "Allow resubmissions after cooldown." });
    this.settings.set("announcement_banner", { key: "announcement_banner", value: "Applications for Season 2026 Tier Testers and Moderators are currently OPEN.", description: "Announcement banner." });
  }
}

const memoryStore = new InMemoryStore();

let dbAvailableCache: boolean | null = null;
let lastDbCheckTime = 0;

/**
 * Determine whether to use PostgreSQL Prisma connection or fallback store
 */
async function canConnectToDatabase(): Promise<boolean> {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("postgres.xxx")) {
    return false;
  }
  const now = Date.now();
  if (dbAvailableCache !== null && now - lastDbCheckTime < 30000) {
    return dbAvailableCache;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailableCache = true;
    lastDbCheckTime = now;
    return true;
  } catch {
    dbAvailableCache = false;
    lastDbCheckTime = now;
    return false;
  }
}

export const dbService = {
  // --- Game Modes ---
  async getGameModes(): Promise<GameModeData[]> {
    if (await canConnectToDatabase()) {
      const modes = await prisma.gameMode.findMany({ orderBy: { order: "asc" } });
      return modes as any;
    }
    return Array.from(memoryStore.modes.values()).sort((a, b) => a.order - b.order);
  },

  async createGameMode(data: Partial<GameModeData>): Promise<GameModeData> {
    if (await canConnectToDatabase()) {
      return (await prisma.gameMode.create({ data: data as any })) as any;
    }
    const id = `mode-${Date.now()}`;
    const mode = { id, enabled: true, order: memoryStore.modes.size + 1, ...data };
    memoryStore.modes.set(id, mode);
    return mode as any;
  },

  async updateGameMode(id: string, data: Partial<GameModeData>): Promise<GameModeData> {
    if (await canConnectToDatabase()) {
      return (await prisma.gameMode.update({ where: { id }, data: data as any })) as any;
    }
    const mode = { ...memoryStore.modes.get(id), ...data };
    memoryStore.modes.set(id, mode);
    return mode;
  },

  async deleteGameMode(id: string): Promise<void> {
    if (await canConnectToDatabase()) {
      await prisma.gameMode.delete({ where: { id } });
      return;
    }
    memoryStore.modes.delete(id);
  },

  // --- Staff Positions ---
  async getStaffPositions(): Promise<StaffPositionData[]> {
    if (await canConnectToDatabase()) {
      const positions = await prisma.staffPosition.findMany({ orderBy: { order: "asc" } });
      return positions as any;
    }
    return Array.from(memoryStore.positions.values()).sort((a, b) => a.order - b.order);
  },

  async createStaffPosition(data: Partial<StaffPositionData>): Promise<StaffPositionData> {
    if (await canConnectToDatabase()) {
      return (await prisma.staffPosition.create({ data: data as any })) as any;
    }
    const id = `pos-${Date.now()}`;
    const pos = { id, enabled: true, order: memoryStore.positions.size + 1, ...data };
    memoryStore.positions.set(id, pos);
    return pos as any;
  },

  async updateStaffPosition(id: string, data: Partial<StaffPositionData>): Promise<StaffPositionData> {
    if (await canConnectToDatabase()) {
      return (await prisma.staffPosition.update({ where: { id }, data: data as any })) as any;
    }
    const pos = { ...memoryStore.positions.get(id), ...data };
    memoryStore.positions.set(id, pos);
    return pos;
  },

  async deleteStaffPosition(id: string): Promise<void> {
    if (await canConnectToDatabase()) {
      await prisma.staffPosition.delete({ where: { id } });
      return;
    }
    memoryStore.positions.delete(id);
  },

  // --- Questions ---
  async getQuestions(filters?: { positionId?: string; modeId?: string; enabledOnly?: boolean }): Promise<QuestionData[]> {
    if (await canConnectToDatabase()) {
      const where: any = {};
      if (filters?.enabledOnly) where.enabled = true;
      if (filters?.positionId) {
        where.OR = [{ positionId: null }, { positionId: filters.positionId }];
      }
      if (filters?.modeId) {
        where.AND = [
          ...(where.AND || []),
          { OR: [{ modeId: null }, { modeId: filters.modeId }] },
        ];
      }
      const questions = await prisma.question.findMany({
        where,
        orderBy: { order: "asc" },
      });
      return questions.map((q) => ({
        ...q,
        options: q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : null,
        allowedFileTypes: q.allowedFileTypes ? (typeof q.allowedFileTypes === "string" ? JSON.parse(q.allowedFileTypes) : q.allowedFileTypes) : null,
      })) as any;
    }

    let list = Array.from(memoryStore.questions.values());
    if (filters?.enabledOnly) {
      list = list.filter((q) => q.enabled);
    }
    if (filters?.positionId) {
      list = list.filter((q) => !q.positionId || q.positionId === filters.positionId);
    }
    if (filters?.modeId) {
      list = list.filter((q) => !q.modeId || q.modeId === filters.modeId);
    }
    return list.sort((a, b) => a.order - b.order);
  },

  async createQuestion(data: Partial<QuestionData>): Promise<QuestionData> {
    if (await canConnectToDatabase()) {
      const created = await prisma.question.create({
        data: {
          ...data,
          options: data.options ? JSON.stringify(data.options) : undefined,
          allowedFileTypes: data.allowedFileTypes ? JSON.stringify(data.allowedFileTypes) : undefined,
        } as any,
      });
      return {
        ...created,
        options: created.options ? JSON.parse(created.options as string) : null,
        allowedFileTypes: created.allowedFileTypes ? JSON.parse(created.allowedFileTypes as string) : null,
      } as any;
    }

    const id = `q-${Date.now()}`;
    const question = { id, enabled: true, version: 1, order: memoryStore.questions.size + 1, ...data };
    memoryStore.questions.set(id, question);
    return question as any;
  },

  async updateQuestion(id: string, data: Partial<QuestionData>): Promise<QuestionData> {
    if (await canConnectToDatabase()) {
      const updated = await prisma.question.update({
        where: { id },
        data: {
          ...data,
          options: data.options ? JSON.stringify(data.options) : undefined,
          allowedFileTypes: data.allowedFileTypes ? JSON.stringify(data.allowedFileTypes) : undefined,
          version: { increment: 1 },
        } as any,
      });
      return {
        ...updated,
        options: updated.options ? JSON.parse(updated.options as string) : null,
        allowedFileTypes: updated.allowedFileTypes ? JSON.parse(updated.allowedFileTypes as string) : null,
      } as any;
    }

    const existing = memoryStore.questions.get(id) || {};
    const question = { ...existing, ...data, version: (existing.version || 1) + 1 };
    memoryStore.questions.set(id, question);
    return question;
  },

  async deleteQuestion(id: string): Promise<void> {
    if (await canConnectToDatabase()) {
      await prisma.question.delete({ where: { id } });
      return;
    }
    memoryStore.questions.delete(id);
  },

  // --- Applications ---
  async generateApplicationId(): Promise<string> {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `VT-${randomDigits}`;
  },

  async getApplicationById(id: string): Promise<ApplicationData | null> {
    if (await canConnectToDatabase()) {
      const app = await prisma.application.findUnique({
        where: { id },
        include: {
          user: true,
          position: true,
          mode: true,
          reviewedBy: true,
          answers: { include: { question: true } },
          uploads: true,
          adminNotes: { include: { author: true }, orderBy: { createdAt: "desc" } },
          statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
          emailEvents: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!app) return null;
      return {
        ...app,
        answers: app.answers.map((a) => ({
          ...a,
          questionSnapshot: a.questionSnapshot ? (typeof a.questionSnapshot === "string" ? JSON.parse(a.questionSnapshot) : a.questionSnapshot) : null,
          selectedOptions: a.selectedOptions ? (typeof a.selectedOptions === "string" ? JSON.parse(a.selectedOptions) : a.selectedOptions) : null,
        })),
      } as any;
    }

    const app = memoryStore.applications.get(id);
    if (!app) return null;

    const answers = Array.from(memoryStore.answers.values()).filter((a) => a.applicationId === id);
    const uploads = Array.from(memoryStore.uploads.values()).filter((u) => u.applicationId === id);
    const adminNotes = Array.from(memoryStore.notes.values()).filter((n) => n.applicationId === id);
    const statusHistory = Array.from(memoryStore.statusHistory.values()).filter((s) => s.applicationId === id);
    const emailEvents = Array.from(memoryStore.emailEvents.values()).filter((e) => e.applicationId === id);

    const position = memoryStore.positions.get(app.positionId);
    const mode = app.modeId ? memoryStore.modes.get(app.modeId) : null;
    const user = memoryStore.users.get(app.userId);

    return {
      ...app,
      position,
      mode,
      user,
      answers,
      uploads,
      adminNotes,
      statusHistory,
      emailEvents,
    };
  },

  async getUserApplications(userId: string): Promise<ApplicationData[]> {
    if (await canConnectToDatabase()) {
      const apps = await prisma.application.findMany({
        where: { userId },
        include: {
          position: true,
          mode: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return apps as any;
    }

    return Array.from(memoryStore.applications.values())
      .filter((a) => a.userId === userId)
      .map((app) => ({
        ...app,
        position: memoryStore.positions.get(app.positionId),
        mode: app.modeId ? memoryStore.modes.get(app.modeId) : null,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async searchApplications(params: {
    query?: string;
    status?: ApplicationStatus;
    positionId?: string;
    modeId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ applications: ApplicationData[]; total: number; totalPages: number }> {
    const page = params.page || 1;
    const limit = params.limit || 15;
    const skip = (page - 1) * limit;

    if (await canConnectToDatabase()) {
      const where: any = {};
      if (params.status) where.status = params.status;
      if (params.positionId) where.positionId = params.positionId;
      if (params.modeId) where.modeId = params.modeId;
      if (params.query) {
        where.OR = [
          { id: { contains: params.query, mode: "insensitive" } },
          { discordId: { contains: params.query, mode: "insensitive" } },
          { email: { contains: params.query, mode: "insensitive" } },
          { minecraftUsername: { contains: params.query, mode: "insensitive" } },
          { user: { discordUsername: { contains: params.query, mode: "insensitive" } } },
        ];
      }

      const [total, apps] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
          where,
          include: {
            user: true,
            position: true,
            mode: true,
            reviewedBy: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
      ]);

      return {
        applications: apps as any,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }

    let list = Array.from(memoryStore.applications.values()).map((app) => ({
      ...app,
      position: memoryStore.positions.get(app.positionId),
      mode: app.modeId ? memoryStore.modes.get(app.modeId) : null,
      user: memoryStore.users.get(app.userId),
    }));

    if (params.status) {
      list = list.filter((a) => a.status === params.status);
    }
    if (params.positionId) {
      list = list.filter((a) => a.positionId === params.positionId);
    }
    if (params.modeId) {
      list = list.filter((a) => a.modeId === params.modeId);
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.discordId.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.minecraftUsername && a.minecraftUsername.toLowerCase().includes(q)) ||
          (a.user && a.user.discordUsername.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const paginated = list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit);

    return {
      applications: paginated,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async createDraft(params: {
    userId: string;
    discordId: string;
    email: string;
    positionId: string;
    modeId?: string | null;
    minecraftUsername?: string | null;
  }): Promise<ApplicationData> {
    const id = await this.generateApplicationId();

    if (await canConnectToDatabase()) {
      const app = await prisma.application.create({
        data: {
          id,
          userId: params.userId,
          discordId: params.discordId,
          email: params.email,
          positionId: params.positionId,
          modeId: params.modeId || null,
          minecraftUsername: params.minecraftUsername || null,
          status: "DRAFT",
          version: 1,
        },
        include: {
          position: true,
          mode: true,
        },
      });
      return app as any;
    }

    const app: ApplicationData = {
      id,
      userId: params.userId,
      discordId: params.discordId,
      email: params.email,
      positionId: params.positionId,
      modeId: params.modeId || null,
      minecraftUsername: params.minecraftUsername || null,
      status: "DRAFT",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.applications.set(id, app);
    return {
      ...app,
      position: memoryStore.positions.get(params.positionId),
      mode: params.modeId ? memoryStore.modes.get(params.modeId) : null,
    };
  },

  async saveDraftAnswers(
    applicationId: string,
    answers: { questionId: string; value?: string | null; selectedOptions?: string[] | null }[],
    meta?: { minecraftUsername?: string | null; modeId?: string | null; positionId?: string }
  ) {
    if (await canConnectToDatabase()) {
      await prisma.$transaction(async (tx) => {
        if (meta) {
          await tx.application.update({
            where: { id: applicationId },
            data: {
              minecraftUsername: meta.minecraftUsername !== undefined ? meta.minecraftUsername : undefined,
              modeId: meta.modeId !== undefined ? meta.modeId : undefined,
              positionId: meta.positionId !== undefined ? meta.positionId : undefined,
              updatedAt: new Date(),
            },
          });
        }

        for (const ans of answers) {
          await tx.answer.upsert({
            where: {
              applicationId_questionId: {
                applicationId,
                questionId: ans.questionId,
              },
            },
            update: {
              value: ans.value,
              selectedOptions: ans.selectedOptions && ans.selectedOptions.length > 0 ? (ans.selectedOptions as any) : Prisma.DbNull,
              updatedAt: new Date(),
            },
            create: {
              applicationId,
              questionId: ans.questionId,
              value: ans.value,
              selectedOptions: ans.selectedOptions && ans.selectedOptions.length > 0 ? (ans.selectedOptions as any) : Prisma.DbNull,
            },
          });
        }
      });
      return;
    }

    const app = memoryStore.applications.get(applicationId);
    if (app) {
      if (meta?.minecraftUsername !== undefined) app.minecraftUsername = meta.minecraftUsername;
      if (meta?.modeId !== undefined) app.modeId = meta.modeId;
      if (meta?.positionId !== undefined) app.positionId = meta.positionId;
      app.updatedAt = new Date();
      memoryStore.applications.set(applicationId, app);
    }

    for (const ans of answers) {
      const key = `${applicationId}_${ans.questionId}`;
      memoryStore.answers.set(key, {
        id: key,
        applicationId,
        questionId: ans.questionId,
        value: ans.value,
        selectedOptions: ans.selectedOptions,
        updatedAt: new Date(),
      });
    }
  },

  async submitApplication(applicationId: string) {
    const questions = await this.getQuestions();
    const qMap = new Map(questions.map((q) => [q.id, q]));

    if (await canConnectToDatabase()) {
      return await prisma.$transaction(async (tx) => {
        const currentApp = await tx.application.findUnique({ where: { id: applicationId } });
        const fromStatus = currentApp?.status || "DRAFT";

        // Snapshot all answered questions
        const answers = await tx.answer.findMany({ where: { applicationId } });
        for (const ans of answers) {
          const questionDef = qMap.get(ans.questionId);
          if (questionDef) {
            await tx.answer.update({
              where: { id: ans.id },
              data: {
                questionSnapshot: JSON.stringify(questionDef),
              },
            });
          }
        }

        const updatedApp = await tx.application.update({
          where: { id: applicationId },
          data: {
            status: "SUBMITTED",
            submittedAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            user: true,
            position: true,
            mode: true,
          },
        });

        await tx.statusHistory.create({
          data: {
            applicationId,
            fromStatus,
            toStatus: "SUBMITTED",
            note: "Applicant submitted application for staff review.",
          },
        });

        return updatedApp;
      });
    }

    const app = memoryStore.applications.get(applicationId);
    if (!app) throw new Error("Application not found");

    // Snapshot questions in memory answers
    for (const [key, ans] of Array.from(memoryStore.answers.entries())) {
      if (ans.applicationId === applicationId) {
        ans.questionSnapshot = qMap.get(ans.questionId) || null;
        memoryStore.answers.set(key, ans);
      }
    }

    app.status = "SUBMITTED";
    app.submittedAt = new Date();
    app.updatedAt = new Date();
    memoryStore.applications.set(applicationId, app);

    const historyId = `sh-${Date.now()}`;
    memoryStore.statusHistory.set(historyId, {
      id: historyId,
      applicationId,
      fromStatus: "DRAFT",
      toStatus: "SUBMITTED",
      note: "Applicant submitted application for staff review.",
      createdAt: new Date(),
    });

    return {
      ...app,
      position: memoryStore.positions.get(app.positionId),
      mode: app.modeId ? memoryStore.modes.get(app.modeId) : null,
      user: memoryStore.users.get(app.userId),
    };
  },

  async updateApplicationStatus(params: {
    applicationId: string;
    newStatus: ApplicationStatus;
    reviewerId: string;
    decisionReason?: string | null;
    acceptanceMessage?: string | null;
    rejectionReason?: string | null;
    note?: string | null;
  }) {
    const existing = await this.getApplicationById(params.applicationId);
    if (!existing) throw new Error("Application not found");

    const fromStatus = existing.status;

    if (await canConnectToDatabase()) {
      return await prisma.$transaction(async (tx) => {
        const updated = await tx.application.update({
          where: { id: params.applicationId },
          data: {
            status: params.newStatus,
            reviewedAt: new Date(),
            reviewedById: params.reviewerId,
            decisionReason: params.decisionReason,
            acceptanceMessage: params.acceptanceMessage,
            rejectionReason: params.rejectionReason,
            updatedAt: new Date(),
          },
          include: {
            user: true,
            position: true,
            mode: true,
          },
        });

        await tx.statusHistory.create({
          data: {
            applicationId: params.applicationId,
            fromStatus,
            toStatus: params.newStatus,
            changedById: params.reviewerId,
            note: params.note || `Status changed to ${params.newStatus}`,
          },
        });

        return updated;
      });
    }

    const app = memoryStore.applications.get(params.applicationId);
    app.status = params.newStatus;
    app.reviewedAt = new Date();
    app.reviewedById = params.reviewerId;
    if (params.decisionReason !== undefined) app.decisionReason = params.decisionReason;
    if (params.acceptanceMessage !== undefined) app.acceptanceMessage = params.acceptanceMessage;
    if (params.rejectionReason !== undefined) app.rejectionReason = params.rejectionReason;
    app.updatedAt = new Date();
    memoryStore.applications.set(params.applicationId, app);

    const historyId = `sh-${Date.now()}`;
    memoryStore.statusHistory.set(historyId, {
      id: historyId,
      applicationId: params.applicationId,
      fromStatus,
      toStatus: params.newStatus,
      changedById: params.reviewerId,
      note: params.note || `Status changed to ${params.newStatus}`,
      createdAt: new Date(),
    });

    return {
      ...app,
      position: memoryStore.positions.get(app.positionId),
      mode: app.modeId ? memoryStore.modes.get(app.modeId) : null,
      user: memoryStore.users.get(app.userId),
    };
  },

  // --- Internal Admin Notes ---
  async addAdminNote(params: { applicationId: string; authorId: string; content: string }): Promise<AdminNoteData> {
    if (await canConnectToDatabase()) {
      const note = await prisma.adminNote.create({
        data: {
          applicationId: params.applicationId,
          authorId: params.authorId,
          content: params.content,
        },
        include: { author: true },
      });
      return note as any;
    }

    const id = `note-${Date.now()}`;
    const author = memoryStore.users.get(params.authorId) || { discordUsername: "Admin" };
    const note: AdminNoteData = {
      id,
      applicationId: params.applicationId,
      authorId: params.authorId,
      author,
      content: params.content,
      createdAt: new Date(),
    };
    memoryStore.notes.set(id, note);
    return note;
  },

  // --- Settings ---
  async getSettings(): Promise<Record<string, any>> {
    if (await canConnectToDatabase()) {
      const settings = await prisma.appSetting.findMany();
      const map: Record<string, any> = {};
      settings.forEach((s) => {
        map[s.key] = s.value;
      });
      return map;
    }

    const map: Record<string, any> = {};
    memoryStore.settings.forEach((s, k) => {
      map[k] = s.value;
    });
    return map;
  },

  async updateSetting(key: string, value: any, updatedById?: string) {
    if (await canConnectToDatabase()) {
      await prisma.appSetting.upsert({
        where: { key },
        update: { value, updatedById },
        create: { key, value, updatedById },
      });
      return;
    }

    memoryStore.settings.set(key, { key, value, updatedById, updatedAt: new Date() });
  },

  // --- Metrics ---
  async getMetrics() {
    if (await canConnectToDatabase()) {
      const [pending, underReview, accepted, rejected, total] = await Promise.all([
        prisma.application.count({ where: { status: "SUBMITTED" } }),
        prisma.application.count({ where: { status: "UNDER_REVIEW" } }),
        prisma.application.count({ where: { status: "ACCEPTED" } }),
        prisma.application.count({ where: { status: "REJECTED" } }),
        prisma.application.count(),
      ]);
      return { pending, underReview, accepted, rejected, total };
    }

    const all = Array.from(memoryStore.applications.values());
    const pending = all.filter((a) => a.status === "SUBMITTED").length;
    const underReview = all.filter((a) => a.status === "UNDER_REVIEW").length;
    const accepted = all.filter((a) => a.status === "ACCEPTED").length;
    const rejected = all.filter((a) => a.status === "REJECTED").length;
    return { pending, underReview, accepted, rejected, total: all.length };
  },
};

export default dbService;
