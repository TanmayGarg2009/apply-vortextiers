import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { verifyUploadSessionToken } from "@/lib/drive/google-drive";
import prisma from "@/lib/db/prisma";
import dbService from "@/lib/db/store";

export async function PUT(req: NextRequest) {
  try {
    await requireAuth();

    const uploadSessionToken = req.headers.get("x-upload-session-token");
    const contentRange = req.headers.get("content-range"); // e.g. "bytes 0-2097151/10485760"

    if (!uploadSessionToken) {
      return NextResponse.json({ error: "Missing upload session token." }, { status: 400 });
    }

    const sessionData = verifyUploadSessionToken(uploadSessionToken);
    if (!sessionData) {
      return NextResponse.json({ error: "Invalid or expired upload session token." }, { status: 401 });
    }

    // Read chunk buffer from request
    const chunkBuffer = Buffer.from(await req.arrayBuffer());

    // Handle Mock / Dev Mode
    if (sessionData.isMock) {
      const isLastChunk = contentRange
        ? contentRange.includes(`/${sessionData.sizeBytes}`) ||
          parseInt(contentRange.split("-")[1].split("/")[0], 10) + 1 >= sessionData.sizeBytes
        : true;

      if (isLastChunk) {
        const fileId = `mock_drive_file_${Date.now()}`;
        // Persist upload metadata
        const upload = await prisma.upload.create({
          data: {
            applicationId: sessionData.applicationId,
            questionId: sessionData.questionId || null,
            filename: sessionData.filename,
            safeFilename: sessionData.safeFilename,
            mimeType: sessionData.mimeType,
            sizeBytes: sessionData.sizeBytes,
            googleDriveFileId: fileId,
            category: sessionData.category,
          },
        }).catch(() => ({
          id: `up-${Date.now()}`,
          applicationId: sessionData.applicationId,
          questionId: sessionData.questionId || null,
          filename: sessionData.filename,
          safeFilename: sessionData.safeFilename,
          mimeType: sessionData.mimeType,
          sizeBytes: sessionData.sizeBytes,
          googleDriveFileId: fileId,
          category: sessionData.category,
          createdAt: new Date(),
        }));

        return NextResponse.json({
          status: "COMPLETED",
          file: upload,
          message: "Upload completed successfully.",
        });
      }

      return NextResponse.json({ status: "INCOMPLETE", bytesReceived: chunkBuffer.length });
    }

    // Live Google Drive Resumable Forwarding
    const googleRes = await fetch(sessionData.resumableUri, {
      method: "PUT",
      headers: {
        "Content-Range": contentRange || `bytes 0-${chunkBuffer.length - 1}/${sessionData.sizeBytes}`,
        "Content-Type": sessionData.mimeType,
      },
      body: chunkBuffer,
    });

    if (googleRes.status === 308) {
      // Resume Incomplete (chunks still needed)
      const range = googleRes.headers.get("range");
      return NextResponse.json({ status: "INCOMPLETE", range });
    }

    if (googleRes.ok) {
      // Upload Complete!
      const driveFile = await googleRes.json();
      const fileId = driveFile.id;

      // Save upload record in database
      const upload = await prisma.upload.create({
        data: {
          applicationId: sessionData.applicationId,
          questionId: sessionData.questionId || null,
          filename: sessionData.filename,
          safeFilename: sessionData.safeFilename,
          mimeType: sessionData.mimeType,
          sizeBytes: sessionData.sizeBytes,
          googleDriveFileId: fileId,
          category: sessionData.category,
        },
      });

      return NextResponse.json({
        status: "COMPLETED",
        file: upload,
        message: "Upload completed successfully.",
      });
    }

    const errText = await googleRes.text();
    return NextResponse.json(
      { error: `Google Drive chunk upload failed: ${errText}` },
      { status: googleRes.status }
    );
  } catch (error: any) {
    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload chunk." }, { status: 500 });
  }
}
