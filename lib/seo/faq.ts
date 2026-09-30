// Per-article FAQs. The same list is shown on the page and turned into FAQPage
// structured data, so the schema can never describe content a visitor cannot see.

export interface FaqItem { question: string; answer: string }

export const MAX_FAQS = 10;
export const MAX_QUESTION = 200;
export const MAX_ANSWER = 1500;

/** Safe FAQ list from untrusted JSON: only complete question/answer pairs, trimmed and capped. */
export function cleanFaqs(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  const out: FaqItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const q = (item as Record<string, unknown>).question;
    const a = (item as Record<string, unknown>).answer;
    if (typeof q !== "string" || typeof a !== "string") continue;
    const question = q.trim().slice(0, MAX_QUESTION);
    const answer = a.trim().slice(0, MAX_ANSWER);
    if (question && answer) out.push({ question, answer });
    if (out.length === MAX_FAQS) break;
  }
  return out;
}

/** FAQPage JSON-LD, or null when there is nothing to describe. */
export function faqJsonLd(items: FaqItem[]) {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}
