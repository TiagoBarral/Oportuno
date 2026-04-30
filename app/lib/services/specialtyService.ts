import Anthropic from "@anthropic-ai/sdk";
import { SPECIALTIES } from "@/lib/specialties";

export async function classifySpecialty(
  industry: string,
  category: string,
): Promise<string> {
  const options = SPECIALTIES[category];

  if (!options || options.length === 0) {
    return "Outros";
  }

  if (process.env.USE_MOCK_AI === "true") {
    console.log(`[specialtyService] mock → ${category} / "${industry}" → Outros`);
    return "Outros";
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[specialtyService] ANTHROPIC_API_KEY not set — returning Outros");
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
          content: `Classify this Portuguese business into exactly one specialty.

Category: ${category}
Industry description: "${industry}"

Available specialties — pick ONLY from this list:
${options.join("\n")}

Return ONLY the specialty name, nothing else. If unclear, return "Outros".`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") return "Outros";

    const result = block.text.trim();
    const matched = options.includes(result) ? result : "Outros";

    console.log(`[specialtyService] ${category} / "${industry}" → ${matched}`);
    return matched;
  } catch (err) {
    console.error("[specialtyService] classification failed:", err);
    return "Outros";
  }
}
