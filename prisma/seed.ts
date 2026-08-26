import { PrismaClient, Role, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Vortex Tiers Staff Application database...");

  // 1. Seed Game Modes (Vortex Tiers ecosystem)
  const gameModes = [
    { slug: "crystal", name: "Crystal", description: "End Crystal PvP tiering & testing", order: 1 },
    { slug: "neth-pot", name: "Netherite Pot", description: "Netherite Armor & Splash Potion PvP", order: 2 },
    { slug: "pot", name: "Pot (Nodebuff)", description: "Diamond Pot & Nodebuff Speed II PvP", order: 3 },
    { slug: "sword", name: "Sword", description: "Vanilla 1.9+ Sword & Timing PvP", order: 4 },
    { slug: "uhc", name: "UHC", description: "Ultra Hardcore PvP mechanics & rod combat", order: 5 },
    { slug: "smp", name: "SMP", description: "Survival Multiplayer Shield & Axe combat", order: 6 },
    { slug: "axe", name: "Axe", description: "Axe & Shield PvP mechanics", order: 7 },
    { slug: "mace", name: "Mace", description: "1.21 Heavy Mace & Smash mechanics", order: 8 },
  ];

  for (const mode of gameModes) {
    await prisma.gameMode.upsert({
      where: { slug: mode.slug },
      update: { name: mode.name, description: mode.description, order: mode.order, enabled: true },
      create: { slug: mode.slug, name: mode.name, description: mode.description, order: mode.order, enabled: true },
    });
  }
  console.log("Seeded 8 Game Modes.");

  // 2. Seed Staff Positions
  const positions = [
    {
      slug: "tier-tester",
      name: "Tier Tester",
      description: "Evaluate applicant and player skill levels in 1v1 duels, accurately scoring tiers (HT1-HT4, LT1-LT5).",
      requiredEvidence: true,
      order: 1,
    },
    {
      slug: "moderator",
      name: "Moderator",
      description: "Enforce community standards, manage tiering queues, resolve disputes, and maintain Discord server integrity.",
      requiredEvidence: false,
      order: 2,
    },
    {
      slug: "trial-staff",
      name: "Trial Staff",
      description: "Entry-level staff position assisting with queue moderation, ticket management, and initial screening.",
      requiredEvidence: false,
      order: 3,
    },
    {
      slug: "event-staff",
      name: "Event Staff",
      description: "Organize, stream, and referee official Vortex Tiers tournaments and community events.",
      requiredEvidence: true,
      order: 4,
    },
  ];

  for (const pos of positions) {
    await prisma.staffPosition.upsert({
      where: { slug: pos.slug },
      update: { name: pos.name, description: pos.description, requiredEvidence: pos.requiredEvidence, order: pos.order, enabled: true },
      create: { slug: pos.slug, name: pos.name, description: pos.description, requiredEvidence: pos.requiredEvidence, order: pos.order, enabled: true },
    });
  }
  console.log("Seeded 4 Staff Positions.");

  // 3. Seed Default Questions
  const tierTesterPos = await prisma.staffPosition.findUnique({ where: { slug: "tier-tester" } });

  const defaultQuestions = [
    {
      title: "Minecraft Java In-Game Name (IGN)",
      description: "Enter your primary Minecraft Java Edition username.",
      type: QuestionType.MINECRAFT_USERNAME,
      required: true,
      order: 1,
      minLength: 3,
      maxLength: 16,
      enabled: true,
    },
    {
      title: "Age & Timezone / Region",
      description: "Please select your primary competitive region and specify your timezone.",
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      order: 2,
      options: ["NA (North America)", "EU (Europe)", "AS (Asia)", "ME (Middle East)", "AU/OCE (Oceania)", "SA (South America)"],
      enabled: true,
    },
    {
      title: "Weekly Availability",
      description: "How many hours per week can you actively dedicate to Vortex Tiers testing or moderation?",
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      order: 3,
      options: ["5 - 10 hours", "10 - 20 hours", "20 - 35 hours", "35+ hours"],
      enabled: true,
    },
    {
      title: "Past Staff / Tiering Experience",
      description: "Detail any past experience as a staff member, tier tester, or tournament referee in Minecraft competitive communities.",
      type: QuestionType.PARAGRAPH,
      required: true,
      order: 4,
      minLength: 50,
      maxLength: 2000,
      enabled: true,
    },
    {
      title: "Why do you want to join Vortex Tiers Staff?",
      description: "Explain what motivates you to apply and what unique value you bring to the team.",
      type: QuestionType.PARAGRAPH,
      required: true,
      order: 5,
      minLength: 80,
      maxLength: 2500,
      enabled: true,
    },
    {
      title: "Microphone & Recording Capability",
      description: "Do you have a working microphone and the capability to record/clip 1080p 60fps gameplay for evidence?",
      type: QuestionType.MULTIPLE_SELECT,
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
    },
    {
      title: "Gameplay Highlights / Test Clips / Vouch Links",
      description: "Provide a YouTube/Medal link to your competitive PvP gameplay or past testing clips in your selected mode.",
      type: QuestionType.URL,
      required: false,
      order: 7,
      enabled: true,
    },
    {
      title: "Competitive Tiering Evidence / Screenshots",
      description: "Upload screenshots of your current tiers, tournament placements, or past staff credentials.",
      type: QuestionType.IMAGE,
      required: false,
      order: 8,
      maxFiles: 5,
      maxFileSizeMb: 20,
      allowedFileTypes: ["image/png", "image/jpeg", "image/webp"],
      enabled: true,
    },
    {
      title: "Raw Gameplay / Testing Video Evidence",
      description: "Upload an unedited video file showing 1v1 testing or competitive duels (MP4, WebM, MOV).",
      type: QuestionType.VIDEO,
      required: false,
      order: 9,
      maxFiles: 2,
      maxFileSizeMb: 150,
      allowedFileTypes: ["video/mp4", "video/webm", "video/quicktime"],
      positionId: tierTesterPos?.id,
      enabled: true,
    },
  ];

  for (const q of defaultQuestions) {
    const existing = await prisma.question.findFirst({ where: { title: q.title } });
    if (!existing) {
      await prisma.question.create({
        data: {
          title: q.title,
          description: q.description,
          type: q.type,
          required: q.required,
          order: q.order,
          minLength: q.minLength,
          maxLength: q.maxLength,
          minSelections: q.minSelections,
          maxSelections: q.maxSelections,
          options: q.options ? JSON.stringify(q.options) : undefined,
          allowedFileTypes: q.allowedFileTypes ? JSON.stringify(q.allowedFileTypes) : undefined,
          maxFiles: q.maxFiles || 1,
          maxFileSizeMb: q.maxFileSizeMb || 25,
          positionId: q.positionId || undefined,
          enabled: q.enabled,
        },
      });
    }
  }
  console.log("Seeded 9 Core Questions.");

  // 4. Seed Application Settings
  const settings = [
    { key: "applications_open", value: true, description: "Whether the staff application system is accepting new submissions." },
    { key: "cooldown_days", value: 14, description: "Number of days an applicant must wait after a rejection before applying again." },
    { key: "max_upload_size_mb", value: 150, description: "Global maximum upload file size in megabytes." },
    { key: "resubmissions_allowed", value: true, description: "Whether rejected applicants are permitted to reapply after the cooldown." },
    { key: "announcement_banner", value: "Applications for Season 2026 Tier Testers and Moderators are currently OPEN.", description: "Public announcement text displayed on the landing page." },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    });
  }
  console.log("Seeded Application Settings.");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
