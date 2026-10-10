'use client';

// Product page body. Everything that needs the browser lives here (cart, sign-in
// state, wishlist, currency, theme); the page around it loads the product on the
// server so it can be indexed.

import Button from '@/components/ui/Button';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCheckCircle, faChevronLeft, faChevronRight, faGem, faHeart, faMapMarkerAlt, faMinus, faPlus,
  faShieldAlt, faShoppingCart, faStar, faStarHalfAlt, faTruck, faUndo, faUser,
} from '@fortawesome/free-solid-svg-icons';

import { CrumbLabel } from '@/components/SiteBreadcrumbs';
import { useCart } from '@/context/CartContext';
import { getAuthStatus, getWishlistProductIds, setWishlisted } from '@/lib/api';
import { CURRENCIES, useCurrencies, type Currency } from '@/lib/currency';
import { MARKET_COLORS, getColorSwatch, type MarketProduct } from './shared';

type Tab = 'details' | 'shipping' | 'artisan';

export default function ProductDetail({ product, related }: { product: MarketProduct; related: MarketProduct[] }) {
  const { addItem, getItemCount, openCart } = useCart();
  const router = useRouter();

  const [dim, setDim] = useState(false);
  const [pickedCurrency, setCurrency] = useState<Currency>(CURRENCIES[0]!);
  const { currencies: liveCurrencies } = useCurrencies();
  const currency = liveCurrencies.find((c) => c.code === pickedCurrency.code) ?? pickedCurrency;
  const [signedIn, setSignedIn] = useState(false);
  const [wishlisted, setWishlistedState] = useState(false);
  const [index, setIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('details');
  const [showAllText, setShowAllText] = useState(false);
  const [notice, setNotice] = useState<{ text: string; login?: boolean } | null>(null);

  const c = dim ? MARKET_COLORS.dark : MARKET_COLORS.light;
  const accent = dim ? c.primary : '#139EA2';

  useEffect(() => {
    const read = () => { const t = document.documentElement.getAttribute('data-theme'); setDim(t === 'dim' || t === 'dark'); };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('selectedCurrency') ?? 'null');
      const found = CURRENCIES.find((x) => x.code === saved?.code);
      if (found) setCurrency(found);
    } catch { /* a bad saved value just means the default currency */ }
    const onChange = (e: Event) => setCurrency((e as CustomEvent).detail.currency);
    window.addEventListener('currencyChanged', onChange);
    return () => window.removeEventListener('currencyChanged', onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAuthStatus().then(async (auth) => {
      if (cancelled) return;
      setSignedIn(auth.is_authenticated);
      if (auth.is_authenticated) {
        const ids = await getWishlistProductIds();
        if (!cancelled) setWishlistedState(ids.includes(product.id));
      }
    }).catch(() => setSignedIn(false));
    return () => { cancelled = true; };
  }, [product.id]);

  const images = useMemo(() => {
    const list = product.gallery_images.filter((g) => g.image_url).map((g) => ({ url: g.image_url, alt: g.alt_text || product.title }));
    if (list.length) return list;
    return [{ url: product.image_url || '/placeholder-product.svg', alt: product.title }];
  }, [product]);

  const money = (n: number) => `${currency.symbol}${(n * currency.rate).toFixed(2)}`;
  const onSale = product.discount_price !== null && product.discount_price < product.price;
  const percentOff = onSale ? Math.round(((product.price - product.discount_price!) / product.price) * 100) : 0;
  const inCart = getItemCount(product.id as unknown as number) > 0;
  const maxQty = product.stock_quantity > 0 ? product.stock_quantity : 1;

  const need = (): string | null => {
    if (product.colors.length && !color) return 'Please choose a colour.';
    if (product.sizes.length && !size) return 'Please choose a size.';
    return null;
  };

  const add = useCallback((thenOpenCart: boolean) => {
    if (!signedIn) { setNotice({ text: 'Please sign in to add items to your cart.', login: true }); return; }
    const missing = need();
    if (missing) { setNotice({ text: missing }); return; }
    addItem({
      id: product.id,
      product_id: product.id,
      title: product.title,
      price: product.price,
      discount_price: product.discount_price ?? undefined,
      image_url: product.image_url ?? undefined,
      quantity,
      selectedColor: color ?? undefined,
      selectedSize: size ?? undefined,
      variant_key: `${product.id}_${color ?? 'any'}_${size ?? 'any'}`,
    } as never);
    setNotice({ text: `${product.title} was added to your cart.` });
    if (thenOpenCart) openCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, color, size, quantity, product, addItem, openCart]);

  async function toggleWishlist() {
    if (!signedIn) { setNotice({ text: 'Please sign in to save items to your wishlist.', login: true }); return; }
    const next = !wishlisted;
    setWishlistedState(next);
    if (!(await setWishlisted(product.id, next))) setWishlistedState(!next);
  }

  const card: React.CSSProperties = { background: c.backgroundCard, border: `1px solid ${c.border}`, borderRadius: 16 };
  const chip = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? accent : c.border}`,
    background: active ? (dim ? 'rgba(230,166,77,0.15)' : c.primaryLight) : 'transparent',
    color: c.textPrimary,
  });

  const stars = (value: number) => [...Array(5)].map((_, i) => (
    <FontAwesomeIcon key={i} icon={i < Math.floor(value) ? faStar : i < value ? faStarHalfAlt : faStar} className="h-3.5 w-3.5" style={{ color: i < Math.ceil(value) ? '#F59E0B' : c.border }} />
  ));

  const facts = [
    ['Materials', product.materials.join(', ')],
    ['Dimensions', product.dimensions],
    ['Weight', product.weight],
    ['Care', product.care_instructions],
    ['Origin', product.origin],
    ['SKU', product.sku],
  ].filter(([, v]) => v);

  const longText = product.description.length > 220;
  const shownText = longText && !showAllText ? `${product.description.slice(0, 220).trimEnd()}…` : product.description;

  return (
    <div className="min-h-screen" style={{ background: c.background, color: c.textPrimary }}>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <CrumbLabel label={product.title} />
        <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push('/market'))}
          className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80"
          style={{ border: `1px solid ${c.border}`, color: c.textSecondary, background: c.backgroundCard }}>
          <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Gallery */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row" style={{ ...card, padding: 12 }}>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto sm:max-h-[480px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
                {images.map((img, i) => (
                  <button key={img.url + i} type="button" onClick={() => setIndex(i)} aria-label={`Show image ${i + 1}`} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
                    style={{ border: `2px solid ${i === index ? accent : 'transparent'}`, opacity: i === index ? 1 : 0.7 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative min-h-[18rem] flex-1 overflow-hidden rounded-xl sm:min-h-[26rem]" style={{ background: c.backgroundAlt }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[index]!.url} alt={images[index]!.alt} className="absolute inset-0 h-full w-full object-cover" />
              {onSale && <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: c.secondary }}>-{percentOff}%</span>}
              {images.length > 1 && (
                <>
                  <button type="button" aria-label="Previous image" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow">
                    <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" aria-label="Next image" onClick={() => setIndex((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow">
                    <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Buy box */}
          <div className="space-y-4">
            <div style={{ ...card, padding: 20 }}>
              {product.rating > 0 && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex gap-0.5">{stars(product.rating)}</span>
                  <span className="text-xs" style={{ color: c.textMuted }}>{product.rating.toFixed(1)} ({product.review_count})</span>
                </div>
              )}
              <h1 className="text-xl font-bold leading-snug sm:text-2xl">{product.title}</h1>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold" style={{ color: onSale ? c.secondary : accent }}>{money(onSale ? product.discount_price! : product.price)}</span>
                {onSale && <span className="text-sm line-through" style={{ color: c.textMuted }}>{money(product.price)}</span>}
                <select aria-label="Currency" value={currency.code} onChange={(e) => {
                    const next = liveCurrencies.find((x) => x.code === e.target.value);
                    if (!next) return;
                    setCurrency(next);
                    try { localStorage.setItem('selectedCurrency', JSON.stringify(next)); window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: next } })); } catch { /* storage blocked */ }
                  }}
                  className="ml-auto rounded-lg px-2 py-1 text-xs" style={{ border: `1px solid ${c.border}`, background: c.backgroundCard, color: c.textSecondary }}>
                  {liveCurrencies.map((x) => <option key={x.code} value={x.code}>{x.symbol} {x.code}</option>)}
                </select>
              </div>
              {currency.code !== 'GHS' && <p className="mt-1 text-[11px]" style={{ color: c.textMuted }}>Approximate price. You are charged in Ghana cedis (₵{(onSale ? product.discount_price! : product.price).toFixed(2)}). <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">Rates By Exchange Rate API</a></p>}

              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" disabled={!product.is_in_stock} onClick={() => add(false)} icon={faShoppingCart} className="min-w-[8rem] flex-1" style={{ color: accent }}>
                  {product.is_in_stock ? (inCart ? 'Add another' : 'Add to cart') : 'Out of stock'}
                </Button>
                <Button disabled={!product.is_in_stock} onClick={() => add(true)} className="min-w-[8rem] flex-1" style={{ background: accent, color: dim ? '#0A0A0A' : '#fff' }}>
                  Buy it now
                </Button>
                <button type="button" onClick={toggleWishlist} aria-pressed={wishlisted} aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ border: `1px solid ${c.border}`, color: wishlisted ? '#EF4444' : c.textMuted }}>
                  <FontAwesomeIcon icon={faHeart} />
                </button>
              </div>
              {notice && (
                <p role="status" className="mt-3 text-sm" style={{ color: c.textSecondary }}>
                  {notice.text}{' '}
                  {notice.login && <Link href="/auth/login" className="font-semibold underline" style={{ color: accent }}>Sign in</Link>}
                </p>
              )}

              <hr className="my-5" style={{ borderColor: c.border }} />

              {product.colors.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-semibold">Colour{color && <span className="font-normal" style={{ color: c.textMuted }}>: {color}</span>}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((name) => (
                      <button key={name} type="button" title={name} aria-label={name} aria-pressed={color === name} onClick={() => setColor(name)}
                        className="h-8 w-8 rounded-full" style={{ background: getColorSwatch(name), outline: color === name ? `2px solid ${accent}` : `1px solid ${c.border}`, outlineOffset: 2 }} />
                    ))}
                  </div>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-semibold">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className="rounded-lg px-3 py-1.5 text-sm" style={chip(size === s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm font-semibold">Quantity</span>
                <div className="flex items-center rounded-lg" style={{ border: `1px solid ${c.border}` }}>
                  <button type="button" aria-label="Decrease quantity" className="h-9 w-9" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><FontAwesomeIcon icon={faMinus} className="h-3 w-3" /></button>
                  <span className="w-8 text-center text-sm" aria-live="polite">{quantity}</span>
                  <button type="button" aria-label="Increase quantity" className="h-9 w-9" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}><FontAwesomeIcon icon={faPlus} className="h-3 w-3" /></button>
                </div>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: c.textSecondary }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: product.is_in_stock ? '#22c55e' : '#ef4444' }} />
                  {product.is_in_stock ? (product.stock_quantity > 0 && product.stock_quantity <= 10 ? `Only ${product.stock_quantity} left` : 'In stock') : 'Out of stock'}
                </span>
              </div>

              <p className="mb-4 flex items-center gap-2 text-sm" style={{ color: c.textSecondary }}>
                <FontAwesomeIcon icon={faTruck} style={{ color: accent }} />Ships from Accra, Ghana. Delivery in 3-7 business days.
              </p>

              {product.description && (
                <div>
                  <p className="mb-1 text-sm font-semibold">Description</p>
                  <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: c.textSecondary }}>{shownText}</p>
                  {longText && (
                    <button type="button" onClick={() => setShowAllText((v) => !v)} className="mt-1 text-sm font-semibold underline" style={{ color: accent }}>
                      {showAllText ? 'Show less' : 'See full description'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {product.artisan && (
              <div className="flex items-center gap-3" style={{ ...card, padding: 16 }}>
                {product.artisan.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.artisan.profile_image} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: c.primaryLight, color: accent }}><FontAwesomeIcon icon={faUser} /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs" style={{ color: c.textMuted }}>Made by</p>
                  <p className="truncate text-sm font-semibold">{product.artisan.name}</p>
                  {product.artisan.location && <p className="truncate text-xs" style={{ color: c.textMuted }}><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />{product.artisan.location}</p>}
                </div>
                <Link href={`/market/artisans/${product.artisan.slug}`} className="text-xs font-semibold" style={{ color: accent }}>View profile</Link>
              </div>
            )}
          </div>
        </div>

        {/* Details, shipping, artisan */}
        <div className="mt-6" style={{ ...card, padding: 20 }}>
          <div role="tablist" className="mb-4 flex gap-1 border-b" style={{ borderColor: c.border }}>
            {(['details', 'shipping', 'artisan'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className="px-4 py-2 text-sm font-semibold capitalize"
                style={{ color: tab === t ? accent : c.textMuted, borderBottom: `2px solid ${tab === t ? accent : 'transparent'}`, marginBottom: -1 }}>
                {t}
              </button>
            ))}
          </div>
          {tab === 'details' && (
            <div className="space-y-2 text-sm" style={{ color: c.textSecondary }}>
              {facts.length === 0 && !product.tags.length && <p>No extra details for this product yet.</p>}
              {facts.map(([k, v]) => <p key={k}><strong style={{ color: c.textPrimary }}>{k}:</strong> {v}</p>)}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.tags.map((t) => <span key={t} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: c.backgroundAlt }}>#{t}</span>)}
                </div>
              )}
            </div>
          )}
          {tab === 'shipping' && (
            <ul className="space-y-3 text-sm" style={{ color: c.textSecondary }}>
              <li className="flex items-center gap-2"><FontAwesomeIcon icon={faTruck} style={{ color: accent }} />Free shipping on orders over {money(200)}</li>
              <li className="flex items-center gap-2"><FontAwesomeIcon icon={faShieldAlt} style={{ color: accent }} />Secure payment with SSL encryption</li>
              <li className="flex items-center gap-2"><FontAwesomeIcon icon={faUndo} style={{ color: accent }} />30-day money-back guarantee</li>
              <li>Shipping from Accra, Ghana. Estimated delivery 3-7 business days.</li>
            </ul>
          )}
          {tab === 'artisan' && (
            product.artisan || product.artisan_bio ? (
              <div className="space-y-3 text-sm" style={{ color: c.textSecondary }}>
                {product.artisan && <p className="font-semibold" style={{ color: c.textPrimary }}>{product.artisan.name}{product.artisan.craft_type && <span className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: c.primaryLight, color: accent }}>{product.artisan.craft_type}</span>}</p>}
                {product.artisan_bio && <p className="leading-relaxed">{product.artisan_bio}</p>}
                <p className="flex flex-wrap gap-4">
                  <span><FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" style={{ color: accent }} />Verified artisan</span>
                  <span><FontAwesomeIcon icon={faGem} className="mr-1.5" style={{ color: accent }} />Handcrafted</span>
                </p>
              </div>
            ) : <p className="text-sm" style={{ color: c.textSecondary }}>Handcrafted by skilled Ghanaian artisans.</p>
          )}
        </div>

        {related.length > 0 && (
          <section className="mt-6" style={{ ...card, padding: 20 }} aria-labelledby="similar">
            <h2 id="similar" className="mb-4 text-sm font-semibold">Similar items</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((r) => (
                <Link key={r.id} href={`/market/${r.slug}`} className="group block overflow-hidden rounded-xl" style={{ border: `1px solid ${c.border}` }}>
                  <div className="aspect-[4/3] overflow-hidden" style={{ background: c.backgroundAlt }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image_url || '/placeholder-product.svg'} alt={r.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-medium">{r.title}</p>
                    <p className="text-sm font-bold" style={{ color: accent }}>{money(r.discount_price !== null && r.discount_price < r.price ? r.discount_price : r.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
