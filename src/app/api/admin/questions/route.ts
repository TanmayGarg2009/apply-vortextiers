import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireReviewer } from "@/lib/auth/rbac";
import dbService from "@/lib/db/store";
import { QuestionConfigSchema } from "@/lib/validation/application";
import { logAudit } from "@/lib/audit/audit-logger";

export async function GET(req: NextRequest) {
  try {
    await requireReviewer();
    const url = new URL(req.url);
    const positionId = url.searchParams.get("positionId") || undefined;
    const modeId = url.searchParams.get("modeId") || undefined;

    const questions = await dbService.getQuestions({ positionId, modeId });
    return NextResponse.json({ questions });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch questions." }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const validated = QuestionConfigSchema.parse(body);

    const question = await dbService.createQuestion(validated as any);

    await logAudit({
      actorId: admin.id,
      action: "QUESTION_CREATED",
      targetType: "Question",
      targetId: question.id,
      metadata: { title: question.title, type: question.type },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error: any) {
    const status = error.name === "ZodError" ? 400 : error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message || "Failed to create question." },
      { status }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing question ID." }, { status: 400 });
    }

    const updated = await dbService.updateQuestion(id, data);

    await logAudit({
      actorId: admin.id,
      action: "QUESTION_UPDATED",
      targetType: "Question",
      targetId: id,
      metadata: { title: updated.title, version: updated.version },
    });

    return NextResponse.json({ question: updated });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to update question." }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing question ID." }, { status: 400 });
    }

    await dbService.deleteQuestion(id);

    await logAudit({
      actorId: admin.id,
      action: "QUESTION_DELETED",
      targetType: "Question",
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.name === "UnauthorizedError" ? 401 : error.name === "ForbiddenError" ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete question." }, { status });
  }
}
