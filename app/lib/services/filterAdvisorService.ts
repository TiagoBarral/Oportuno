import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/categories";
import { SPECIALTIES } from "@/lib/specialties";
import type { FilterSuggestion } from "@/app/types";

const VALID_SIZES = new Set(["Pequena", "Média", "Grande"]);

const ALL_SPECIALTIES: Set<string> = new Set(
  Object.values(SPECIALTIES).flat()
);

const FALLBACK: FilterSuggestion[] = [
  {
    label: "Empresas em geral",
    explanation: "Explore todas as empresas na base de dados.",
    filters: { categories: [], specialties: [], companySizes: [] },
  },
];

function parseBlock(block: string): FilterSuggestion | null {
  const titleMatch = block.match(/^Título:\s*(.+)$/m);
  const explanationMatch = block.match(/^Explicação:\s*(.+)$/m);
  const categoriesMatch = block.match(/^Categorias:\s*(.*)$/m);
  const specialtiesMatch = block.match(/^Especialidades:\s*(.*)$/m);
  const sizesMatch = block.match(/^Dimensões:\s*(.*)$/m);

  const label = titleMatch?.[1]?.trim();
  const explanation = explanationMatch?.[1]?.trim();

  if (!label || !explanation) return null;

  const parseList = (raw: string | undefined): string[] => {
    if (!raw?.trim()) return [];
    return raw.split(",").map((v) => v.trim()).filter(Boolean);
  };

  const categories = parseList(categoriesMatch?.[1]).filter((c) =>
    CATEGORIES.includes(c)
  );
  const specialties = parseList(specialtiesMatch?.[1]).filter((s) =>
    ALL_SPECIALTIES.has(s)
  );
  const companySizes = parseList(sizesMatch?.[1]).filter((s) =>
    VALID_SIZES.has(s)
  );

  // A size-only suggestion is not useful as a standalone filter — require at least one category or specialty
  if (categories.length === 0 && specialties.length === 0) return null;

  return { label, explanation, filters: { categories, specialties, companySizes } };
}

export async function suggestFilters(situation: string): Promise<FilterSuggestion[]> {
  if (process.env.USE_MOCK_AI === "true") {
    return [
      {
        label: "Pequenos negócios locais",
        explanation: "Restaurantes, cafés e comércio local de pequena dimensão.",
        filters: {
          categories: ["Restauração", "Retalho Alimentar"],
          specialties: ["Restaurante", "Café / Pastelaria"],
          companySizes: ["Pequena"],
        },
      },
      {
        label: "Serviços de saúde",
        explanation: "Clínicas e consultórios médicos.",
        filters: {
          categories: ["Saúde"],
          specialties: [],
          companySizes: [],
        },
      },
    ];
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[filterAdvisorService] ANTHROPIC_API_KEY not set — returning fallback");
    return FALLBACK;
  }

  const client = new Anthropic({ apiKey });

  const categoriesList = CATEGORIES.join(", ");
  const specialtiesList = Object.values(SPECIALTIES).flat().join(", ");
  const sizesList = [...VALID_SIZES].join(", ");

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Analisa a seguinte descrição de negócio e sugere 2 a 4 filtros de pesquisa úteis para encontrar empresas-alvo. Responde em PT-PT.

Descrição do negócio: "${situation}"

Categorias válidas: ${categoriesList}
Especialidades válidas: ${specialtiesList}
Dimensões válidas: ${sizesList}

Para cada sugestão, usa exatamente este formato e separa cada uma com ---:
Título: <título curto em PT-PT>
Explicação: <1-2 frases em PT-PT>
Categorias: <cat1, cat2> (usa apenas valores da lista, ou deixa em branco)
Especialidades: <esp1, esp2> (usa apenas valores da lista, ou deixa em branco)
Dimensões: <Pequena, Média, Grande> (subconjunto separado por vírgulas, ou deixa em branco para todas)
---`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") return FALLBACK;

    const suggestions = block.text
      .split("---")
      .map((raw) => raw.trim())
      .filter(Boolean)
      .map(parseBlock)
      .filter((s): s is FilterSuggestion => s !== null)
      .slice(0, 4);

    return suggestions.length > 0 ? suggestions : FALLBACK;
  } catch (err) {
    console.error("[filterAdvisorService] suggestFilters failed:", err);
    return FALLBACK;
  }
}
