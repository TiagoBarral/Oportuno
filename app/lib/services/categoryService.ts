import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/categories";

export interface CategoryResult {
  category: string;
  companySize: string;
}

const VALID_SIZES = new Set(["Pequena", "Média", "Grande"]);

export async function classifyCategory(
  industry: string,
  htmlExcerpt?: string
): Promise<CategoryResult> {
  if (process.env.USE_MOCK_AI === "true") {
    return { category: "Outros", companySize: "Desconhecida" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[categoryService] ANTHROPIC_API_KEY not set — returning defaults");
    return { category: "Outros", companySize: "Desconhecida" };
  }

  const client = new Anthropic({ apiKey });

  const sizeContext = htmlExcerpt
    ? `\n\nWebsite excerpt (first 3000 chars):\n${htmlExcerpt.slice(0, 3000)}`
    : "";

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: `Classify this business into exactly one category and one size.

Categories:
${CATEGORIES.join("\n")}

Sizes:
Pequena — local/independent business, 1–49 employees
Média — regional/national business, 50–249 employees
Grande — large national or multinational, 250+ employees

Industry: "${industry}"${sizeContext}

Respond in exactly this format, nothing else:
Categoria: <category>
Dimensão: <size>`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") return { category: "Outros", companySize: "Desconhecida" };

    const text = block.text.trim();
    const categoryMatch = text.match(/^Categoria:\s*(.+)$/m);
    const sizeMatch = text.match(/^Dimensão:\s*(.+)$/m);

    const category = categoryMatch?.[1]?.trim() ?? "Outros";
    const rawSize = sizeMatch?.[1]?.trim() ?? "";

    return {
      category: CATEGORIES.includes(category) ? category : "Outros",
      companySize: VALID_SIZES.has(rawSize) ? rawSize : "Desconhecida",
    };
  } catch (err) {
    console.error("[categoryService] classification failed:", err);
    return { category: "Outros", companySize: "Desconhecida" };
  }
}
