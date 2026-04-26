import { Opportunity } from "@prisma/client";
import * as cheerio from "cheerio";

/**
 * Counts anchor tags whose href is a relative path (starts with "/") or an
 * absolute URL sharing the same hostname as `websiteUrl`.
 *
 * When `websiteUrl` is null or unparseable the function falls back to counting
 * only relative hrefs.
 */
function countInternalLinks(
  $: ReturnType<typeof cheerio.load>,
  websiteUrl: string | null
): number {
  let hostname: string | null = null;
  if (websiteUrl) {
    try {
      hostname = new URL(websiteUrl).hostname;
    } catch {
      // Malformed URL — treat as no hostname available.
    }
  }

  let count = 0;
  $("a[href]").each((_index, el) => {
    const href = $(el).attr("href") ?? "";
    if (href.startsWith("/")) {
      count += 1;
      return;
    }
    if (hostname) {
      try {
        const parsed = new URL(href);
        if (parsed.hostname === hostname) {
          count += 1;
        }
      } catch {
        // Not a valid absolute URL — skip.
      }
    }
  });
  return count;
}

/**
 * Classify a company's lead opportunity based on whether it has a website and
 * how substantive that website's HTML content is.
 *
 * Rules (evaluated in order):
 * 1. No website URL supplied          → NO_WEBSITE
 * 2. Website exists but HTML is null  → WEAK_WEBSITE  (site unreachable)
 * 3. HTML present — check three weak-content signals:
 *    - No <h1> tag
 *    - No <meta name="description"> tag
 *    - Fewer than 3 internal links
 *    If ANY TWO of the three signals are true → WEAK_WEBSITE
 * 4. Otherwise                        → NONE
 */
export function classifyOpportunity(
  website: string | null,
  html: string | null
): Opportunity {
  // Rule 1 — no website at all.
  if (!website) {
    return Opportunity.NO_WEBSITE;
  }

  // Rule 2 — website URL exists but the site could not be fetched.
  if (html === null) {
    return Opportunity.WEAK_WEBSITE;
  }

  // Rule 3 — parse and check weak-content signals.
  const $ = cheerio.load(html);

  const noH1 = $("h1").length === 0;
  const hasMetaDescription = $("meta[name]").toArray().some(
    (el) => $(el).attr("name")?.toLowerCase() === "description"
  );
  const noMetaDescription = !hasMetaDescription;
  const fewInternalLinks = countInternalLinks($, website) < 3;

  const weakSignalCount = [noH1, noMetaDescription, fewInternalLinks].filter(
    Boolean
  ).length;

  if (weakSignalCount >= 2) {
    return Opportunity.WEAK_WEBSITE;
  }

  // Rule 4 — site looks substantive.
  return Opportunity.NONE;
}
