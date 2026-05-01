import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/categories";

export async function classifyCategory(industry: string): Promise<string> {
  if (process.env.USE_MOCK_AI === "true") {
    return "Outros";
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[categoryService] ANTHROPIC_API_KEY not set — returning Outros");
    return "Outros";
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `Classify the following business industry into exactly one of these categories:\n${CATEGORIES.join("\n")}\n\nIndustry: "${industry}"\n\nRespond with only the category name, nothing else.`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") return "Outros";

    const result = block.text.trim();
    return CATEGORIES.includes(result) ? result : "Outros";
  } catch (err) {
    console.error("[categoryService] classification failed:", err);
    return "Outros";
  }
}
