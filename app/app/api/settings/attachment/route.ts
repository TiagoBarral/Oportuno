import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const PDF_MAGIC = "%PDF-";

export async function PATCH(request: Request): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field is required and must be a file" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "O ficheiro não pode exceder 5 MB" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();

  // Validate PDF magic bytes: first 5 bytes must decode to "%PDF-"
  const header = Buffer.from(arrayBuffer.slice(0, 5)).toString("ascii");
  if (header !== PDF_MAGIC) {
    return NextResponse.json({ error: "O ficheiro deve ser um PDF válido" }, { status: 400 });
  }

  const buffer = Buffer.from(arrayBuffer);

  try {
    const existing = await prisma.userSettings.findFirst({
      select: { id: true },
    });
    if (existing === null) {
      return NextResponse.json(
        { error: "Configure o nome e email do remetente em Definições antes de guardar um anexo." },
        { status: 400 },
      );
    }
    await prisma.userSettings.update({
      where: { id: SINGLETON_ID },
      data: { attachmentData: buffer, attachmentFilename: file.name },
      select: { attachmentFilename: true },
    });
    return NextResponse.json({ attachmentFilename: file.name }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    await prisma.userSettings.updateMany({
      data: { attachmentData: null, attachmentFilename: null },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
