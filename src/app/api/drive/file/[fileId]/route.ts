import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { getDriveClient } from "@/lib/drive/google-drive";
import prisma from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const user = await requireAuth();
    const { fileId } = params;

    // Find the upload record to verify ownership
    const upload = await prisma.upload.findFirst({
      where: { googleDriveFileId: fileId },
      include: { application: true },
    }).catch(() => null);

    if (upload) {
      const isOwner = upload.application.userId === user.id;
      const isStaff = user.role === "REVIEWER" || user.role === "ADMIN";

      if (!isOwner && !isStaff) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }
    } else if (user.role === "APPLICANT") {
      return NextResponse.json({ error: "File not found or access denied." }, { status: 403 });
    }

    const drive = getDriveClient();
    if (!drive) {
      // Mock response for dev/testing
      return new NextResponse("Mock file content", {
        headers: {
          "Content-Type": upload?.mimeType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${upload?.filename || "file"}"`,
        },
      });
    }

    // Fetch stream from Google Drive
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    const stream = response.data as any;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": upload?.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${upload?.filename || "file"}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Drive streaming proxy error:", error);
    return NextResponse.json({ error: "Failed to stream file." }, { status: 500 });
  }
}
