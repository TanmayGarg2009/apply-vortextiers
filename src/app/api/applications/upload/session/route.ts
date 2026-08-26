import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkApplicationAccess } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { createDriveResumableUploadSession, categorizeMimeType } from "@/lib/drive/google-drive";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { applicationId, filename, mimeType, sizeBytes, questionId } = body;

    if (!applicationId || !filename || !mimeType || !sizeBytes) {
      return NextResponse.json({ error: "Missing required upload parameters." }, { status: 400 });
    }

    // 1. Verify application ownership
    const { application, isOwner } = await checkApplicationAccess(applicationId, user);
    if (!isOwner) {
      return NextResponse.json({ error: "Only the applicant can upload evidence." }, { status: 403 });
    }

    if (application.status !== "DRAFT" && application.status !== "NEEDS_CHANGES") {
      return NextResponse.json(
        { error: `Cannot upload files to an application with status ${application.status}.` },
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        { error: `File type "${mimeType}" is not permitted. Allowed types: PNG, JPEG, WEBP, MP4, WebM, MOV, PDF.` },
        { status: 400 }
      );
    }

    // 3. Validate size limit (max 150MB by default or from settings)
    const settings = await dbService.getSettings();
    const maxSizeBytes = (Number(settings.max_upload_size_mb) || 150) * 1024 * 1024;

    if (sizeBytes > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size exceeds the maximum allowed limit of ${settings.max_upload_size_mb || 150}MB.` },
        { status: 400 }
      );
    }

    // 4. Initiate Google Drive Resumable Session
    const session = await createDriveResumableUploadSession({
      applicationId,
      discordUsername: user.discordUsername,
      filename,
      mimeType,
      sizeBytes,
      questionId,
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Upload session initiation error:", error);
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to initiate upload session." }, { status });
  }
}
