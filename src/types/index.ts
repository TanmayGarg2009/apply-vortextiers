export const Role = {
  APPLICANT: "APPLICANT",
  REVIEWER: "REVIEWER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ApplicationStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
  NEEDS_CHANGES: "NEEDS_CHANGES",
} as const;

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export type QuestionType =
  | "SHORT_TEXT"
  | "PARAGRAPH"
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_SELECT"
  | "NUMBER"
  | "URL"
  | "FILE"
  | "IMAGE"
  | "VIDEO"
  | "MINECRAFT_USERNAME"
  | "DISCORD_USERNAME";

export type UploadCategory = "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER";

export type EmailType =
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_ACCEPTED"
  | "APPLICATION_REJECTED";

export type EmailStatus = "PENDING" | "SENT" | "FAILED";

export interface SessionUser {
  id: string;
  discordId: string;
  discordUsername: string;
  discordGlobalName?: string | null;
  discordAvatar?: string | null;
  email: string;
  role: Role;
}

export interface GameModeData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  enabled: boolean;
  order: number;
}

export interface StaffPositionData {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  order: number;
  requiredEvidence: boolean;
}

export interface QuestionData {
  id: string;
  positionId?: string | null;
  modeId?: string | null;
  title: string;
  description?: string | null;
  type: QuestionType;
  required: boolean;
  order: number;
  enabled: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  minSelections?: number | null;
  maxSelections?: number | null;
  minNumber?: number | null;
  maxNumber?: number | null;
  options?: string[] | null;
  allowedFileTypes?: string[] | null;
  maxFiles?: number | null;
  maxFileSizeMb?: number | null;
  version: number;
}

export interface AnswerData {
  id?: string;
  applicationId: string;
  questionId: string;
  question?: QuestionData | null;
  questionSnapshot?: QuestionData | null;
  value?: string | null;
  selectedOptions?: string[] | null;
}

export interface UploadData {
  id: string;
  applicationId: string;
  questionId?: string | null;
  filename: string;
  safeFilename: string;
  mimeType: string;
  sizeBytes: number;
  googleDriveFileId: string;
  googleDriveViewLink?: string | null;
  googleDriveDownloadLink?: string | null;
  category: UploadCategory;
  createdAt: string | Date;
}

export interface AdminNoteData {
  id: string;
  applicationId: string;
  authorId: string;
  author: {
    discordUsername: string;
    discordGlobalName?: string | null;
    discordAvatar?: string | null;
  };
  content: string;
  createdAt: string | Date;
}

export interface StatusHistoryData {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedById?: string | null;
  changedBy?: {
    discordUsername: string;
    discordGlobalName?: string | null;
  } | null;
  note?: string | null;
  metadata?: any;
  createdAt: string | Date;
}

export interface EmailEventData {
  id: string;
  applicationId: string;
  recipient: string;
  type: EmailType;
  status: EmailStatus;
  provider: string;
  providerMessageId?: string | null;
  attempts: number;
  sentAt?: string | Date | null;
  failedAt?: string | Date | null;
  error?: string | null;
  createdAt: string | Date;
}

export interface ApplicationData {
  id: string;
  userId: string;
  user?: SessionUser;
  discordId: string;
  email: string;
  minecraftUsername?: string | null;
  positionId: string;
  position?: StaffPositionData;
  modeId?: string | null;
  mode?: GameModeData | null;
  status: ApplicationStatus;
  version: number;
  submittedAt?: string | Date | null;
  reviewedAt?: string | Date | null;
  reviewedById?: string | null;
  reviewedBy?: SessionUser | null;
  decisionReason?: string | null;
  acceptanceMessage?: string | null;
  rejectionReason?: string | null;
  googleDriveFolderId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  answers?: AnswerData[];
  uploads?: UploadData[];
  adminNotes?: AdminNoteData[];
  statusHistory?: StatusHistoryData[];
  emailEvents?: EmailEventData[];
}
