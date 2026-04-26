import { describe, it, expect } from "vitest";
import {
  getTemplateById,
  getDefaultTemplateForOpportunity,
  listTemplates,
  applyTemplate,
} from "@/lib/services/templateService";

describe("getTemplateById", () => {
  it("returns the template for a known id", () => {
    const t = getTemplateById("tpl-no-website-001");
    expect(t).not.toBeNull();
    expect(t?.id).toBe("tpl-no-website-001");
  });

  it("returns null for an unknown id", () => {
    expect(getTemplateById("does-not-exist")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getTemplateById("")).toBeNull();
  });
});

describe("getDefaultTemplateForOpportunity", () => {
  it("returns a NO_WEBSITE template", () => {
    const t = getDefaultTemplateForOpportunity("NO_WEBSITE");
    expect(t.opportunityType).toBe("NO_WEBSITE");
  });

  it("returns a WEAK_WEBSITE template", () => {
    const t = getDefaultTemplateForOpportunity("WEAK_WEBSITE");
    expect(t.opportunityType).toBe("WEAK_WEBSITE");
  });

  it("returns different templates for different opportunity types", () => {
    const a = getDefaultTemplateForOpportunity("NO_WEBSITE");
    const b = getDefaultTemplateForOpportunity("WEAK_WEBSITE");
    expect(a.id).not.toBe(b.id);
  });
});

describe("listTemplates", () => {
  it("returns at least one template", () => {
    expect(listTemplates().length).toBeGreaterThan(0);
  });

  it("includes templates for both opportunity types", () => {
    const templates = listTemplates();
    const types = templates.map((t) => t.opportunityType);
    expect(types).toContain("NO_WEBSITE");
    expect(types).toContain("WEAK_WEBSITE");
  });

  it("returns a copy — mutations do not affect internal state", () => {
    const first = listTemplates();
    first.pop();
    const second = listTemplates();
    expect(second.length).toBeGreaterThan(first.length);
  });
});

describe("applyTemplate", () => {
  it("replaces {{companyName}} in subject", () => {
    const t = getTemplateById("tpl-no-website-001")!;
    const result = applyTemplate(t, {
      companyName: "Padaria Lisboa",
      industry: "padaria",
      opportunity: "não tem website",
    });
    expect(result.subject).toContain("Padaria Lisboa");
    expect(result.subject).not.toContain("{{companyName}}");
  });

  it("replaces {{companyName}} everywhere in body", () => {
    const t = getTemplateById("tpl-no-website-001")!;
    const result = applyTemplate(t, {
      companyName: "Empresa Teste",
      industry: "setor",
      opportunity: "situação",
    });
    expect(result.body).not.toContain("{{companyName}}");
    const occurrences = (result.body.match(/Empresa Teste/g) ?? []).length;
    expect(occurrences).toBeGreaterThan(1);
  });

  it("replaces {{industry}} in body", () => {
    const t = getTemplateById("tpl-no-website-001")!;
    const result = applyTemplate(t, {
      companyName: "Empresa",
      industry: "construção civil",
      opportunity: "situação",
    });
    expect(result.body).toContain("construção civil");
    expect(result.body).not.toContain("{{industry}}");
  });

  it("replaces {{opportunity}} in body", () => {
    const t = getTemplateById("tpl-no-website-001")!;
    const result = applyTemplate(t, {
      companyName: "Empresa",
      industry: "setor",
      opportunity: "ausência de presença online",
    });
    expect(result.body).toContain("ausência de presença online");
    expect(result.body).not.toContain("{{opportunity}}");
  });

  it("leaves no unreplaced placeholders", () => {
    const t = getTemplateById("tpl-weak-website-002")!;
    const result = applyTemplate(t, {
      companyName: "XYZ",
      industry: "tecnologia",
      opportunity: "site com potencial",
    });
    expect(result.subject).not.toContain("{{");
    expect(result.body).not.toContain("{{");
  });

  it("does not mutate the original template", () => {
    const t = getTemplateById("tpl-no-website-001")!;
    const originalSubject = t.subject;
    applyTemplate(t, {
      companyName: "Empresa",
      industry: "setor",
      opportunity: "situação",
    });
    expect(t.subject).toBe(originalSubject);
  });
});
