import { sendEmail } from "@/lib/services/emailService";
import type { BulkSendRecipient, BulkSendResult, EmailAttachment } from "@/app/types";

const OPT_OUT_LINE =
  "\n\nSe não desejar voltar a ser contactado, responda a este email.";

export function resolvePlaceholders(
  template: string,
  recipient: BulkSendRecipient,
): string {
  return template
    .replace(/\{\{empresa\}\}/gi,   recipient.name)
    .replace(/\{\{municipio\}\}/gi, recipient.municipality ?? "")
    .replace(/\{\{setor\}\}/gi,     recipient.category);
}

export async function sendBulkEmails(
  subjectTemplate: string,
  bodyTemplate: string,
  recipients: BulkSendRecipient[],
  from: string,
  attachments?: EmailAttachment[],
): Promise<BulkSendResult[]> {
  const results: BulkSendResult[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]!;
    const subject = resolvePlaceholders(subjectTemplate, recipient);
    const body    = resolvePlaceholders(bodyTemplate, recipient) + OPT_OUT_LINE;

    try {
      const result = await sendEmail({
        companyId:   recipient.companyId,
        to:          recipient.email,
        subject,
        body,
        from,
        attachments,
      });

      results.push({
        companyId:  recipient.companyId,
        name:       recipient.name,
        email:      recipient.email,
        success:    result.success,
        emailLogId: result.emailLogId,
        ...(result.error !== undefined ? { error: result.error } : {}),
      });
    } catch (err) {
      results.push({
        companyId: recipient.companyId,
        name:      recipient.name,
        email:     recipient.email,
        success:   false,
        error:     err instanceof Error ? err.message : "Erro desconhecido",
      });
    }

    if (i < recipients.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}
