import MarketClient, { type MarketInitial } from '@/components/market/MarketClient';
import { PRODUCT_SELECT, buildMarketState, toMarketProduct } from '@/components/market/shared';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function MarketPage() {
  const supabase = await createClient();
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from('market_products').select(PRODUCT_SELECT).eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('market_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ]);

  const products = (productsRes.data ?? []).map((p) => toMarketProduct(p));
  const { categories, stats } = buildMarketState(products, categoriesRes.data ?? []);
  return <MarketClient initial={{ products, categories, stats } as unknown as MarketInitial} />;
}
