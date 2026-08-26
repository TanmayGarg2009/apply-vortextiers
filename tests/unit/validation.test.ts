import { describe, it, expect } from "vitest";
import {
  MinecraftIgnRegex,
  CreateDraftSchema,
  SaveDraftSchema,
  SubmitApplicationSchema,
  QuestionConfigSchema,
} from "@/lib/validation/application";

describe("Validation Schemas", () => {
  describe("Minecraft IGN Regex", () => {
    it("should accept valid Minecraft usernames (3-16 alphanumeric + underscores)", () => {
      expect(MinecraftIgnRegex.test("Minikloon")).toBe(true);
      expect(MinecraftIgnRegex.test("player_123")).toBe(true);
      expect(MinecraftIgnRegex.test("abc")).toBe(true);
      expect(MinecraftIgnRegex.test("1234567890123456")).toBe(true);
    });

    it("should reject invalid Minecraft usernames", () => {
      expect(MinecraftIgnRegex.test("ab")).toBe(false); // Too short (<3)
      expect(MinecraftIgnRegex.test("toolongusernamethatisnotvalid")).toBe(false); // Too long (>16)
      expect(MinecraftIgnRegex.test("invalid-name")).toBe(false); // Hyphen not allowed
      expect(MinecraftIgnRegex.test("user name")).toBe(false); // Spaces not allowed
      expect(MinecraftIgnRegex.test("user@name")).toBe(false); // Special chars
    });
  });

  describe("CreateDraftSchema", () => {
    it("should validate draft creation payload", () => {
      const valid = CreateDraftSchema.safeParse({
        positionId: "pos-tester",
        modeId: "mode-crystal",
        minecraftUsername: "CrystalGod",
      });
      expect(valid.success).toBe(true);
    });

    it("should fail when positionId is missing", () => {
      const invalid = CreateDraftSchema.safeParse({
        minecraftUsername: "CrystalGod",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("SubmitApplicationSchema", () => {
    it("should require explicit accuracy confirmation", () => {
      const valid = SubmitApplicationSchema.safeParse({ confirmAccuracy: true });
      expect(valid.success).toBe(true);

      const invalid = SubmitApplicationSchema.safeParse({ confirmAccuracy: false });
      expect(invalid.success).toBe(false);
    });
  });

  describe("QuestionConfigSchema", () => {
    it("should validate question definition", () => {
      const valid = QuestionConfigSchema.safeParse({
        title: "Explain your experience",
        description: "Be detailed",
        type: "PARAGRAPH",
        required: true,
        minLength: 50,
        maxLength: 500,
      });
      expect(valid.success).toBe(true);
    });

    it("should reject question with title shorter than 3 chars", () => {
      const invalid = QuestionConfigSchema.safeParse({
        title: "Hi",
        type: "SHORT_TEXT",
      });
      expect(invalid.success).toBe(false);
    });
  });
});
