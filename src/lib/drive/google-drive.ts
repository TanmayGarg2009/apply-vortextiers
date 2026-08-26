import { google } from "googleapis";
import crypto from "crypto";
import path from "path";
import prisma from "@/lib/db/prisma";
import { UploadCategory } from "@/types";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || "";
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const GOOGLE_DRIVE_ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "vortex_staff_session_default_secret_key_32_chars_min";

export function getDriveClient() {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Categorize MIME type into IMAGE | VIDEO | DOCUMENT | OTHER
 */
export function categorizeMimeType(mimeType: string): UploadCategory {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text/plain")
  ) {
    return "DOCUMENT";
  }
  return "OTHER";
}

/**
 * Sanitize filename to prevent directory traversal and special character exploits
 */
export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  return `${base}_${randomSuffix}${ext}`;
}

/**
 * Ensure structured application folder exists in Google Drive
 * Structure: Root -> Year -> VT-000124 - Username -> Category
 */
export async function getOrCreateApplicationFolder(
  applicationId: string,
  discordUsername: string,
  category: UploadCategory
): Promise<string | null> {
  const drive = getDriveClient();
  if (!drive || !GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    return "mock_folder_id";
  }

  try {
    const year = new Date().getFullYear().toString();

    // 1. Get or create Year folder
    let yearFolderId = await findFolder(drive, year, GOOGLE_DRIVE_ROOT_FOLDER_ID);
    if (!yearFolderId) {
      yearFolderId = await createFolder(drive, year, GOOGLE_DRIVE_ROOT_FOLDER_ID);
    }

    // 2. Get or create Application folder (VT-000124 - Username)
    const appFolderName = `${applicationId} - ${discordUsername.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    let appFolderId = await findFolder(drive, appFolderName, yearFolderId);
    if (!appFolderId) {
      appFolderId = await createFolder(drive, appFolderName, yearFolderId);
      // Save folder ID to application record
      await prisma.application.update({
        where: { id: applicationId },
        data: { googleDriveFolderId: appFolderId },
      });
    }

    // 3. Get or create Category subfolder (Images / Videos / Documents / Other)
    const categoryName = category.charAt(0) + category.slice(1).toLowerCase() + "s";
    let categoryFolderId = await findFolder(drive, categoryName, appFolderId);
    if (!categoryFolderId) {
      categoryFolderId = await createFolder(drive, categoryName, appFolderId);
    }

    return categoryFolderId;
  } catch (error) {
    console.error("Failed to create Google Drive folder structure:", error);
    return null;
  }
}

async function findFolder(drive: any, name: string, parentId: string): Promise<string | null> {
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }
  return null;
}

async function createFolder(drive: any, name: string, parentId: string): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return res.data.id;
}

/**
 * Create a Google Drive Resumable Upload Session URI and encrypt it for client usage
 */
export async function createDriveResumableUploadSession(params: {
  applicationId: string;
  discordUsername: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  questionId?: string | null;
}) {
  const category = categorizeMimeType(params.mimeType);
  const safeFilename = sanitizeFilename(params.filename);
  const drive = getDriveClient();

  if (!drive || !GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    // Mock upload session for dev/testing when Google Drive credentials are placeholder
    const mockToken = Buffer.from(
      JSON.stringify({
        isMock: true,
        applicationId: params.applicationId,
        questionId: params.questionId,
        filename: params.filename,
        safeFilename,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        category,
        exp: Date.now() + 1000 * 60 * 60,
      })
    ).toString("base64url");

    return {
      uploadSessionToken: mockToken,
      safeFilename,
      category,
      chunkSize: 2 * 1024 * 1024, // 2MB
      isMock: true,
    };
  }

  const folderId = await getOrCreateApplicationFolder(
    params.applicationId,
    params.discordUsername,
    category
  );

  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const token = await auth.getAccessToken();

  // Initiate Resumable Upload Session with Google Drive API
  const initRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": params.mimeType,
        "X-Upload-Content-Length": params.sizeBytes.toString(),
      },
      body: JSON.stringify({
        name: safeFilename,
        parents: folderId ? [folderId] : undefined,
      }),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`Failed to initiate Google Drive upload session: ${err}`);
  }

  const resumableUri = initRes.headers.get("location");
  if (!resumableUri) {
    throw new Error("Google Drive did not return a resumable upload location.");
  }

  // Encrypt the session details with HMAC-SHA256 signature
  const sessionData = {
    resumableUri,
    applicationId: params.applicationId,
    questionId: params.questionId,
    filename: params.filename,
    safeFilename,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
    category,
    exp: Date.now() + 1000 * 60 * 60 * 2, // 2 hours
  };

  const payload = Buffer.from(JSON.stringify(sessionData)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const uploadSessionToken = `${payload}.${signature}`;

  return {
    uploadSessionToken,
    safeFilename,
    category,
    chunkSize: 2 * 1024 * 1024, // 2MB chunk recommendation
    isMock: false,
  };
}

/**
 * Decode and verify upload session token
 */
export function verifyUploadSessionToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length === 1) {
      // Check for mock token in test/dev
      const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
      if (data.isMock) return data;
      return null;
    }

    const [payload, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
