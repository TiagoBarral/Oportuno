import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateEmail } from "@/lib/services/emailGenerator";

describe("generateEmail (mock mode)", () => {
  beforeEach(() => {
    process.env.USE_MOCK_AI = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_AI;
  });

  // ── Shape ─────────────────────────────────────────────────────────────────

  it("returns a non-empty subject and body for NO_WEBSITE", async () => {
    const result = await generateEmail({
      companyName: "Padaria Lisboa",
      industry: "padaria",
      opportunityType: "NO_WEBSITE",
    });
    expect(result.subject).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  it("returns a non-empty subject and body for WEAK_WEBSITE", async () => {
    const result = await generateEmail({
      companyName: "Restaurante Porto",
      industry: "restaurante",
      opportunityType: "WEAK_WEBSITE",
    });
    expect(result.subject).toBeTruthy();
    expect(result.body).toBeTruthy();
  });

  // ── Interpolation ─────────────────────────────────────────────────────────

  it("interpolates companyName into subject", async () => {
    const result = await generateEmail({
      companyName: "Florista Coimbra",
      industry: "florista",
      opportunityType: "NO_WEBSITE",
    });
    expect(result.subject).toContain("Florista Coimbra");
  });

  it("interpolates companyName into body", async () => {
    const result = await generateEmail({
      companyName: "Oficina Mecânica",
      industry: "oficina",
      opportunityType: "WEAK_WEBSITE",
    });
    expect(result.body).toContain("Oficina Mecânica");
  });

  it("interpolates industry into body", async () => {
    const result = await generateEmail({
      companyName: "Empresa XYZ",
      industry: "canalização",
      opportunityType: "NO_WEBSITE",
    });
    expect(result.body).toContain("canalização");
  });

  it("leaves no unreplaced placeholders in subject or body", async () => {
    const result = await generateEmail({
      companyName: "Empresa Teste",
      industry: "tecnologia",
      opportunityType: "NO_WEBSITE",
    });
    expect(result.subject).not.toContain("{{");
    expect(result.body).not.toContain("{{");
  });

  // ── Compliance ────────────────────────────────────────────────────────────

  it("includes opt-out instruction in body", async () => {
    const result = await generateEmail({
      companyName: "Empresa XYZ",
      industry: "pintura",
      opportunityType: "NO_WEBSITE",
    });
    expect(result.body).toContain("remover");
  });

  // ── Differentiation ───────────────────────────────────────────────────────

  it("produces different subjects for NO_WEBSITE vs WEAK_WEBSITE", async () => {
    const noWebsite = await generateEmail({
      companyName: "Empresa",
      industry: "setor",
      opportunityType: "NO_WEBSITE",
    });
    const weakWebsite = await generateEmail({
      companyName: "Empresa",
      industry: "setor",
      opportunityType: "WEAK_WEBSITE",
    });
    expect(noWebsite.subject).not.toBe(weakWebsite.subject);
  });

  it("produces different bodies for NO_WEBSITE vs WEAK_WEBSITE", async () => {
    const noWebsite = await generateEmail({
      companyName: "Empresa",
      industry: "setor",
      opportunityType: "NO_WEBSITE",
    });
    const weakWebsite = await generateEmail({
      companyName: "Empresa",
      industry: "setor",
      opportunityType: "WEAK_WEBSITE",
    });
    expect(noWebsite.body).not.toBe(weakWebsite.body);
  });
});
