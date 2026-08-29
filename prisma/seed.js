const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Vortex Tiers & Network Staff Application database...");

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

  // 2. Seed Official Staff Positions
  const positions = [
    // --- Vortex Tiers Roles ---
    {
      slug: "tier-tester",
      name: "Tier Tester",
      description: "Evaluate applicant and player skill levels in 1v1 duels, accurately scoring tiers (HT1-HT4, LT1-LT5).",
      requiredEvidence: true,
      enabled: true,
      order: 1,
    },
    {
      slug: "screensharer",
      name: "Screensharer",
      description: "Conduct thorough client & screen inspections for cheat clients, macros, autodeck, and illicit modifications.",
      requiredEvidence: true,
      enabled: true,
      order: 2,
    },
    {
      slug: "tiers-helper",
      name: "Tiers Helper",
      description: "Assist players in the tiering queue, coordinate testing matches, answer questions, and assist senior testers.",
      requiredEvidence: false,
      enabled: true,
      order: 3,
    },

    // --- Vortex Network Roles (Default: Trial Staff open for application) ---
    {
      slug: "trial-staff",
      name: "Trial Staff",
      description: "Entry-level network staff position assisting with player reports, basic chat moderation, and ticket triage.",
      requiredEvidence: false,
      enabled: true,
      order: 10,
    },
    {
      slug: "network-helper",
      name: "Helper",
      description: "Helps members with questions and basic server problems. Passes escalated issues to Moderators.",
      requiredEvidence: false,
      enabled: false,
      order: 11,
    },
    {
      slug: "mod",
      name: "Mod",
      description: "Keeps the Discord and Minecraft community clean and friendly. Handles reports, rule breakers, and basic punishments.",
      requiredEvidence: false,
      enabled: false,
      order: 12,
    },
    {
      slug: "sr-mod",
      name: "Sr Mod",
      description: "Supervises the Moderation team, manages complex reports, and assists Moderators during active incidents.",
      requiredEvidence: false,
      enabled: false,
      order: 13,
    },
    {
      slug: "partnership-manager",
      name: "Partnership Manager",
      description: "Handles partnerships with other gaming communities. Reviews partnership requests and manages outreach.",
      requiredEvidence: false,
      enabled: false,
      order: 14,
    },
    {
      slug: "admin",
      name: "Admin",
      description: "Handles reports, punishments, appeals, and important player issues. Guides the Moderation team.",
      requiredEvidence: false,
      enabled: false,
      order: 15,
    },
    {
      slug: "developer",
      name: "Developer",
      description: "Works on the technical side: Minecraft plugins, Discord bots, server architecture, and feature development.",
      requiredEvidence: true,
      enabled: false,
      order: 16,
    },
    {
      slug: "sr-admin",
      name: "Sr Admin",
      description: "Supervises Admin and Mod teams. Handles high-severity reports, major punishments, and administrative incidents.",
      requiredEvidence: false,
      enabled: false,
      order: 17,
    },
    {
      slug: "manager",
      name: "Manager",
      description: "Oversees the overall staff team, daily server operations, staff conduct, and team performance.",
      requiredEvidence: false,
      enabled: false,
      order: 18,
    },
    {
      slug: "network-manager",
      name: "Network Manager",
      description: "Directly oversees the Minecraft server ecosystem, infrastructure, server hosting, and development roadmaps.",
      requiredEvidence: false,
      enabled: false,
      order: 19,
    },
    {
      slug: "co-owner",
      name: "Co Owner",
      description: "Executive server leadership working alongside the Owner to govern network operations.",
      requiredEvidence: false,
      enabled: false,
      order: 20,
    },
    {
      slug: "owner",
      name: "Owner",
      description: "Executive server ownership managing high-level decisions, finances, staff leadership, and server policies.",
      requiredEvidence: false,
      enabled: false,
      order: 21,
    },
    {
      slug: "founder",
      name: "Founder",
      description: "Ultimate executive authority over Vortex Tiers and Vortex Network.",
      requiredEvidence: false,
      enabled: false,
      order: 22,
    },
  ];

  for (const pos of positions) {
    await prisma.staffPosition.upsert({
      where: { slug: pos.slug },
      update: {
        name: pos.name,
        description: pos.description,
        requiredEvidence: pos.requiredEvidence,
        order: pos.order,
      },
      create: {
        slug: pos.slug,
        name: pos.name,
        description: pos.description,
        requiredEvidence: pos.requiredEvidence,
        order: pos.order,
        enabled: pos.enabled,
      },
    });
  }
  console.log(`Seeded ${positions.length} Staff Positions across Vortex Tiers & Vortex Network.`);

  // 3. Clean up legacy DRAFT database records
  try {
    const deletedDrafts = await prisma.application.deleteMany({
      where: { status: "DRAFT" },
    });
    if (deletedDrafts.count > 0) {
      console.log(`Purged ${deletedDrafts.count} legacy DRAFT application records from database.`);
    }
  } catch (err) {
    console.warn("Legacy draft cleanup note:", err);
  }

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
