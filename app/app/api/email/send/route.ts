import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/services/emailService";
import { sendBulkEmails } from "@/lib/services/bulkEmailService";
import type { BulkSendRecipient, EmailAttachment } from "@/app/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  // ── Bulk send path ──────────────────────────────────────────────────────────
  if (Array.isArray(raw.recipients)) {
    if (raw.recipients.length === 0) {
      return NextResponse.json(
        { error: "recipients must be a non-empty array" },
        { status: 400 },
      );
    }

    if (raw.recipients.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 recipients per request" },
        { status: 400 },
      );
    }

    if (typeof raw.subject !== "string" || (raw.subject as string).trim() === "") {
      return NextResponse.json(
        { error: "subject must be a non-empty string" },
        { status: 400 },
      );
    }
    if ((raw.subject as string).length > 200) {
      return NextResponse.json(
        { error: "subject must be 200 characters or fewer" },
        { status: 400 },
      );
    }

    if (typeof raw.body !== "string" || (raw.body as string).trim() === "") {
      return NextResponse.json(
        { error: "body must be a non-empty string" },
        { status: 400 },
      );
    }
    if ((raw.body as string).length > 5000) {
      return NextResponse.json(
        { error: "body must be 5000 characters or fewer" },
        { status: 400 },
      );
    }

    for (const item of raw.recipients as unknown[]) {
      const r = item as Record<string, unknown>;
      const municipalityOk =
        r.municipality === null || typeof r.municipality === "string";
      if (
        typeof item !== "object" || item === null ||
        typeof r.companyId !== "string" ||
        typeof r.name !== "string" ||
        typeof r.category !== "string" ||
        typeof r.email !== "string" ||
        !municipalityOk
      ) {
        return NextResponse.json(
          { error: "Each recipient must have companyId, name, category, email, and municipality (string or null)" },
          { status: 400 },
        );
      }
      if (!EMAIL_PATTERN.test(r.email as string)) {
        return NextResponse.json(
          { error: `Invalid email address: ${r.email as string}` },
          { status: 400 },
        );
      }
    }

    const recipients = raw.recipients as BulkSendRecipient[];

    let attachments: EmailAttachment[] | undefined;
    if (raw.attachments !== undefined) {
      if (!Array.isArray(raw.attachments)) {
        return NextResponse.json(
          { error: "attachments must be an array" },
          { status: 400 },
        );
      }
      if (raw.attachments.length > 1) {
        return NextResponse.json(
          { error: "Maximum 1 attachment per request" },
          { status: 400 },
        );
      }
      for (const item of raw.attachments as unknown[]) {
        const a = item as Record<string, unknown>;
        if (
          typeof item !== "object" || item === null ||
          typeof a.filename !== "string" || a.filename.trim() === "" ||
          typeof a.content !== "string" || a.content.trim() === ""
        ) {
          return NextResponse.json(
            { error: "Each attachment must have a non-empty filename and content" },
            { status: 400 },
          );
        }
        if ((a.content as string).length > 7_000_000) {
          return NextResponse.json(
            { error: `Attachment "${a.filename as string}" exceeds the 7,000,000 character limit` },
            { status: 400 },
          );
        }
        const safeFilename = (a.filename as string)
          .replace(/[^\w\s.\-]/g, "")
          .replace(/\s+/g, "_")
          .slice(0, 255);
        (a as Record<string, unknown>).filename = safeFilename;
        const header = Buffer.from((a.content as string).slice(0, 20), "base64").slice(0, 5).toString("ascii");
        if (header !== "%PDF-") {
          return NextResponse.json(
            { error: `Attachment "${a.filename as string}" must be a valid PDF file` },
            { status: 400 },
          );
        }
      }
      attachments = raw.attachments as EmailAttachment[];
    }

    // Server-side attachment fallback — use stored PDF when caller provided none
    if (attachments === undefined) {
      const stored = await prisma.userSettings.findFirst({
        select: { attachmentData: true, attachmentFilename: true },
      });
      if (stored?.attachmentData != null && stored.attachmentFilename != null) {
        attachments = [{
          filename: stored.attachmentFilename,
          content: stored.attachmentData.toString("base64"),
        }];
      }
    }

    const settings = await prisma.userSettings.findFirst({
      select: { senderName: true, senderEmail: true },
    });
    const from = settings !== null
      ? `"${settings.senderName.replace(/"/g, '\\"')}" <${settings.senderEmail}>`
      : (process.env.RESEND_FROM_ADDRESS ?? "noreply@oportuno.pt");

    try {
      const results = await sendBulkEmails(
        (raw.subject as string).trim(),
        (raw.body as string).trim(),
        recipients,
        from,
        attachments,
      );
      return NextResponse.json({ results }, { status: 200 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
  // ── End bulk send path ──────────────────────────────────────────────────────

  const { companyId, to, subject, body: emailBody } = raw;

  if (typeof companyId !== "string" || companyId.trim() === "") {
    return NextResponse.json(
      { error: "companyId must be a non-empty string" },
      { status: 400 },
    );
  }

  if (
    typeof to !== "string" ||
    to.trim() === "" ||
    !EMAIL_PATTERN.test(to)
  ) {
    return NextResponse.json(
      { error: "to must be a valid email address" },
      { status: 400 },
    );
  }

  if (typeof subject !== "string" || subject.trim() === "") {
    return NextResponse.json(
      { error: "subject must be a non-empty string" },
      { status: 400 },
    );
  }

  if (typeof emailBody !== "string" || emailBody.trim() === "") {
    return NextResponse.json(
      { error: "body must be a non-empty string" },
      { status: 400 },
    );
  }

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (company === null) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Server-side attachment fallback — use stored PDF when caller provided none
  let attachments: EmailAttachment[] | undefined = undefined;
  {
    const stored = await prisma.userSettings.findFirst({
      select: { attachmentData: true, attachmentFilename: true },
    });
    if (stored?.attachmentData != null && stored.attachmentFilename != null) {
      attachments = [{
        filename: stored.attachmentFilename,
        content: stored.attachmentData.toString("base64"),
      }];
    }
  }

  try {
    const singleSettings = await prisma.userSettings.findFirst({
      select: { senderName: true, senderEmail: true },
    });
    const singleFrom = singleSettings !== null
      ? `"${singleSettings.senderName.replace(/"/g, '\\"')}" <${singleSettings.senderEmail}>`
      : (process.env.RESEND_FROM_ADDRESS ?? "noreply@oportuno.pt");
    const result = await sendEmail({ companyId, to, subject, body: emailBody, from: singleFrom, attachments });
    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
