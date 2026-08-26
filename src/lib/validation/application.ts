import { z } from "zod";

export const MinecraftIgnRegex = /^[a-zA-Z0-9_]{3,16}$/;

export const CreateDraftSchema = z.object({
  positionId: z.string().min(1, "Please select a staff position."),
  modeId: z.string().optional().nullable(),
  minecraftUsername: z
    .string()
    .regex(MinecraftIgnRegex, "Minecraft username must be 3-16 alphanumeric characters.")
    .optional()
    .nullable(),
});

export const SaveDraftSchema = z.object({
  positionId: z.string().optional(),
  modeId: z.string().optional().nullable(),
  minecraftUsername: z
    .string()
    .regex(MinecraftIgnRegex, "Minecraft username must be 3-16 alphanumeric characters.")
    .optional()
    .nullable(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      value: z.string().optional().nullable(),
      selectedOptions: z.array(z.string()).optional().nullable(),
    })
  ),
});

export const SubmitApplicationSchema = z.object({
  confirmAccuracy: z.literal(true, {
    errorMap: () => ({ message: "You must confirm that all information provided is accurate." }),
  }),
});

export const UpdateStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
    "NEEDS_CHANGES",
  ]),
  decisionReason: z.string().max(2000).optional().nullable(),
  acceptanceMessage: z.string().max(2000).optional().nullable(),
  rejectionReason: z.string().max(2000).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export const AddAdminNoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty.").max(2500, "Note is too long."),
});

export const QuestionConfigSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum([
    "SHORT_TEXT",
    "PARAGRAPH",
    "MULTIPLE_CHOICE",
    "MULTIPLE_SELECT",
    "NUMBER",
    "URL",
    "FILE",
    "IMAGE",
    "VIDEO",
    "MINECRAFT_USERNAME",
    "DISCORD_USERNAME",
  ]),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
  enabled: z.boolean().default(true),
  minLength: z.number().int().min(0).optional().nullable(),
  maxLength: z.number().int().min(1).optional().nullable(),
  minSelections: z.number().int().min(0).optional().nullable(),
  maxSelections: z.number().int().min(1).optional().nullable(),
  minNumber: z.number().optional().nullable(),
  maxNumber: z.number().optional().nullable(),
  options: z.array(z.string()).optional().nullable(),
  allowedFileTypes: z.array(z.string()).optional().nullable(),
  maxFiles: z.number().int().min(1).max(10).optional().nullable(),
  maxFileSizeMb: z.number().int().min(1).max(500).optional().nullable(),
  positionId: z.string().optional().nullable(),
  modeId: z.string().optional().nullable(),
});
