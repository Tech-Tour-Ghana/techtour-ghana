import type { FaqItem } from '@/lib/seo/faq';

/** Visible FAQ section. Always expanded so what search engines read is what visitors see. */
export default function ArticleFaq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="article-faq" className="mt-12 max-w-[44rem] mx-auto">
      <h2 id="article-faq" className="text-2xl font-bold mb-4" style={{ color: 'var(--sp-text-primary)' }}>Frequently asked questions</h2>
      <div className="space-y-5">
        {items.map((item, i) => (
          <div key={i}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--sp-text-primary)' }}>{item.question}</h3>
            <p className="mt-1 whitespace-pre-line leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
