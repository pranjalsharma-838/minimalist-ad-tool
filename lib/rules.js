// Deterministic rule layer. Reads rules/brand_rules.json (the standard) and returns findings with
// exact character spans. This layer runs with or without an API key and its findings can never be
// removed by the model layer — only added to (see lib/score.js).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG, knownPcts, normPct } from "./catalog.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const RULES = JSON.parse(fs.readFileSync(path.join(here, "..", "rules", "brand_rules.json"), "utf8"));
export const RULE_INDEX = new Map(RULES.rules.map((r) => [r.id, r]));

export const FIELDS = ["headline", "primary_text", "on_image_text", "footnote", "cta"];
const SEV_ORDER = ["advisory", "fix", "block"];
const lower = (s) => SEV_ORDER[Math.max(0, SEV_ORDER.indexOf(s) - 1)];

// Replace Minimalist product names with same-length filler so offsets survive and names like
// "Lip Treatment Balm" / "Healing Ointment" don't trigger drug-claim patterns.
function maskProductNames(text, extraNames = []) {
  let out = text;
  // Advertiser / brand names too: "Heaven Magic" is a name, not hype (stand-in eval false positive).
  const variants = extraNames
    .filter((n) => n && n.length > 2)
    .flatMap((n) => {
      const base = n.replace(/\s+with\s+.*$/i, "").trim(); // "creator with Brand" -> "creator"
      const short = base.replace(/\s*[-–]\s*.*$/, "").replace(/\s+(beauty|skincare|skin care|co\.?|india|official)$/i, "").trim();
      return [base, short].filter((v) => v.length > 2);
    });
  for (const t of [...new Set(variants), ...CATALOG.titles]) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, (m) => "·".repeat(m.length));
  }
  return out;
}

function sentenceAround(text, start, end) {
  const before = text.lastIndexOf("\n", start);
  const s = Math.max(before, ...[". ", "! ", "? "].map((p) => text.lastIndexOf(p, start))) + 1;
  const ends = ["\n", ". ", "! ", "? "].map((p) => text.indexOf(p, end)).filter((i) => i >= 0);
  const e = ends.length ? Math.min(...ends) + 1 : text.length;
  return text.slice(s, e).trim();
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9% ]+/g, " ").replace(/\s+/g, " ").trim();

// Does this ad sentence come from the product page? Token overlap against each fact.
export function findProvenance(sentence, sheet) {
  if (!sheet || !sheet.facts) return null;
  const toks = norm(sentence).split(" ").filter((t) => t.length > 2);
  if (toks.length === 0) return null;
  let best = null;
  for (const f of sheet.facts) {
    if (f.kind === "testimonial" || f.kind === "inci") continue;
    const ft = new Set(norm(f.text).split(" "));
    const hit = toks.filter((t) => ft.has(t)).length / toks.length;
    if (hit >= 0.8 && (!best || hit > best.hit)) best = { id: f.id, hit, text: f.text };
  }
  return best;
}

function finding(rule, field, text, start, end, extra = {}) {
  return {
    rule_id: rule.id,
    dimension: rule.dimension,
    severity: rule.severity,
    title: rule.title,
    field,
    start,
    end,
    span: text.slice(start, end),
    message: rule.message,
    fix: rule.fix,
    sources: rule.sources,
    confidence: rule.confidence,
    layer: "rule",
    ...extra,
  };
}

// ---- computed checks (things a regex alone can't decide) ----
const COMPUTED = {
  // "Niacinamide 12%" / "12% Niacinamide" where no Minimalist product sells that strength.
  concentration_mismatch(rule, field, text, ctx) {
    const out = [];
    // [ \t] not \s: "…Salicylic Acid + LHA\n6% …" must not read as "LHA 6%" (first gate run).
    const re = /\b(\d{1,2}(?:\.\d+)?)[ \t]?%[ \t]+([A-Z][A-Za-z\- ]{2,30}?)(?=[\s,.;:!)]|$)|\b([A-Z][A-Za-z\-]{2,30}(?: [A-Z][A-Za-z\-]+)?)[ \t]+(\d{1,2}(?:\.\d+)?)[ \t]?%/g;
    let m;
    while ((m = re.exec(text))) {
      const pct = m[1] || m[4];
      const ing = (m[2] || m[3]).trim();
      // "LHA 6% penetration", "Salicylic Acid ~58%": a measured figure, not a concentration (first gate
      // run). Those are statistics (CLM-08 / model layer), not CLM-20.
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 24);
      const before = text.slice(Math.max(0, m.index - 2), m.index);
      if (/^[ \t]*(penetration|absorption|reduction|increase|decrease|more|less|of|in|subjects|users|hydration|moisture|pure|purity|content|better|faster|vs\b)/i.test(after) || /~/.test(before + (m[0].match(/~/) || ""))) continue;
      // The attached product at its own strength is correct, whatever the catalog fuzzy-lookup says
      // ("Stated 32% but this product is 32%" was a false block on the first gate run).
      if (ctx.sheet && [ctx.sheet, ...(ctx.extraSheets || [])].some((sh) => sameIngredient(ing, sh) && sh.actives.some((a) => normPct(a.pct) === normPct(pct)))) continue;
      const known = knownPcts(ing);
      if (!known) continue;
      // Component strengths stated on the attached product page are correct even if the catalog title
      // only has the total: "25% AHA, 5% PHA, 2% BHA" on the AHA PHA BHA 32% peel (first gate run).
      if (ctx.sheet && ctx.sheet.facts.some((f) => new RegExp(`\\b0*${pct.replace(".", "\\.")}\\s?%\\s*${ing.split(/\s+/)[0]}|${ing.split(/\s+/)[0]}\\s*0*${pct.replace(".", "\\.")}\\s?%`, "i").test(f.text))) continue;
      const productPcts = ctx.sheet ? ctx.sheet.actives.map((a) => normPct(a.pct)) : null;
      if (known.includes(normPct(pct)) && (!productPcts || productPcts.includes(normPct(pct)) || !sameIngredient(ing, ctx.sheet))) continue;
      const where = productPcts && sameIngredient(ing, ctx.sheet) ? `this product is ${ctx.sheet.actives.map((a) => a.pct).join(" / ")}` : `Minimalist sells ${ing} at ${known.map((k) => k + "%").join(", ")}`;
      // Heuristic (eval run 2, relaunch ad "OAT EXTRACT 06% … you loved" -> "now … 6.5%"): a strength
      // that isn't in the current catalog may be the PREVIOUS formula. With no product page attached and
      // wording that points to an earlier version, ask a human to confirm instead of hard-blocking.
      const refersToOld = !ctx.sheet && /\b(previous(ly)?|formerly|old|earlier|used to|you loved|upgraded|reformulated|now|new and improved)\b/i.test(text);
      out.push(finding(rule, field, text, m.index, m.index + m[0].length, {
        message: `${rule.message} Stated ${pct}% but ${where}.${refersToOld ? " The ad seems to refer to an earlier formula — confirm, and label it clearly as the previous version." : ""}`,
        ...(refersToOld ? { severity: "fix", note: "Lowered to fix: wording suggests a previous formula (heuristic)." } : {}),
      }));
    }
    return out;
  },

  spf_mismatch(rule, field, text, ctx) {
    const out = [];
    // Every product SHOWN in the ad counts (range guide with SPF 50 + SPF 60 is not a mismatch).
    const shown = ctx.sheet ? [ctx.sheet, ...(ctx.extraSheets || [])] : [];
    const known = shown.length ? shown.flatMap((s) => s.actives.filter((a) => a.name === "SPF").map((a) => a.pct)) : null;
    const catalogSpfs = ["30", "50", "60"]; // from snapshot titles (SPF 30 / 50 / 60)
    for (const m of text.matchAll(/\bSPF\s?(\d{1,3})\+?/gi)) {
      const n = m[1];
      const bad = known && known.length ? !known.includes(n) : !catalogSpfs.includes(n);
      if (!bad) continue;
      // The product page's own lab result (e.g. labelled SPF 50, "SPF value obtained: 56"): fine as a test
      // result in the footnote, a must-fix if used as the claim (found on the generator stand-in test).
      const measured = ctx.sheet && ctx.sheet.facts.some((f) => f.kind === "study" || f.kind === "claim" ? new RegExp(`\\b(spf|value)[^.]{0,30}\\b${n}\\b`, "i").test(f.text) : false);
      if (measured) {
        out.push(finding(rule, field, text, m.index, m.index + m[0].length, {
          severity: field === "footnote" ? "advisory" : "fix",
          message: `SPF ${n} is the lab-measured value from the product page; the labelled SPF is ${known.join("/")}.`,
          fix: `Claim the labelled SPF ${known.join("/")}; keep 'SPF ${n} obtained (ISO 24444:2019)' as the test result in the footnote.`,
        }));
        continue;
      }
      out.push(finding(rule, field, text, m.index, m.index + m[0].length, {
        message: known && known.length ? `${rule.message} Ad says SPF ${n}; product is SPF ${known.join("/")}.` : `${rule.message} No Minimalist product is SPF ${n}.`,
        severity: known && known.length ? "block" : "fix",
      }));
    }
    return out;
  },

  // Hero active mentioned with no % anywhere near it. One finding per ad field at most.
  active_without_pct(rule, field, text, ctx) {
    if (field === "cta" || field === "footnote") return [];
    const names = ctx.sheet ? ctx.sheet.actives.filter((a) => a.name !== "SPF").map((a) => a.name.split(/\s*\+\s*/)[0]) : [];
    for (const n of names) {
      const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const m = text.match(re);
      if (!m) continue;
      const near = text.slice(Math.max(0, m.index - 12), m.index + m[0].length + 14);
      if (!/\d\s?%/.test(near)) return [finding(rule, field, text, m.index, m.index + m[0].length)];
    }
    return [];
  },

  // A count of emoji across the ad. Brand-authored copy on the site uses essentially none.
  emoji_density(rule, field, text) {
    const em = [...text.matchAll(/\p{Extended_Pictographic}/gu)];
    if (em.length < (rule.threshold || 2)) return [];
    return [finding(rule, field, text, em[0].index, em[0].index + em[0][0].length, { message: `${rule.message} (${em.length} emoji in ${field}).` })];
  },

  exclamation_density(rule, field, text) {
    const ex = [...text.matchAll(/!/g)];
    if (ex.length < (rule.threshold || 2)) return [];
    return [finding(rule, field, text, ex[0].index, ex[0].index + 1, { message: `${rule.message} (${ex.length} exclamation marks in ${field}).` })];
  },
};

function sameIngredient(ing, sheet) {
  if (!sheet) return false;
  const a = ing.toLowerCase();
  return sheet.actives.some((x) => x.name.toLowerCase().split(/\s*\+\s*/).some((t) => t && (a.includes(t.toLowerCase()) || t.toLowerCase().includes(a))));
}

// Ad-level checks that look at the whole ad, not a field.
function adLevel(ad, ctx) {
  const out = [];
  const all = FIELDS.map((f) => ad[f] || "").join("\n");
  const disclose = RULE_INDEX.get("CRE-01");
  if (disclose && ad.ad_type === "creator") {
    // Three levels (matches the independent reviewer's labels): missing -> block; present but only
    // after Meta's ~125-char "See more" cut -> fix (ASCI: upfront, not buried in hashtags); upfront -> ok.
    const re = /#ad\b|#sponsored|paid partnership|#collab\w*|\bsponsored\b|\bad\s*\|/i;
    const text = ad.primary_text || "";
    const m = text.match(re);
    if (!re.test(all)) {
      out.push({ ...finding(disclose, "primary_text", text, 0, 0), span: "" });
    } else if (m && m.index > 125 && !re.test(ad.headline || "") && !re.test(ad.on_image_text || "")) {
      out.push(finding(disclose, "primary_text", text, m.index, m.index + m[0].length, {
        severity: "fix",
        message: "Disclosure is there but only after the caption's 'See more' cut-off, so most viewers won't see it.",
        fix: "Move '#ad' / 'Paid partnership' to the start of the caption.",
      }));
    }
  }
  return out;
}

export function runRules(ad, ctx = {}) {
  const findings = [];
  const isCreator = ad.ad_type === "creator";
  for (const field of FIELDS) {
    const text = ad[field] || "";
    if (!text.trim()) continue;
    const masked = maskProductNames(text, [ad.advertiser, ...(ctx.brandNames || [])]);
    for (const rule of RULES.rules) {
      if (rule.applies_to && !rule.applies_to.includes(field)) continue;
      let hits = [];
      if (rule.computed) {
        if (COMPUTED[rule.computed]) hits = COMPUTED[rule.computed](rule, field, text, ctx);
      } else if (rule.patterns) {
        for (const p of rule.patterns) {
          const re = new RegExp(p, "giu");
          let m;
          while ((m = re.exec(masked))) {
            if (m[0].length === 0) { re.lastIndex++; continue; }
            const sent = sentenceAround(text, m.index, m.index + m[0].length);
            if (rule.unless_same_sentence && rule.unless_same_sentence.some((u) => new RegExp(u, "iu").test(sent))) continue;
            hits.push(finding(rule, field, text, m.index, m.index + m[0].length, { sentence: sent }));
          }
        }
      }
      for (const h of hits) {
        if (isCreator && rule.creator_severity) {
          if (rule.creator_severity === "skip") continue;
          h.severity = rule.creator_severity;
          h.note = "Creator-voice ad: tone rule relaxed.";
        }
        if (rule.provenance === "downgrade" && ctx.sheet) {
          const prov = findProvenance(h.sentence || h.span, ctx.sheet);
          if (prov) {
            h.severity = lower(h.severity);
            h.provenance = prov.id;
            h.note = `Wording appears on the product page (${prov.id}). Severity lowered one step: the brand has published it, but a reviewer must still confirm substantiation is on file.`;
          }
        }
        findings.push(h);
      }
    }
  }
  findings.push(...adLevel(ad, ctx));
  return dedupe(findings);
}

// Same rule, same field, overlapping span -> keep one.
function dedupe(fs_) {
  const out = [];
  for (const f of fs_) {
    if (out.some((g) => g.rule_id === f.rule_id && g.field === f.field && f.start < g.end && g.start < f.end)) continue;
    out.push(f);
  }
  return out;
}

export { SEV_ORDER };
