import * as cheerio from "cheerio";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 10_000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Domains and patterns that reliably indicate a placeholder or example address
 * rather than a real business contact email.
 */
const EMAIL_BLOCKLIST_PATTERNS: RegExp[] = [
  /example\.com/i,
  /yourdomain/i,
  /domain\.com/i,
  /seudominio/i,
  // Image retina suffixes: foo@2x.png, bar@3x.jpg, etc.
  /@\d+x\.[a-z]{2,4}$/i,
];

/**
 * Broad email regex used as a fallback over the full page text.
 * Intentionally permissive — false positives are filtered in `isValidEmail`.
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when `email` passes all sanity checks:
 * - No blocklisted domain / pattern.
 * - The domain part (after "@") contains at least one dot, confirming a TLD is
 *   present and the string is not a bare hostname reference.
 */
function isValidEmail(email: string): boolean {
  for (const pattern of EMAIL_BLOCKLIST_PATTERNS) {
    if (pattern.test(email)) {
      return false;
    }
  }

  const atIndex = email.indexOf("@");
  if (atIndex === -1) {
    return false;
  }

  const domain = email.slice(atIndex + 1);
  if (!domain.includes(".")) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

/**
 * Fetch the HTML content of `url` with a 10-second timeout.
 *
 * Returns the response body text when:
 * - The HTTP status is 2xx.
 * - The Content-Type header indicates an HTML document.
 *
 * Returns `null` on network errors, timeouts, non-2xx responses, or when the
 * server returns a non-HTML content type (e.g. a PDF or JSON endpoint).
 *
 * Never throws — all errors are caught internally.
 */
export async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return null;
    }

    return await response.text();
  } catch {
    // Covers AbortError (timeout), network failures, and DNS errors.
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract the first plausible business contact email address from `html`.
 *
 * Strategy (highest confidence first):
 * 1. Parse `<a href="mailto:...">` elements — an explicit mailto link is the
 *    strongest signal that the address is intentionally public.
 * 2. Fall back to a broad regex scan over the full page text for addresses
 *    that may be written in plain text or inside other elements.
 *
 * In both cases, each candidate is run through `isValidEmail` to discard
 * placeholder addresses and image-filename false positives.
 *
 * Returns the first valid match, or `null` if none is found.
 */
export function extractEmail(html: string): string | null {
  const $ = cheerio.load(html);

  // Pass 1 — explicit mailto anchors (case-insensitive href match).
  const mailtoLinks = $("a").filter((_, el) =>
    ($(el).attr("href") ?? "").toLowerCase().startsWith("mailto:")
  );
  for (let i = 0; i < mailtoLinks.length; i++) {
    const href = $(mailtoLinks[i]).attr("href") ?? "";
    // Strip "mailto:" prefix and any query string (e.g. ?subject=...).
    const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
    if (email && isValidEmail(email)) {
      return email;
    }
  }

  // Pass 2 — regex over full page text.
  const pageText = $.text();
  const matches = pageText.match(new RegExp(EMAIL_REGEX.source, "g"));
  if (matches) {
    for (const candidate of matches) {
      if (isValidEmail(candidate)) {
        return candidate.toLowerCase();
      }
    }
  }

  return null;
}
