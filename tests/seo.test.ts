import assert from "node:assert/strict";
import test from "node:test";

import { analyzeHtml } from "../lib/seo/html.ts";
import { DEFAULT_SITE_SEO, EMPTY_SEO, applyTitlePattern, isValidCanonical, resolveSeo, serializeJsonLd } from "../lib/seo/resolve.ts";
import { sanitizeArticleHtml } from "../lib/seo/sanitize.server.ts";
import { analyzeSeo, scoreLabel } from "../lib/seo/score.ts";
import { isValidSlug, slugify } from "../lib/seo/slug.ts";

const site = DEFAULT_SITE_SEO;

test("slugify produces safe, readable slugs", () => {
  assert.equal(slugify("  Complete Guide to Visiting Cape Coast Castle! "), "complete-guide-to-visiting-cape-coast-castle");
  assert.equal(slugify("Café & Kente — 2026"), "cafe-and-kente-2026");
  assert.equal(slugify("--a---b--"), "a-b");
  assert.ok(isValidSlug("cape-coast-castle"));
  assert.ok(!isValidSlug("Cape Coast"));
  assert.ok(!isValidSlug("a--b"));
});

test("analyzeHtml reads headings, links, images and stray data images", () => {
  const s = analyzeHtml(
    '<p>Intro about <a href="/blog/culture/x">kente</a> and <a href="https://example.com">a site</a>.</p><h2>One</h2><h4>Skip</h4><img src="/a.jpg" alt="A"><img src="data:image/png;base64,AAA" alt="">',
    "techtourghana.com",
  );
  assert.equal(s.headings.length, 2);
  assert.equal(s.links.filter((l) => l.internal).length, 1);
  assert.equal(s.images.length, 2);
  assert.ok(s.hasInlineDataImage);
});

test("resolveSeo applies fallbacks in order", () => {
  const r = resolveSeo({ path: "/blog/culture/x", title: "Article", excerpt: "An excerpt", imageUrl: "/img.jpg", seo: EMPTY_SEO, site });
  assert.equal(r.title, "Article | TechTour Ghana");
  assert.equal(r.description, "An excerpt");
  assert.equal(r.canonical, "https://techtourghana.com/blog/culture/x");
  assert.equal(r.og.image, "https://techtourghana.com/img.jpg");
  const custom = resolveSeo({ path: "/p", title: "T", excerpt: "e", imageUrl: "", seo: { ...EMPTY_SEO, seo_title: "Custom", og_title: "Social", canonical_url: "https://techtourghana.com/canon" }, site });
  assert.equal(custom.bareTitle, "Custom");
  assert.equal(custom.og.title, "Social");
  assert.equal(custom.twitter.title, "Social");
  assert.equal(custom.canonical, "https://techtourghana.com/canon");
  assert.ok(!isValidCanonical("not a url"));
  assert.equal(applyTitlePattern("TechTour Ghana tours", site), "TechTour Ghana tours");
});

test("score is deterministic and explains itself", () => {
  const weak = analyzeSeo({ title: "Hi", slug: "", path: "/blog/x/", excerpt: "", contentHtml: "<p>Short.</p>", featuredImageUrl: "", featuredImageAlt: "", seo: EMPTY_SEO, site });
  assert.ok(weak.score < 50);
  assert.equal(weak.label, "Needs Work");
  assert.ok(weak.checks.some((c) => c.id === "featured-image" && c.status === "critical"));

  const para = "Cape Coast Castle is one of the most visited heritage sites in Ghana and tells a powerful story about the history of the coast. ".repeat(3);
  const body = `<p>${para}</p><h2>Cape Coast Castle history</h2><p>${para}${para}</p><h3>Visiting</h3><p>${para} <a href="/destinations/cape-coast">Cape Coast guide</a></p><img src="/a.jpg" alt="The castle">`;
  const strong = analyzeSeo({
    title: "Complete Guide to Visiting Cape Coast Castle",
    slug: "visiting-cape-coast-castle",
    path: "/blog/destinations/visiting-cape-coast-castle",
    excerpt: "A practical guide.",
    contentHtml: body,
    featuredImageUrl: "/hero.jpg",
    featuredImageAlt: "Cape Coast Castle at sunrise",
    seo: { ...EMPTY_SEO, seo_title: "Visiting Cape Coast Castle: A Complete Guide", meta_description: "Plan your visit to Cape Coast Castle with opening hours, tour options, history and practical tips for a respectful, memorable trip.", focus_keyword: "Cape Coast Castle" },
    site,
  });
  assert.ok(strong.score >= 85, `expected excellent, got ${strong.score}`);
  assert.equal(scoreLabel(strong.score), strong.label);
  assert.equal(JSON.stringify(strong), JSON.stringify(analyzeSeo({
    title: "Complete Guide to Visiting Cape Coast Castle", slug: "visiting-cape-coast-castle", path: "/blog/destinations/visiting-cape-coast-castle", excerpt: "A practical guide.", contentHtml: body,
    featuredImageUrl: "/hero.jpg", featuredImageAlt: "Cape Coast Castle at sunrise",
    seo: { ...EMPTY_SEO, seo_title: "Visiting Cape Coast Castle: A Complete Guide", meta_description: "Plan your visit to Cape Coast Castle with opening hours, tour options, history and practical tips for a respectful, memorable trip.", focus_keyword: "Cape Coast Castle" }, site,
  })));
});

test("keyword stuffing is flagged, not rewarded", () => {
  const stuffed = "<p>" + "kente cloth ".repeat(60) + "</p>";
  const r = analyzeSeo({ title: "Kente", slug: "kente", path: "/p", excerpt: "x", contentHtml: stuffed, featuredImageUrl: "", featuredImageAlt: "", seo: { ...EMPTY_SEO, focus_keyword: "kente cloth" }, site });
  assert.equal(r.checks.find((c) => c.id === "kw-content")?.status, "improve");
});

test("sanitizer removes scripts, handlers, javascript: urls, iframes and data images", () => {
  const dirty =
    '<h1>Title</h1><p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">bad</a><a href="https://e.com" target="_top">ok</a>' +
    '<iframe src="https://evil"></iframe><img src="data:image/png;base64,AAA" alt="x"><img src="/ok.jpg" alt="ok" onerror="x()"><p style="color:red;text-align:center">s</p>';
  const clean = sanitizeArticleHtml(dirty);
  assert.ok(!/script|onclick|onerror|javascript:|iframe|data:image/i.test(clean), clean);
  assert.ok(clean.includes("<h2>Title</h2>"));
  assert.ok(clean.includes('rel="noopener noreferrer"'));
  assert.ok(clean.includes("text-align:center") && !clean.includes("color:red"));
  assert.ok(clean.includes('loading="lazy"'));
});

test("plain text bodies become escaped paragraphs and JSON-LD cannot close the script tag", () => {
  assert.equal(sanitizeArticleHtml("One & 2 < 3\n\nTwo"), "<p>One &amp; 2 &lt; 3</p><p>Two</p>");
  assert.ok(!serializeJsonLd({ a: "</script><script>x" }).includes("</script>"));
});
