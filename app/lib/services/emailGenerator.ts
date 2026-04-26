import Anthropic from "@anthropic-ai/sdk";
import {
  getTemplateById,
  getDefaultTemplateForOpportunity,
  applyTemplate,
} from "@/lib/services/templateService";
import type { GeneratedEmail } from "@/app/types";

export interface GenerateEmailInput {
  companyName: string;
  industry: string;
  opportunityType: "NO_WEBSITE" | "WEAK_WEBSITE";
  templateId?: string;
}

export type { GeneratedEmail };

const OPPORTUNITY_DESCRIPTIONS: Record<
  GenerateEmailInput["opportunityType"],
  string
> = {
  NO_WEBSITE: "não tem presença online / website",
  WEAK_WEBSITE:
    "tem um website mas com conteúdo limitado e fraca visibilidade online",
};

// ---------------------------------------------------------------------------
// Mock generator — used when USE_MOCK_AI=true
// Deterministic, no external calls, safe for local development.
// ---------------------------------------------------------------------------

const MOCK_SUBJECTS: Record<GenerateEmailInput["opportunityType"], string> = {
  NO_WEBSITE: "Presença online para {{companyName}}",
  WEAK_WEBSITE: "Melhore a visibilidade online da {{companyName}}",
};

const MOCK_BODIES: Record<GenerateEmailInput["opportunityType"], string> = {
  NO_WEBSITE: `Exmo(a) Sr(a),

O meu nome é Pedro Santos e trabalho com empresas do setor de {{industry}} em Portugal.

Ao pesquisar negócios locais, reparei que a {{companyName}} ainda não tem presença online. Hoje em dia, a maioria dos clientes procura serviços na internet antes de decidir — não ter um website pode significar perder oportunidades todos os dias.

Podemos criar uma solução simples, profissional e acessível, adaptada à sua atividade.

Estaria disponível para uma conversa de 15 minutos esta semana?

Cumprimentos,
Pedro Santos

Se não pretende receber mais emails, basta responder com 'remover'.`,

  WEAK_WEBSITE: `Exmo(a) Sr(a),

O meu nome é Pedro Santos e trabalho com empresas do setor de {{industry}} em Portugal.

Visitei o website da {{companyName}} e acredito que há margem para melhorar a sua visibilidade online e atrair mais clientes — nomeadamente através de conteúdo mais completo e melhor posicionamento nos motores de busca.

Temos ajudado negócios semelhantes a aumentar o seu tráfego orgânico de forma consistente.

Posso partilhar alguns exemplos concretos, sem compromisso. Teria disponibilidade esta semana?

Cumprimentos,
Pedro Santos

Se não pretende receber mais emails, basta responder com 'remover'.`,
};

function generateMockEmail(input: GenerateEmailInput): GeneratedEmail {
  const { companyName, industry, opportunityType } = input;

  const subject = MOCK_SUBJECTS[opportunityType].replace(
    "{{companyName}}",
    companyName
  );

  const body = MOCK_BODIES[opportunityType]
    .replace(/\{\{companyName\}\}/g, companyName)
    .replace(/\{\{industry\}\}/g, industry);

  return { subject, body };
}

// ---------------------------------------------------------------------------
// Anthropic implementation — used when USE_MOCK_AI is not "true"
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  "És um especialista em marketing B2B em Portugal. Escreves emails de prospeção em português europeu (PT-PT) — nunca em português do Brasil. Usa linguagem formal mas acessível. Evita expressões típicas do português do Brasil. Cada email deve ter: um assunto curto e direto, e um corpo com no máximo 120 palavras. Inclui sempre no final uma linha de desativação como: \"Se não pretende receber mais emails, basta responder com 'remover'.\" Responde APENAS em JSON com a estrutura: {\"subject\": \"...\", \"body\": \"...\"}";

async function generateEmailWithAnthropic(
  input: GenerateEmailInput
): Promise<GeneratedEmail> {
  const { companyName, industry, opportunityType, templateId } = input;

  let template;
  if (templateId !== undefined) {
    template = getTemplateById(templateId);
    if (template === null) {
      throw new Error(`Template not found: ${templateId}`);
    }
  } else {
    template = getDefaultTemplateForOpportunity(opportunityType);
  }

  const opportunityDescription = OPPORTUNITY_DESCRIPTIONS[opportunityType];
  const resolvedTemplate = applyTemplate(template, {
    companyName,
    industry,
    opportunity: opportunityDescription,
  });

  const userMessage = `Escreve um email de prospeção para a seguinte empresa:

- Nome: ${companyName}
- Setor: ${industry}
- Situação: ${opportunityDescription}

Usa este esboço como ponto de partida para o tom e estrutura, mas reformula com as tuas próprias palavras:

${resolvedTemplate.body}`;

  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  if (response.content.length === 0 || response.content[0].type !== "text") {
    throw new Error("Claude returned an unexpected response format");
  }

  const firstBlock = response.content[0];

  let parsed: unknown;
  try {
    parsed = JSON.parse(firstBlock.text);
  } catch {
    throw new Error("Claude returned an unexpected response format");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("subject" in parsed) ||
    !("body" in parsed) ||
    typeof (parsed as Record<string, unknown>).subject !== "string" ||
    typeof (parsed as Record<string, unknown>).body !== "string" ||
    ((parsed as Record<string, unknown>).subject as string).trim() === "" ||
    ((parsed as Record<string, unknown>).body as string).trim() === ""
  ) {
    throw new Error("Claude returned an unexpected response format");
  }

  return {
    subject: (parsed as Record<string, string>).subject,
    body: (parsed as Record<string, string>).body,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function generateEmail(
  input: GenerateEmailInput
): Promise<GeneratedEmail> {
  if (process.env.USE_MOCK_AI === "true") {
    return generateMockEmail(input);
  }
  return generateEmailWithAnthropic(input);
}
