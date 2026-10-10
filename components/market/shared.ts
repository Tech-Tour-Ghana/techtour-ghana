// Values and helpers shared by the market list and the product page.

export const MARKET_COLORS = {
  light: {
    primary: 'var(--brand-primary)',
    primaryHover: 'var(--brand-primary-dark)',
    primaryLight: 'rgba(var(--brand-primary-rgb), 0.12)',
    secondary: 'var(--brand-accent)',
    secondaryHover: 'var(--brand-accent)',
    secondaryLight: 'rgba(var(--brand-accent-rgb), 0.12)',
    textPrimary: 'var(--brand-text)',
    textSecondary: 'var(--brand-text-2)',
    textMuted: 'var(--brand-muted)',
    background: 'var(--brand-bg-alt)',
    backgroundAlt: 'var(--brand-bg)',
    backgroundCard: 'var(--brand-card)',
    border: 'var(--brand-line)',
    borderLight: 'var(--brand-subtle)',
    success: 'var(--brand-success)',
    warning: 'var(--brand-warning)',
    error: 'var(--brand-error)',
    shadow: 'rgba(var(--brand-black-rgb), 0.08)',
    shadowHover: 'rgba(var(--brand-black-rgb), 0.15)',
  },
  dark: {
    primary: 'var(--brand-primary)',
    primaryHover: 'var(--brand-primary-dark)',
    primaryLight: 'rgba(var(--brand-primary-rgb), 0.12)',
    secondary: 'var(--brand-accent)',
    secondaryHover: 'var(--brand-accent)',
    secondaryLight: 'rgba(var(--brand-accent-rgb), 0.12)',
    textPrimary: 'var(--brand-text)',
    textSecondary: 'var(--brand-text-2)',
    textMuted: 'var(--brand-muted)',
    background: 'var(--brand-bg)',
    backgroundAlt: 'var(--brand-card)',
    backgroundCard: 'var(--brand-card)',
    border: 'var(--brand-line)',
    borderLight: 'var(--brand-subtle)',
    success: 'var(--brand-success)',
    warning: 'var(--brand-warning)',
    error: 'var(--brand-error)',
    shadow: 'rgba(var(--brand-black-rgb), 0.3)',
    shadowHover: 'rgba(var(--brand-black-rgb), 0.5)',
  },
} as const;

export function getColorSwatch(color: string): string {
  const c = color.toLowerCase();
  if (c.includes('black')) return 'var(--brand-ink)';
  if (c.includes('white')) return 'var(--brand-subtle)';
  if (c.includes('red')) return 'var(--brand-error)';
  if (c.includes('blue')) return 'var(--brand-info)';
  if (c.includes('green')) return 'var(--brand-success)';
  if (c.includes('yellow')) return 'var(--brand-warning)';
  if (c.includes('gold')) return 'var(--brand-warning)';
  if (c.includes('silver')) return 'var(--brand-muted)';
  if (c.includes('brown')) return 'var(--brand-warning-text)';
  if (c.includes('purple')) return 'var(--brand-purple)';
  if (c.includes('pink')) return 'var(--brand-purple)';
  if (c.includes('orange')) return 'var(--brand-warning)';
  if (c.includes('gray') || c.includes('grey')) return 'var(--brand-muted)';
  return c;
}

/** The select list both pages use: a product plus its category, artisan and gallery. */
export const PRODUCT_SELECT =
  '*, market_categories(name), artisans(id, name, slug, bio, profile_image_url, location, craft_type), product_gallery(*)';

const splitCsv = (value: string | null | undefined): string[] =>
  value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];

export interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

export interface ProductArtisan {
  id: string;
  name: string;
  slug: string;
  bio: string;
  profile_image: string | null;
  location: string;
  craft_type: string;
}

export interface MarketProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_in_stock: boolean;
  image: string | null;
  image_url: string | null;
  gallery_images: GalleryImage[];
  button_text: string;
  button_link: string;
  is_featured: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  category_name: string | null;
  colors: string[];
  sizes: string[];
  materials: string[];
  dimensions: string;
  weight: string;
  care_instructions: string;
  origin: string;
  artisan: ProductArtisan | null;
  artisan_bio: string;
  artisan_image: string;
  tags: string[];
  rating: number;
  review_count: number;
  is_active: boolean;
}

/** Maps a market_products row (selected with PRODUCT_SELECT) to the shape the pages render. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toMarketProduct(p: any): MarketProduct {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = ((p.product_gallery || []) as any[])
    .filter((g) => g.is_active)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const primary = gallery.find((g) => g.is_primary) || gallery[0] || null;
  const imageUrl: string | null = primary?.image_url || p.image_url || null;
  const a = p.artisans || null;

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description || '',
    sku: p.sku || '',
    price: parseFloat(p.price) || 0,
    discount_price: p.discount_price ? parseFloat(p.discount_price) : null,
    stock_quantity: parseInt(p.stock_quantity, 10) || 0,
    is_in_stock: p.is_in_stock,
    image: imageUrl,
    image_url: imageUrl,
    gallery_images: gallery.map((g) => ({
      id: g.id,
      image_url: g.image_url,
      alt_text: g.alt_text || '',
      is_primary: g.is_primary,
      order: g.sort_order,
    })),
    button_text: p.button_text || 'Shop Now',
    button_link: p.button_link || `/market/${p.slug}`,
    is_featured: p.is_featured,
    order: p.sort_order,
    created_at: p.created_at,
    updated_at: p.updated_at,
    category_id: p.category_id,
    category_name: p.market_categories?.name || null,
    colors: splitCsv(p.colors),
    sizes: splitCsv(p.sizes),
    materials: splitCsv(p.materials),
    dimensions: p.dimensions || '',
    weight: p.weight || '',
    care_instructions: p.care_instructions || '',
    origin: p.origin || '',
    artisan: a
      ? {
          id: a.id,
          name: a.name,
          slug: a.slug,
          bio: a.bio,
          profile_image: a.profile_image_url || null,
          location: a.location,
          craft_type: a.craft_type,
        }
      : null,
    artisan_bio: a?.bio || p.artisan_bio || '',
    artisan_image: a?.profile_image_url || p.artisan_image_url || '',
    tags: splitCsv(p.tags),
    rating: p.rating ? parseFloat(p.rating) : 0,
    review_count: p.review_count || 0,
    is_active: p.is_active,
  };
}

export interface MarketStats {
  total_products: number;
  active_products: number;
  featured_products: number;
  categories_count: number;
  artisans_count: number;
}

export interface MarketCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  product_count?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Category list and counters derived from the products, the same on server and client. */
export function buildMarketState(products: any[], categoryRows: any[]): { categories: MarketCategory[]; stats: MarketStats } {
  const categories = categoryRows.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    icon: cat.icon,
    product_count: products.filter((p) => p.category_id === cat.id).length,
  }));
  return {
    categories,
    stats: {
      total_products: products.length,
      active_products: products.filter((p) => p.is_in_stock).length,
      featured_products: products.filter((p) => p.is_featured).length,
      categories_count: categories.length,
      artisans_count: new Set(products.filter((p) => p.artisan).map((p) => p.artisan.id)).size,
    },
  };
}
