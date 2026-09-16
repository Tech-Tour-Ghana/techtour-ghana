'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPencil,
  faTrash,
  faTimes,
  faSpinner,
  faBox,
  faTags,
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '@/components/AdminLayout';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  category_id: string | null;
  artisan_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

type Tab = 'products' | 'categories';

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  title: '',
  slug: '',
  description: '',
  price: 0,
  currency: 'GHS',
  stock_quantity: 0,
  category_id: null,
  artisan_id: null,
  is_featured: false,
  is_active: true,
  sort_order: 0,
};

const EMPTY_CATEGORY: Omit<Category, 'id'> = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminMarketPage() {
  const { isDimMode } = useTheme();
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(EMPTY_PRODUCT);
  const [categoryForm, setCategoryForm] = useState<Omit<Category, 'id'>>(EMPTY_CATEGORY);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const supabase = createBrowserClient();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase.from('market_products').select('*').order('sort_order').order('title'),
      supabase.from('market_categories').select('*').order('sort_order').order('name'),
    ]);
    setProducts((prodRes.data ?? []) as Product[]);
    setCategories((catRes.data ?? []) as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openAddProduct() {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setModalOpen(true);
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p);
    setProductForm({
      title: p.title,
      slug: p.slug,
      description: p.description ?? '',
      price: p.price,
      currency: p.currency,
      stock_quantity: p.stock_quantity,
      category_id: p.category_id,
      artisan_id: p.artisan_id,
      is_featured: p.is_featured,
      is_active: p.is_active,
      sort_order: p.sort_order,
    });
    setModalOpen(true);
  }

  function openAddCategory() {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY);
    setModalOpen(true);
  }

  function openEditCategory(c: Category) {
    setEditingCategory(c);
    setCategoryForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
    setEditingCategory(null);
  }

  async function saveProduct() {
    setSaving(true);
    const payload = {
      ...productForm,
      description: productForm.description || undefined,
      currency: productForm.currency as 'GHS' | 'USD' | 'EUR' | 'GBP',
      category_id: productForm.category_id || null,
      artisan_id: productForm.artisan_id || null,
    };
    if (editingProduct) {
      await supabase.from('market_products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('market_products').insert(payload);
    }
    setSaving(false);
    closeModal();
    fetchAll();
  }

  async function saveCategory() {
    setSaving(true);
    const payload = { ...categoryForm, description: categoryForm.description || undefined };
    if (editingCategory) {
      await supabase.from('market_categories').update(payload).eq('id', editingCategory.id);
    } else {
      await supabase.from('market_categories').insert(payload);
    }
    setSaving(false);
    closeModal();
    fetchAll();
  }

  async function deleteProduct(id: string) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    await supabase.from('market_products').delete().eq('id', id);
    fetchAll();
  }

  async function deleteCategory(id: string) {
    if (!window.confirm('Delete this category? This cannot be undone.')) return;
    await supabase.from('market_categories').delete().eq('id', id);
    fetchAll();
  }

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2';
  const inputStyle = {
    background: themeStyles.inputBg,
    border: `1px solid ${themeStyles.inputBorder}`,
    color: themeStyles.textPrimary,
    '--tw-ring-color': BRAND_COLORS.tropicalTeal,
  } as React.CSSProperties;

  const Badge = ({ active }: { active: boolean }) => (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: active ? '#10B98122' : '#EF444422',
        color: active ? '#10B981' : '#EF4444',
      }}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const isProductModal = tab === 'products';

  return (
    <AdminLayout title="Market Products" subtitle="Manage products and categories">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          {(['products', 'categories'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
              style={{
                background: tab === t ? BRAND_COLORS.tropicalTeal : themeStyles.cardBg,
                color: tab === t ? '#FFFFFF' : themeStyles.textSecondary,
                border: `1px solid ${tab === t ? BRAND_COLORS.tropicalTeal : themeStyles.border}`,
              }}
            >
              <FontAwesomeIcon icon={t === 'products' ? faBox : faTags} className="w-3.5 h-3.5" />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: themeStyles.border }}>
            <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>
              {tab === 'products' ? 'Products' : 'Categories'}
            </h2>
            <button
              onClick={tab === 'products' ? openAddProduct : openAddCategory}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-90"
              style={{ background: BRAND_COLORS.tropicalTeal, color: '#FFFFFF' }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              Add New
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
            </div>
          ) : tab === 'products' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                    {['Title', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: themeStyles.border }}>
                  {products.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: themeStyles.textMuted }}>No products yet.</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{p.title}</td>
                      <td className="px-5 py-3" style={{ color: themeStyles.textSecondary }}>{p.currency} {Number(p.price).toFixed(2)}</td>
                      <td className="px-5 py-3" style={{ color: themeStyles.textSecondary }}>{p.stock_quantity}</td>
                      <td className="px-5 py-3"><Badge active={p.is_active} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditProduct(p)} className="p-1.5 rounded-md hover:opacity-80 transition" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-md hover:opacity-80 transition" style={{ background: '#EF444422', color: '#EF4444' }}>
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                    {['Name', 'Sort Order', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: themeStyles.border }}>
                  {categories.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-xs" style={{ color: themeStyles.textMuted }}>No categories yet.</td></tr>
                  ) : categories.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{c.name}</td>
                      <td className="px-5 py-3" style={{ color: themeStyles.textSecondary }}>{c.sort_order}</td>
                      <td className="px-5 py-3"><Badge active={c.is_active} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditCategory(c)} className="p-1.5 rounded-md hover:opacity-80 transition" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteCategory(c.id)} className="p-1.5 rounded-md hover:opacity-80 transition" style={{ background: '#EF444422', color: '#EF4444' }}>
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: themeStyles.border }}>
              <h3 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>
                {isProductModal
                  ? (editingProduct ? 'Edit Product' : 'Add Product')
                  : (editingCategory ? 'Edit Category' : 'Add Category')}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:opacity-70 transition" style={{ color: themeStyles.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {isProductModal ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Title</label>
                      <input
                        type="text"
                        value={productForm.title}
                        onChange={(e) => setProductForm((f) => ({ ...f, title: e.target.value, slug: toSlug(e.target.value) }))}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Slug</label>
                      <input
                        type="text"
                        value={productForm.slug}
                        onChange={(e) => setProductForm((f) => ({ ...f, slug: e.target.value }))}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Description</label>
                      <textarea
                        value={productForm.description ?? ''}
                        onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Currency</label>
                      <select
                        value={productForm.currency}
                        onChange={(e) => setProductForm((f) => ({ ...f, currency: e.target.value }))}
                        className={inputClass}
                        style={inputStyle}
                      >
                        <option value="GHS">GHS</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm((f) => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Category</label>
                      <select
                        value={productForm.category_id ?? ''}
                        onChange={(e) => setProductForm((f) => ({ ...f, category_id: e.target.value || null }))}
                        className={inputClass}
                        style={inputStyle}
                      >
                        <option value="">None</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_featured}
                          onChange={(e) => setProductForm((f) => ({ ...f, is_featured: e.target.checked }))}
                          className="rounded"
                          style={{ accentColor: BRAND_COLORS.tropicalTeal }}
                        />
                        <span className="text-xs" style={{ color: themeStyles.textSecondary }}>Featured</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_active}
                          onChange={(e) => setProductForm((f) => ({ ...f, is_active: e.target.checked }))}
                          className="rounded"
                          style={{ accentColor: BRAND_COLORS.tropicalTeal }}
                        />
                        <span className="text-xs" style={{ color: themeStyles.textSecondary }}>Active</span>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value, slug: toSlug(e.target.value) }))}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Slug</label>
                    <input
                      type="text"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Description</label>
                    <textarea
                      value={categoryForm.description ?? ''}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Sort Order</label>
                    <input
                      type="number"
                      value={categoryForm.sort_order}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(e) => setCategoryForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="rounded"
                      style={{ accentColor: BRAND_COLORS.tropicalTeal }}
                    />
                    <span className="text-xs" style={{ color: themeStyles.textSecondary }}>Active</span>
                  </label>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: themeStyles.border }}>
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
                style={{ background: themeStyles.inputBg, border: `1px solid ${themeStyles.inputBorder}`, color: themeStyles.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={isProductModal ? saveProduct : saveCategory}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND_COLORS.tropicalTeal, color: '#FFFFFF' }}
              >
                {saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
