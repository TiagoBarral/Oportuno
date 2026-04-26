import { describe, it, expect } from "vitest";
import { extractEmail } from "@/lib/services/scraperService";

describe("extractEmail", () => {
  // ── Mailto links (highest confidence) ────────────────────────────────────

  it("extracts email from a mailto link", () => {
    const html = '<a href="mailto:info@empresa.pt">Contacto</a>';
    expect(extractEmail(html)).toBe("info@empresa.pt");
  });

  it("strips mailto: prefix correctly", () => {
    const html = '<a href="MAILTO:Info@Empresa.PT">Email</a>';
    expect(extractEmail(html)).toBe("info@empresa.pt");
  });

  it("strips query string from mailto", () => {
    const html = '<a href="mailto:info@empresa.pt?subject=Olá">Email</a>';
    expect(extractEmail(html)).toBe("info@empresa.pt");
  });

  it("returns the first mailto when multiple are present", () => {
    const html = `
      <a href="mailto:primeiro@empresa.pt">Primeiro</a>
      <a href="mailto:segundo@empresa.pt">Segundo</a>
    `;
    expect(extractEmail(html)).toBe("primeiro@empresa.pt");
  });

  it("extracts email with subdomain", () => {
    const html = '<a href="mailto:info@mail.empresa.pt">Email</a>';
    expect(extractEmail(html)).toBe("info@mail.empresa.pt");
  });

  // ── Plain text fallback ───────────────────────────────────────────────────

  it("extracts email from plain text when no mailto link exists", () => {
    const html = "<p>Contacte-nos em info@empresa.pt para mais informações.</p>";
    expect(extractEmail(html)).toBe("info@empresa.pt");
  });

  it("lowercases plain-text email", () => {
    const html = "<p>Email: INFO@EMPRESA.PT</p>";
    expect(extractEmail(html)).toBe("info@empresa.pt");
  });

  it("prefers mailto link over plain text email", () => {
    const html = `
      <p>Geral: geral@empresa.pt</p>
      <a href="mailto:contacto@empresa.pt">Email direto</a>
    `;
    expect(extractEmail(html)).toBe("contacto@empresa.pt");
  });

  // ── Null cases ────────────────────────────────────────────────────────────

  it("returns null when no email is present", () => {
    const html = "<p>Visite-nos em Lisboa. Tel: 21 000 0000</p>";
    expect(extractEmail(html)).toBeNull();
  });

  it("returns null for empty HTML", () => {
    expect(extractEmail("")).toBeNull();
  });

  // ── Blocklist ─────────────────────────────────────────────────────────────

  it("ignores example.com addresses", () => {
    const html = '<a href="mailto:info@example.com">Email</a>';
    expect(extractEmail(html)).toBeNull();
  });

  it("ignores yourdomain placeholder addresses", () => {
    const html = "<p>Email: info@yourdomain.com</p>";
    expect(extractEmail(html)).toBeNull();
  });

  it("ignores image retina suffixes", () => {
    const html = "<p><img src='logo@2x.png'></p>";
    expect(extractEmail(html)).toBeNull();
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it("does not throw on malformed HTML", () => {
    expect(() => extractEmail("<<not html>>")).not.toThrow();
  });

  it("handles HTML with many noise elements", () => {
    const html = `
      <html>
        <head><script>var x = 1;</script><style>.a { color: red; }</style></head>
        <body>
          <nav><a href="/">Home</a></nav>
          <footer>
            <a href="mailto:contacto@negocio.pt">Fale connosco</a>
          </footer>
        </body>
      </html>
    `;
    expect(extractEmail(html)).toBe("contacto@negocio.pt");
  });
});
