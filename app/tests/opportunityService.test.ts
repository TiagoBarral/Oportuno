import { describe, it, expect } from "vitest";
import { classifyOpportunity } from "@/lib/services/opportunityService";

describe("classifyOpportunity", () => {
  // ── Rule 1: no website ────────────────────────────────────────────────────

  it("returns NO_WEBSITE when website is null", () => {
    expect(classifyOpportunity(null, null)).toBe("NO_WEBSITE");
  });

  it("returns NO_WEBSITE when website is empty string", () => {
    expect(classifyOpportunity("", null)).toBe("NO_WEBSITE");
  });

  // ── Rule 2: website exists but HTML is null ───────────────────────────────

  it("returns WEAK_WEBSITE when website exists but HTML is null", () => {
    expect(classifyOpportunity("https://example.pt", null)).toBe("WEAK_WEBSITE");
  });

  // ── Rule 3: two or more weak signals ─────────────────────────────────────

  it("returns WEAK_WEBSITE when no h1 and no meta description (2 signals)", () => {
    const html = "<html><body><p>Bem-vindo</p></body></html>";
    expect(classifyOpportunity("https://example.pt", html)).toBe("WEAK_WEBSITE");
  });

  it("returns WEAK_WEBSITE when no h1 and fewer than 3 internal links (2 signals)", () => {
    // has meta description, no h1, only 2 internal links
    const html = `<html>
      <head><meta name="description" content="Boa empresa"></head>
      <body>
        <a href="/sobre">Sobre</a>
        <a href="/contacto">Contacto</a>
      </body>
    </html>`;
    expect(classifyOpportunity("https://example.pt", html)).toBe("WEAK_WEBSITE");
  });

  it("returns WEAK_WEBSITE when no meta description and fewer than 3 internal links (2 signals)", () => {
    // has h1, no meta description, only 2 internal links
    const html = `<html>
      <body>
        <h1>Bem-vindo</h1>
        <a href="/sobre">Sobre</a>
        <a href="/contacto">Contacto</a>
      </body>
    </html>`;
    expect(classifyOpportunity("https://example.pt", html)).toBe("WEAK_WEBSITE");
  });

  it("returns WEAK_WEBSITE when all three signals are present", () => {
    const html = "<html><body></body></html>";
    expect(classifyOpportunity("https://example.pt", html)).toBe("WEAK_WEBSITE");
  });

  it("returns WEAK_WEBSITE for empty HTML string", () => {
    // cheerio loads empty doc: no h1, no meta description, 0 links → 3 signals
    expect(classifyOpportunity("https://example.pt", "")).toBe("WEAK_WEBSITE");
  });

  // ── Rule 4: substantive site ──────────────────────────────────────────────

  it("returns NONE when h1, meta description, and 3+ relative internal links are present", () => {
    const html = `<html>
      <head><meta name="description" content="Empresa de qualidade"></head>
      <body>
        <h1>Bem-vindo</h1>
        <a href="/sobre">Sobre</a>
        <a href="/servicos">Serviços</a>
        <a href="/contacto">Contacto</a>
      </body>
    </html>`;
    expect(classifyOpportunity("https://example.pt", html)).toBe("NONE");
  });

  it("returns NONE when only one weak signal is present", () => {
    // h1 present, meta description present, only 2 links → 1 signal (fewInternalLinks)
    const html = `<html>
      <head><meta name="description" content="Boa empresa"></head>
      <body>
        <h1>Título</h1>
        <a href="/sobre">Sobre</a>
        <a href="/contacto">Contacto</a>
      </body>
    </html>`;
    expect(classifyOpportunity("https://example.pt", html)).toBe("NONE");
  });

  it("counts absolute internal links by matching hostname", () => {
    const html = `<html>
      <head><meta name="description" content="Empresa"></head>
      <body>
        <h1>Início</h1>
        <a href="https://meusite.pt/sobre">Sobre</a>
        <a href="https://meusite.pt/servicos">Serviços</a>
        <a href="https://meusite.pt/contacto">Contacto</a>
      </body>
    </html>`;
    expect(classifyOpportunity("https://meusite.pt", html)).toBe("NONE");
  });

  it("does not count external links as internal", () => {
    // h1 present, meta description present, 3 links but all external → fewInternalLinks=true → 1 signal → NONE
    const html = `<html>
      <head><meta name="description" content="Empresa"></head>
      <body>
        <h1>Início</h1>
        <a href="https://facebook.com">Facebook</a>
        <a href="https://instagram.com">Instagram</a>
        <a href="https://google.com">Google</a>
      </body>
    </html>`;
    expect(classifyOpportunity("https://meusite.pt", html)).toBe("NONE");
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it("does not throw on malformed HTML", () => {
    expect(() =>
      classifyOpportunity("https://example.pt", "<<div>>not valid</div>>")
    ).not.toThrow();
  });
});
