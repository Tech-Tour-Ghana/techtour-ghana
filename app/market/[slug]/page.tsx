import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ProductDetail from '@/components/market/ProductDetail';
import { PRODUCT_SELECT, toMarketProduct } from '@/components/market/shared';
import JsonLd from '@/components/seo/JsonLd';
import { getSiteSeo, toMetadata } from '@/lib/seo/load.server';
import { breadcrumbJsonLd, resolveSeo } from '@/lib/seo/resolve';
import { seoFieldsFrom } from '@/lib/seo/site';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

const getProduct = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from('market_products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle();
  if (!data) return null;
  const product = toMarketProduct(data);

  let related: ReturnType<typeof toMarketProduct>[] = [];
  if (product.category_id) {
    const { data: rows } = await supabase
      .from('market_products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .order('sort_order', { ascending: true })
      .limit(4);
    related = (rows ?? []).map(toMarketProduct);
  }
  return { product, related };
});

const getResolved = cache(async (slug: string) => {
  const found = await getProduct(slug);
  if (!found) return null;
  const site = await getSiteSeo();
  const resolved = resolveSeo({
    path: `/market/${slug}`,
    title: found.product.title,
    excerpt: found.product.description.slice(0, 160),
    imageUrl: found.product.image_url ?? '',
    seo: seoFieldsFrom(null),
    site,
  });
  return { ...found, site, resolved };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await getResolved(slug);
  if (!found) return {};
  return toMetadata(found.resolved, { type: 'website', siteName: found.site.siteName });
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const found = await getResolved(slug);
  if (!found) notFound();
  const { product, related, site, resolved } = found;

  const price = product.discount_price !== null && product.discount_price < product.price ? product.discount_price : product.price;

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description || undefined,
            image: resolved.og.image || undefined,
            sku: product.sku || undefined,
            offers: {
              '@type': 'Offer',
              url: resolved.canonical,
              priceCurrency: 'GHS',
              price: price.toFixed(2),
              availability: product.is_in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          },
          breadcrumbJsonLd([{ name: 'Market', path: '/market' }, { name: product.title, path: `/market/${slug}` }], site),
        ]}
      />
      <ProductDetail product={product} related={related} />
    </>
  );
}
