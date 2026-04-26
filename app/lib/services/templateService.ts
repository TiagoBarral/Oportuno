export type OpportunityType = "NO_WEBSITE" | "WEAK_WEBSITE";

export interface EmailTemplate {
  id: string;
  name: string;
  opportunityType: OpportunityType;
  subject: string;
  body: string; // contains {{companyName}}, {{industry}}, {{opportunity}} placeholders
}

export interface TemplateVariables {
  companyName: string;
  industry: string;
  opportunity: string; // human-readable PT-PT string, not the enum key
}

export interface ResolvedTemplate {
  subject: string;
  body: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-no-website-001",
    name: "Sem Presença Online",
    opportunityType: "NO_WEBSITE",
    subject: "Presença Online para {{companyName}}",
    body: `Exmo(a) Sr(a),

Ao pesquisar empresas de {{industry}} na sua área, reparei que a {{companyName}} ainda não tem presença online. Hoje em dia, a maioria dos clientes procura serviços no Google antes de tomar qualquer decisão — sem um website, a sua empresa fica invisível para esses potenciais clientes.

A {{opportunity}} representa uma oportunidade concreta de atrair mais negócio. Posso criar um website profissional, rápido e adaptado à realidade da {{companyName}}, por um valor acessível.

Estaria disponível para uma conversa breve sem compromisso?

Com os melhores cumprimentos,
Oportuno

Se não pretende receber mais emails, basta responder com 'remover'.`,
  },
  {
    id: "tpl-weak-website-001",
    name: "Site com Potencial de Melhoria",
    opportunityType: "WEAK_WEBSITE",
    subject: "Melhorar o Site da {{companyName}}",
    body: `Exmo(a) Sr(a),

Vi o website da {{companyName}} e reconheço o trabalho que já existe. No entanto, acredito que o site poderia apresentar melhor os vossos serviços de {{industry}} e, assim, converter mais visitantes em clientes.

A {{opportunity}} é precisamente a área onde podemos fazer a diferença: uma estrutura mais clara, conteúdo mais persuasivo e uma experiência de utilizador mais fluida.

Com algumas melhorias direcionadas, o website pode tornar-se o melhor comercial da {{companyName}} — disponível 24 horas por dia.

Posso partilhar algumas sugestões concretas, sem qualquer compromisso?

Com os melhores cumprimentos,
Oportuno

Se não pretende receber mais emails, basta responder com 'remover'.`,
  },
  {
    id: "tpl-weak-website-002",
    name: "Visibilidade no Google",
    opportunityType: "WEAK_WEBSITE",
    subject: "{{companyName}} — Mais Visibilidade no Google",
    body: `Exmo(a) Sr(a),

A {{companyName}} tem um website, mas quando alguém pesquisa no Google por serviços de {{industry}} na vossa zona, a empresa aparece nos resultados?

A {{opportunity}} mostra que há margem para melhorar significativamente a visibilidade orgânica. Com as otimizações de SEO certas, é possível aparecer nas primeiras posições quando os clientes certos estão à procura exatamente do que a {{companyName}} oferece.

Mais visibilidade significa mais contactos e mais negócio — sem depender de publicidade paga.

Gostaria de lhe mostrar onde estão as principais oportunidades de melhoria?

Com os melhores cumprimentos,
Oportuno

Se não pretende receber mais emails, basta responder com 'remover'.`,
  },
];

export function getTemplateById(id: string): EmailTemplate | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

export function getDefaultTemplateForOpportunity(
  type: OpportunityType
): EmailTemplate {
  const template = TEMPLATES.find((t) => t.opportunityType === type);
  if (!template) {
    throw new Error(`No template found for opportunity type: ${type}`);
  }
  return template;
}

export function listTemplates(): EmailTemplate[] {
  return [...TEMPLATES];
}

export function applyTemplate(
  template: EmailTemplate,
  variables: TemplateVariables
): ResolvedTemplate {
  const replace = (text: string): string =>
    text
      .replace(/\{\{companyName\}\}/g, variables.companyName)
      .replace(/\{\{industry\}\}/g, variables.industry)
      .replace(/\{\{opportunity\}\}/g, variables.opportunity);

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}
