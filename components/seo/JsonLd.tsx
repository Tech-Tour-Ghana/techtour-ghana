import { serializeJsonLd } from '@/lib/seo/resolve';

/** Structured data for the page's <head>. Pass only data the page visibly shows. */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <>
      {(Array.isArray(data) ? data : [data]).map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }} />
      ))}
    </>
  );
}
