import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { EmailStatus } from "@prisma/client";

export interface SendEmailInput {
  companyId: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  success: boolean;
  emailLogId: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const resend = new Resend(apiKey);

  let resendError: { message: string } | null = null;
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_ADDRESS || "noreply@leadbridge.pt",
      to: [input.to],
      subject: input.subject,
      text: input.body,
    });
    if (error) resendError = { message: error.message };
  } catch (err) {
    resendError = { message: err instanceof Error ? err.message : "Unknown send error" };
  }

  // Always write the log regardless of Resend outcome.
  // If this throws, let it propagate — the route handler returns 500.
  const log = await prisma.emailLog.create({
    data: {
      companyId: input.companyId,
      email: input.to,
      subject: input.subject,
      body: input.body,
      status: resendError === null ? EmailStatus.SENT : EmailStatus.FAILED,
    },
  });

  return {
    success: resendError === null,
    emailLogId: log.id,
    ...(resendError !== null ? { error: resendError.message } : {}),
  };
}
