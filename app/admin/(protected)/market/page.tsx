'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPencil,
  faTrash,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import AdminLayout from '@/components/AdminLayout';
import { Button, IconButton, Modal, SearchInput, StatusPill, TableCard, Tabs, Toolbar, confirmAction, reportError, rowClass } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

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
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
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
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
  };

  const supabase = useMemo(() => createBrowserClient(), []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase.from('market_products').select('*').order('sort_order').order('title'),
      supabase.from('market_categories').select('*').order('sort_order').order('name'),
    ]);
    setProducts((prodRes.data ?? []) as Product[]);
    setCategories((catRes.data ?? []) as Category[]);
    setLoading(false);
  }, [supabase]);

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
      if (reportError((await supabase.from('market_products').update(payload).eq('id', editingProduct.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('market_products').insert(payload)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    closeModal();
    fetchAll();
  }

  async function saveCategory() {
    setSaving(true);
    const payload = { ...categoryForm, description: categoryForm.description || undefined };
    if (editingCategory) {
      if (reportError((await supabase.from('market_categories').update(payload).eq('id', editingCategory.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('market_categories').insert(payload)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    closeModal();
    fetchAll();
  }

  async function deleteProduct(id: string) {
    if (!(await confirmAction({ message: 'Delete this product? This cannot be undone.', danger: true }))) return;
    if (reportError((await supabase.from('market_products').delete().eq('id', id)).error)) { return; }
    fetchAll();
  }

  async function deleteCategory(id: string) {
    if (!(await confirmAction({ message: 'Delete this category? This cannot be undone.', danger: true }))) return;
    if (reportError((await supabase.from('market_categories').delete().eq('id', id)).error)) { return; }
    fetchAll();
  }

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2';
  const inputStyle = {
    background: themeStyles.inputBg,
    border: `1px solid ${themeStyles.inputBorder}`,
    color: themeStyles.textPrimary,
    '--tw-ring-color': 'var(--adm-primary)',
  } as React.CSSProperties;

  const q = search.trim().toLowerCase();
  const visibleProducts = products.filter((p) => !q || p.title.toLowerCase().includes(q));
  const visibleCategories = categories.filter((c) => !q || c.name.toLowerCase().includes(q));

  const isProductModal = tab === 'products';

  return (
    <AdminLayout title="Market Products" subtitle="Manage products and categories">
      <Toolbar
        actions={
          <Button onClick={tab === 'products' ? openAddProduct : openAddCategory}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />{tab === 'products' ? 'Add product' : 'Add category'}
          </Button>
        }
      >
        <Tabs value={tab} onChange={(t) => { setTab(t); setSearch(''); }} tabs={[{ key: 'products' as Tab, label: 'Products', count: products.length }, { key: 'categories' as Tab, label: 'Categories', count: categories.length }]} />
        <SearchInput className="min-w-[12rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder={tab === 'products' ? 'Search products' : 'Search categories'} label="Search" />
      </Toolbar>

      {tab === 'products' ? (
        <TableCard
          loading={loading}
          empty={visibleProducts.length === 0}
          emptyTitle={products.length === 0 ? 'No products yet' : 'No products match'}
          emptyBody={products.length === 0 ? 'Add your first product to the marketplace.' : 'Try a different search.'}
          headers={['Product', 'Price', 'Stock', 'Status', '']}
        >
          {visibleProducts.map((p) => (
            <tr key={p.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{p.title}</td>
              <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{p.currency} {Number(p.price).toFixed(2)}</td>
              <td className="px-4 py-3">
                {p.stock_quantity <= 0 ? <StatusPill tone="danger">Out of stock</StatusPill>
                  : p.stock_quantity <= 5 ? <StatusPill tone="warning">{p.stock_quantity} left</StatusPill>
                  : <span className="text-xs" style={{ color: 'var(--adm-text-2)' }}>{p.stock_quantity}</span>}
              </td>
              <td className="px-4 py-3"><StatusPill tone={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => openEditProduct(p)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteProduct(p.id)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      ) : (
        <TableCard
          loading={loading}
          empty={visibleCategories.length === 0}
          emptyTitle={categories.length === 0 ? 'No categories yet' : 'No categories match'}
          emptyBody={categories.length === 0 ? 'Categories group products in the marketplace.' : 'Try a different search.'}
          headers={['Category', 'Sort order', 'Status', '']}
        >
          {visibleCategories.map((c) => (
            <tr key={c.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{c.name}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{c.sort_order}</td>
              <td className="px-4 py-3"><StatusPill tone={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => openEditCategory(c)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteCategory(c.id)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal title={isProductModal
                  ? (editingProduct ? 'Edit Product' : 'Add Product')
                  : (editingCategory ? 'Edit Category' : 'Add Category')} maxWidth="max-w-lg" onClose={() => closeModal()}
          footer={
            <>
              <Button variant="secondary" onClick={closeModal}>
Cancel
</Button>
              <Button onClick={isProductModal ? saveProduct : saveCategory} disabled={saving}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
</Button>
            
            </>
          }
        >
<div className="space-y-4">
            {/* Modal body */}
            <div className="space-y-4">
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
                          style={{ accentColor: 'var(--adm-primary)' }}
                        />
                        <span className="text-xs" style={{ color: themeStyles.textSecondary }}>Featured</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_active}
                          onChange={(e) => setProductForm((f) => ({ ...f, is_active: e.target.checked }))}
                          className="rounded"
                          style={{ accentColor: 'var(--adm-primary)' }}
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
                      style={{ accentColor: 'var(--adm-primary)' }}
                    />
                    <span className="text-xs" style={{ color: themeStyles.textSecondary }}>Active</span>
                  </label>
                </>
              )}
            </div>

            {/* Modal footer */}
            
          
</div>
        </Modal>
      )}
    </AdminLayout>
  );
}
