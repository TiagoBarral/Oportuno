import Anthropic from "@anthropic-ai/sdk";
import type { BulkEmailTemplateBrief, GeneratedEmail, AIContextFile } from "@/app/types";

const TOM_LABELS: Record<BulkEmailTemplateBrief["tom"], string> = {
  profissional: "Profissional e formal",
  amigavel:     "Amigável e acessível",
  direto:       "Direto e conciso",
};

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `És um especialista em marketing B2B em Portugal. Escreves emails de prospeção em português europeu (PT-PT) — nunca em português do Brasil.

Regras obrigatórias:
- Usa linguagem formal mas acessível
- Máximo 120 palavras no corpo do email
- O assunto deve ser curto e direto (máximo 10 palavras)
- Usa os seguintes marcadores de personalização onde for natural: {{empresa}}, {{municipio}}, {{setor}}
- Usa {{municipio}} APENAS quando encaixar naturalmente na frase. Nunca forces referências geográficas artificiais
- NÃO incluas linha de desativação — será adicionada automaticamente
- Responde APENAS em JSON com a estrutura: {"subject": "...", "body": "..."}`;

// ---------------------------------------------------------------------------
// Mock — deterministic, used when USE_MOCK_AI=true
// ---------------------------------------------------------------------------

function generateMockTemplate(): GeneratedEmail {
  return {
    subject: "Proposta para {{empresa}}",
    body: `Exmo(a) Sr(a),

O meu nome é Pedro Santos e gostaria de apresentar os nossos serviços à {{empresa}}.

Trabalhamos com empresas do setor de {{setor}} em {{municipio}} e acreditamos que podemos acrescentar valor ao seu negócio.

Estaria disponível para uma breve conversa esta semana?

Cumprimentos,
Pedro Santos`,
  };
}

// ---------------------------------------------------------------------------
// Anthropic implementation
// ---------------------------------------------------------------------------

async function generateTemplateWithAnthropic(
  input: BulkEmailTemplateBrief,
  context?: AIContextFile,
): Promise<GeneratedEmail> {
  const client = new Anthropic();

  const tomLabel = TOM_LABELS[input.tom];

  // Free-text fields are wrapped in XML delimiters to reduce prompt injection risk.
  let userMessage = `Cria um template de email de prospeção com base neste briefing:

- O que ofereço: <oferta>${input.oferta}</oferta>
- Tom pretendido: ${tomLabel}`;

  if (input.instrucoesAdicionais && input.instrucoesAdicionais.trim() !== "") {
    userMessage += `\n\nPreferência adicional do utilizador: <instrucoes>${input.instrucoesAdicionais.trim()}</instrucoes>`;
  }

  if (context?.type === "txt") {
    const safeContent = context.content.replace(/<\/documento>/gi, "").replace(/<\/instrucoes>/gi, "");
    userMessage += `\n\nDocumento de contexto fornecido pelo utilizador (usa este conteúdo para enriquecer o email):\n<documento>${safeContent}</documento>`;
  }

  // Build message content — PDF context uses Anthropic's native document block
  type MessageContent =
    | { type: "text"; text: string }
    | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

  const messageContent: MessageContent[] = [{ type: "text", text: userMessage }];

  if (context?.type === "pdf") {
    messageContent.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: context.content },
    });
  }

  const response = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: "user", content: messageContent as Parameters<typeof client.messages.create>[0]["messages"][0]["content"] }],
  });

  if (response.content.length === 0 || response.content[0].type !== "text") {
    throw new Error("Resposta inesperada do modelo");
  }

  const rawText = response.content[0].text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inesperada do modelo");
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("Resposta inesperada do modelo");
    }
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).subject !== "string" ||
    typeof (parsed as Record<string, unknown>).body !== "string" ||
    ((parsed as Record<string, unknown>).subject as string).trim() === "" ||
    ((parsed as Record<string, unknown>).body as string).trim() === ""
  ) {
    throw new Error("Resposta inesperada do modelo");
  }

  return {
    subject: (parsed as Record<string, string>).subject,
    body:    (parsed as Record<string, string>).body,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function generateTemplate(
  input: BulkEmailTemplateBrief,
  context?: AIContextFile,
): Promise<GeneratedEmail> {
  if (process.env.USE_MOCK_AI === "true") {
    return generateMockTemplate();
  }
  return generateTemplateWithAnthropic(input, context);
}
