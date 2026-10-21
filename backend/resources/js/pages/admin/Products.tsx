import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import ConfirmDialog, { PromptDialog } from '@/components/shared/Ui';
import DataTable from '@/components/shared/DataTable';
import MediaUploadInput from '@/components/shared/MediaUploadInput';
import { CheckCircle, ChevronLeft, ChevronRight, Star, XCircle, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Product {
    id: string;
    slug?: string;
    name: string;
    sku?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    price: number;
    compare_price?: number | null;
    currency?: string;
    tax_rate?: number;
    discount_percent?: number;
    featured?: boolean;
    publication_state?: string;
    specifications?: Record<string, string> | null;
    attributes?: Record<string, string> | null;
    shipping?: Record<string, unknown> | null;
    image_url?: string | null;
    images?: string[] | null;
    video_url?: string | null;
    stock_quantity: number;
    is_active?: boolean;
    status?: string;
    approved_at?: string | null;
    created_at: string;
    vendor?: { id: string; store_name: string };
    variants?: { id?: string; name: string; sku?: string; price: number; stock_quantity: number }[];
}

interface VendorOption {
    id: string;
    store_name: string;
}

interface VariantRow {
    name: string;
    sku: string;
    price: string;
    stock_quantity: string;
}

interface ProductForm {
    vendor_id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    subcategory: string;
    sku: string;
    price: string;
    compare_price: string;
    currency: string;
    tax_rate: string;
    discount_percent: string;
    stock_quantity: string;
    is_active: boolean;
    featured: boolean;
    publication_state: string;
    image_url: string;
    video_url: string;
    imagesText: string;
    specificationsText: string;
    attributesText: string;
    shipping_weight: string;
    shipping_length: string;
    shipping_width: string;
    shipping_height: string;
    shipping_free: boolean;
    variants: VariantRow[];
}

const emptyForm: ProductForm = {
    vendor_id: '',
    name: '',
    slug: '',
    description: '',
    category: '',
    subcategory: '',
    sku: '',
    price: '',
    compare_price: '',
    currency: 'USD',
    tax_rate: '0',
    discount_percent: '0',
    stock_quantity: '0',
    is_active: true,
    featured: false,
    publication_state: 'published',
    image_url: '',
    video_url: '',
    imagesText: '',
    specificationsText: '',
    attributesText: '',
    shipping_weight: '',
    shipping_length: '',
    shipping_width: '',
    shipping_height: '',
    shipping_free: false,
    variants: [],
};

// Spec 37 helpers: "key=value" lines -> object, URL lines -> array.
const parseKeyValues = (text: string): Record<string, string> | undefined => {
    const out: Record<string, string> = {};
    for (const line of text.split('\n')) {
        const idx = line.indexOf('=');
        if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return Object.keys(out).length ? out : undefined;
};

const parseUrls = (text: string): string[] | undefined => {
    const urls = text.split('\n').map((l) => l.trim()).filter(Boolean);
    return urls.length ? urls : undefined;
};

const keyValuesToText = (data?: Record<string, string> | null): string =>
    data ? Object.entries(data).map(([k, v]) => `${k}=${v}`).join('\n') : '';

const labelizeStatus = (p: Product): string =>
    p.status ?? (p.approved_at ? 'approved' : 'pending');

export default function AdminProducts() {
    const permissions =
        (usePage().props.auth as { permissions?: string[] } | null)?.permissions ?? [];
    const canCreate = permissions.includes('*') || permissions.includes('products.products.create') || permissions.includes('products.products.manage');
    const canUpdate = permissions.includes('*') || permissions.includes('products.products.update') || permissions.includes('products.products.manage');
    const canDelete = permissions.includes('*') || permissions.includes('products.products.delete');
    const canApprove = permissions.includes('*') || permissions.includes('products.products.approve');

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [rejectFor, setRejectFor] = useState<Product | null>(null);
    const [archiveFor, setArchiveFor] = useState<Product | null>(null);

    // Create/edit dialog state (null = closed, 'new' or a product = edit).
    const [formTarget, setFormTarget] = useState<'new' | Product | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [vendors, setVendors] = useState<VendorOption[]>([]);
    const [saving, setSaving] = useState(false);

    const loadProducts = useCallback(() => {
        const endpoint =
            statusFilter === 'pending'
                ? '/api/admin/products/pending'
                : '/api/products?per_page=50';
        api.get<{ data: Product[] }>(endpoint)
            .then((res) => setProducts(res.data ?? []))
            .catch((e) => {
                setProducts([]);
                toast.error(errorMessage(e, 'Failed to load products'));
            })
            .finally(() => setLoading(false));
    }, [statusFilter]);

    useEffect(() => {
        setLoading(true);
        loadProducts();
    }, [loadProducts]);

    const approveProduct = async (id: string): Promise<boolean> => {
        try {
            await api.post(`/api/admin/products/${id}/approve`);
            setProducts(products.map((p) => p.id === id ? { ...p, status: 'approved', approved_at: new Date().toISOString() } : p));
            toast.success('Product approved.');
            return true;
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to approve product'));
            return false;
        }
    };

    const rejectProduct = async (id: string, reason: string): Promise<boolean> => {
        try {
            await api.post(`/api/admin/products/${id}/reject`, { reason: reason || null });
            setProducts(products.map((p) => p.id === id ? { ...p, status: 'rejected' } : p));
            toast.success('Product rejected.');
            return true;
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to reject product'));
            return false;
        }
    };

    const openCreate = async () => {
        setForm(emptyForm);
        setFormTarget('new');
        if (vendors.length === 0) {
            try {
                const res = await api.get<{ data: VendorOption[] }>('/api/admin/vendors?per_page=100');
                setVendors(res.data ?? []);
            } catch {
                setVendors([]);
            }
        }
    };

    const openEdit = (p: Product) => {
        const shipping = (p.shipping ?? {}) as {
            weight_kg?: number | string;
            length_cm?: number | string;
            width_cm?: number | string;
            height_cm?: number | string;
            free_shipping?: boolean;
        };
        setForm({
            vendor_id: p.vendor?.id ?? '',
            name: p.name,
            slug: p.slug ?? '',
            description: p.description ?? '',
            category: p.category ?? '',
            subcategory: p.subcategory ?? '',
            sku: p.sku ?? '',
            price: String(p.price),
            compare_price: p.compare_price != null ? String(p.compare_price) : '',
            currency: p.currency ?? 'USD',
            tax_rate: String(p.tax_rate ?? 0),
            discount_percent: String(p.discount_percent ?? 0),
            stock_quantity: String(p.stock_quantity),
            is_active: p.is_active !== false,
            featured: p.featured === true,
            publication_state: p.publication_state ?? 'published',
            image_url: p.image_url ?? '',
            video_url: p.video_url ?? '',
            imagesText: (p.images ?? []).join('\n'),
            specificationsText: keyValuesToText(p.specifications),
            attributesText: keyValuesToText(p.attributes),
            shipping_weight: shipping.weight_kg != null ? String(shipping.weight_kg) : '',
            shipping_length: shipping.length_cm != null ? String(shipping.length_cm) : '',
            shipping_width: shipping.width_cm != null ? String(shipping.width_cm) : '',
            shipping_height: shipping.height_cm != null ? String(shipping.height_cm) : '',
            shipping_free: shipping.free_shipping === true,
            variants: (p.variants ?? []).map((v) => ({
                name: v.name,
                sku: v.sku ?? '',
                price: String(v.price),
                stock_quantity: String(v.stock_quantity ?? 0),
            })),
        });
        setFormTarget(p);
    };

    const closeForm = () => {
        setFormTarget(null);
        setForm(emptyForm);
    };

    const saveForm = async () => {
        if (!formTarget) return;
        if (!form.name.trim() || !form.category.trim() || form.price === '') {
            toast.error('Name, category and price are required.');
            return;
        }
        if (formTarget === 'new' && !form.vendor_id) {
            toast.error('Pick a vendor for the new product.');
            return;
        }

        const specifications = parseKeyValues(form.specificationsText);
        const attributes = parseKeyValues(form.attributesText);
        const images = parseUrls(form.imagesText);
        const shipping =
            form.shipping_weight || form.shipping_length || form.shipping_width || form.shipping_height || form.shipping_free
                ? {
                      weight_kg: form.shipping_weight ? Number(form.shipping_weight) : undefined,
                      length_cm: form.shipping_length ? Number(form.shipping_length) : undefined,
                      width_cm: form.shipping_width ? Number(form.shipping_width) : undefined,
                      height_cm: form.shipping_height ? Number(form.shipping_height) : undefined,
                      free_shipping: form.shipping_free,
                  }
                : undefined;
        const variants = form.variants
            .filter((v) => v.name.trim())
            .map((v) => ({
                name: v.name.trim(),
                sku: v.sku.trim() || undefined,
                price: Number(v.price) || 0,
                stock_quantity: Number(v.stock_quantity) || 0,
            }));

        const payload: Record<string, unknown> = {
            name: form.name.trim(),
            slug: form.slug.trim() || undefined,
            description: form.description.trim() || undefined,
            category: form.category.trim(),
            subcategory: form.subcategory.trim() || undefined,
            sku: form.sku.trim() || undefined,
            price: Number(form.price),
            compare_price: form.compare_price === '' ? undefined : Number(form.compare_price),
            currency: form.currency,
            tax_rate: Number(form.tax_rate) || 0,
            discount_percent: Number(form.discount_percent) || 0,
            featured: form.featured,
            publication_state: form.publication_state,
            specifications,
            attributes,
            shipping,
            image_url: form.image_url.trim() || undefined,
            video_url: form.video_url.trim() || undefined,
            images,
            stock_quantity: Number(form.stock_quantity) || 0,
            variants: variants.length ? variants : [],
        };

        setSaving(true);
        try {
            if (formTarget === 'new') {
                await api.post('/api/products', { vendor_id: form.vendor_id, ...payload });
                toast.success('Product created.');
            } else {
                await api.put(`/api/products/${formTarget.id}`, {
                    ...payload,
                    is_active: form.publication_state === 'published',
                });
                toast.success('Product updated.');
            }
            closeForm();
            loadProducts();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to save product'));
        } finally {
            setSaving(false);
        }
    };

    const archiveProduct = async (id: string) => {
        try {
            await api.del(`/api/products/${id}`);
            toast.success('Product archived.');
            loadProducts();
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to archive product'));
        }
    };

    const field =
        'w-full rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:text-white';

    // L-H-7: visual gallery manager. `imagesText` stays the single source of
    // truth (one URL per line) so payload building is untouched; the manager
    // just edits that list: append, reorder, remove and promote to main.
    const galleryUrls = parseUrls(form.imagesText) ?? [];
    const setGalleryUrls = (urls: string[]) =>
        setForm((f) => ({ ...f, imagesText: urls.join('\n') }));

    const addGalleryUrl = (url: string) => {
        const clean = url.trim();
        if (clean !== '' && !galleryUrls.includes(clean)) {
            setGalleryUrls([...galleryUrls, clean]);
        }
    };

    const removeGalleryUrl = (index: number) =>
        setGalleryUrls(galleryUrls.filter((_, i) => i !== index));

    const moveGalleryUrl = (index: number, delta: -1 | 1) => {
        const target = index + delta;
        if (target < 0 || target >= galleryUrls.length) return;
        const next = [...galleryUrls];
        [next[index], next[target]] = [next[target], next[index]];
        setGalleryUrls(next);
    };

    const promoteToMain = (index: number) => {
        const url = galleryUrls[index];
        if (!url) return;
        const next = [...galleryUrls];
        if (form.image_url.trim() !== '') {
            next[index] = form.image_url.trim();
        } else {
            next.splice(index, 1);
        }
        setForm((f) => ({ ...f, image_url: url, imagesText: next.join('\n') }));
        toast.success('Promoted to main image.');
    };

    return (
        <AdminLayout title="Manage Products">
            <Head title="Manage Products" />

            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Products</h1>
                    {canCreate && (
                        <button
                            onClick={() => void openCreate()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" /> Add Product
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map((s) => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                            statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'
                        }`}>{s}</button>
                    ))}
                </div>

                <DataTable
                    columns={[
                        {
                            key: 'name', header: 'Product', accessor: 'name', sortable: true,
                            render: (p) => (
                                <>
                                    <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.category}</p>
                                </>
                            ),
                        },
                        {
                            key: 'vendor', header: 'Vendor',
                            render: (p) => <span className="text-sm text-gray-500">{p.vendor?.store_name}</span>,
                        },
                        {
                            key: 'price', header: 'Price', accessor: 'price', sortable: true,
                            render: (p) => <>{formatCurrency(p.price)}</>,
                        },
                        { key: 'stock', header: 'Stock', accessor: 'stock_quantity', sortable: true },
                        {
                            key: 'status', header: 'Status',
                            render: (p) => {
                                const status = labelizeStatus(p);
                                const state = p.publication_state && p.publication_state !== 'published' ? p.publication_state : null;
                                const badge = status === 'pending' || status === 'rejected' ? status : (state ?? status);
                                return (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        badge === 'approved' || badge === 'published' ? 'bg-green-100 text-green-800'
                                            : badge === 'rejected' ? 'bg-red-100 text-red-800'
                                            : badge === 'archived' ? 'bg-gray-200 text-gray-700'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>{badge}</span>
                                );
                            },
                        },
                        {
                            key: 'actions', header: 'Actions',
                            render: (p) => {
                                const status = labelizeStatus(p);
                                return (
                                    <div className="flex gap-2">
                                        <a href={`/products/${p.slug ?? p.id}`} target="_blank" className="text-gray-400 hover:text-gray-600" title="View"><Eye className="h-4 w-4" /></a>
                                        {status === 'pending' && canApprove && (
                                            <>
                                                <button onClick={() => void approveProduct(p.id)} className="text-green-600 hover:text-green-800" title="Approve"><CheckCircle className="h-4 w-4" /></button>
                                                <button onClick={() => setRejectFor(p)} className="text-red-600 hover:text-red-800" title="Reject"><XCircle className="h-4 w-4" /></button>
                                            </>
                                        )}
                                        {canUpdate && (
                                            <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800" title="Edit"><Pencil className="h-4 w-4" /></button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => setArchiveFor(p)} className="text-red-600 hover:text-red-800" title="Archive"><Trash2 className="h-4 w-4" /></button>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={products}
                    loading={loading}
                    emptyTitle="No products"
                    emptyDescription="No products match this filter."
                />

                <PromptDialog
                    open={rejectFor !== null}
                    title={`Reject ${rejectFor?.name ?? 'product'}`}
                    placeholder="Reason for rejection..."
                    confirmLabel="Reject"
                    danger
                    onSubmit={(reason) => {
                        const target = rejectFor;
                        if (!target) return;
                        // Close only after the request succeeds so a failure
                        // keeps the dialog open with the error toast.
                        void rejectProduct(target.id, reason).then((ok) => {
                            if (ok) setRejectFor(null);
                        });
                    }}
                    onCancel={() => setRejectFor(null)}
                />

                <ConfirmDialog
                    open={archiveFor !== null}
                    title={`Archive ${archiveFor?.name ?? 'product'}?`}
                    description="The product is taken off the marketplace (is_active = false). You can bring it back from the edit dialog."
                    confirmLabel="Archive"
                    danger
                    onConfirm={() => {
                        const target = archiveFor;
                        setArchiveFor(null);
                        if (target) void archiveProduct(target.id);
                    }}
                    onCancel={() => setArchiveFor(null)}
                />

                {formTarget !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
                        <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-start justify-between">
                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    {formTarget === 'new' ? 'Add Product' : `Edit ${formTarget.name}`}
                                </h2>
                                <button onClick={closeForm} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                                {formTarget === 'new' && (
                                    <div>
                                        <label htmlFor="product-vendor" className="mb-1 block text-xs font-medium text-gray-500">Vendor</label>
                                        <select
                                            id="product-vendor"
                                            value={form.vendor_id}
                                            onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                                            className={field}
                                        >
                                            <option value="">Select vendor...</option>
                                            {vendors.map((v) => (
                                                <option key={v.id} value={v.id}>{v.store_name}</option>
                                            ))}
                                        </select>
                                        {vendors.length === 0 && (
                                            <p className="mt-1 text-xs text-amber-600">No vendors loaded — save will fail until vendors exist.</p>
                                        )}
                                    </div>
                                )}

                                {/* Publication state + featured (spec 37) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="product-state" className="mb-1 block text-xs font-medium text-gray-500">Publication state</label>
                                        <select
                                            id="product-state"
                                            value={form.publication_state}
                                            onChange={(e) => setForm({ ...form, publication_state: e.target.value })}
                                            className={field}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="hidden">Hidden</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-1.5">
                                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={form.featured}
                                                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            Featured product
                                        </label>
                                    </div>
                                </div>

                                {/* Basic info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="product-name" className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
                                        <input id="product-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="product-slug" className="mb-1 block text-xs font-medium text-gray-500">Slug</label>
                                        <input id="product-slug" placeholder="auto from name" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="product-sku" className="mb-1 block text-xs font-medium text-gray-500">SKU</label>
                                        <input id="product-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="product-subcategory" className="mb-1 block text-xs font-medium text-gray-500">Subcategory</label>
                                        <input id="product-subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className={field} />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="product-category" className="mb-1 block text-xs font-medium text-gray-500">Category *</label>
                                    <input id="product-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field} />
                                </div>
                                <div>
                                    <label htmlFor="product-description" className="mb-1 block text-xs font-medium text-gray-500">Description</label>
                                    <textarea id="product-description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} />
                                </div>

                                {/* Pricing (spec 37: price, comparison price, currency, tax, discount) */}
                                <div className="grid grid-cols-5 gap-3">
                                    <div>
                                        <label htmlFor="product-price" className="mb-1 block text-xs font-medium text-gray-500">Price *</label>
                                        <input id="product-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="product-compare" className="mb-1 block text-xs font-medium text-gray-500">Compare at</label>
                                        <input id="product-compare" type="number" min="0" step="0.01" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="product-currency" className="mb-1 block text-xs font-medium text-gray-500">Currency</label>
                                        <select id="product-currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={field}>
                                            {['USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'ZAR'].map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="product-tax" className="mb-1 block text-xs font-medium text-gray-500">Tax %</label>
                                        <input id="product-tax" type="number" min="0" max="100" step="0.5" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="product-discount" className="mb-1 block text-xs font-medium text-gray-500">Discount %</label>
                                        <input id="product-discount" type="number" min="0" max="100" step="0.5" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className={field} />
                                    </div>
                                </div>

                                {/* Stock + visibility */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="product-stock" className="mb-1 block text-xs font-medium text-gray-500">Stock *</label>
                                        <input id="product-stock" type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className={field} />
                                    </div>
                                </div>

                                {/* Media (images + gallery) */}
                                <MediaUploadInput
                                    kind="image"
                                    value={form.image_url}
                                    onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                                    folder="products"
                                    label="Main image"
                                    uploadTestId="admin-product-image"
                                    hint="Upload from this device (auto-compressed) or paste a link."
                                />
                                <div className="space-y-2" data-testid="admin-product-gallery">
                                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Gallery ({galleryUrls.length})
                                    </span>
                                    {galleryUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {galleryUrls.map((url, i) => (
                                                <div
                                                    key={`${url}-${i}`}
                                                    data-testid={`admin-gallery-item-${i}`}
                                                    className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted"
                                                >
                                                    <img src={url} alt={`Gallery image ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-1 py-0.5">
                                                        <button
                                                            type="button"
                                                            aria-label={`Move image ${i + 1} left`}
                                                            data-testid={`admin-gallery-left-${i}`}
                                                            disabled={i === 0}
                                                            onClick={() => moveGalleryUrl(i, -1)}
                                                            className="rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-30"
                                                        >
                                                            <ChevronLeft className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-label={`Set image ${i + 1} as main`}
                                                            data-testid={`admin-gallery-main-${i}`}
                                                            onClick={() => promoteToMain(i)}
                                                            className="rounded p-0.5 text-white hover:bg-white/20"
                                                        >
                                                            <Star className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-label={`Move image ${i + 1} right`}
                                                            data-testid={`admin-gallery-right-${i}`}
                                                            disabled={i === galleryUrls.length - 1}
                                                            onClick={() => moveGalleryUrl(i, 1)}
                                                            className="rounded p-0.5 text-white hover:bg-white/20 disabled:opacity-30"
                                                        >
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-label={`Remove image ${i + 1}`}
                                                            data-testid={`admin-gallery-remove-${i}`}
                                                            onClick={() => removeGalleryUrl(i)}
                                                            className="rounded p-0.5 text-white hover:bg-red-500/70"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <MediaUploadInput
                                        kind="image"
                                        value=""
                                        onChange={(url) => addGalleryUrl(url)}
                                        folder="products"
                                        label="Add gallery image"
                                        uploadTestId="admin-product-gallery"
                                        hint="Upload from this device (auto-compressed) or paste a link. Use the star to promote an image to main."
                                    />
                                </div>
                                <MediaUploadInput
                                    kind="video"
                                    value={form.video_url}
                                    onChange={(url) => setForm((f) => ({ ...f, video_url: url }))}
                                    folder="products"
                                    label="Product video (plays in-app on the product page)"
                                    linkTestId="product-video"
                                    uploadTestId="admin-product-video"
                                    hint="Upload a video (auto-compressed like WhatsApp) or paste a YouTube/MP4 link."
                                />

                                {/* Specifications + attributes */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="product-specs" className="mb-1 block text-xs font-medium text-gray-500">Specifications (key=value per line)</label>
                                        <textarea id="product-specs" rows={3} placeholder="material=aluminium&#10;warranty=2 years" value={form.specificationsText} onChange={(e) => setForm({ ...form, specificationsText: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="product-attrs" className="mb-1 block text-xs font-medium text-gray-500">Attributes (key=value per line)</label>
                                        <textarea id="product-attrs" rows={3} placeholder="color=black&#10;size=large" value={form.attributesText} onChange={(e) => setForm({ ...form, attributesText: e.target.value })} className={field} />
                                    </div>
                                </div>

                                {/* Shipping */}
                                <div className="grid grid-cols-5 gap-3">
                                    <div>
                                        <label htmlFor="ship-weight" className="mb-1 block text-xs font-medium text-gray-500">Weight kg</label>
                                        <input id="ship-weight" type="number" min="0" step="0.1" value={form.shipping_weight} onChange={(e) => setForm({ ...form, shipping_weight: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="ship-l" className="mb-1 block text-xs font-medium text-gray-500">Length cm</label>
                                        <input id="ship-l" type="number" min="0" value={form.shipping_length} onChange={(e) => setForm({ ...form, shipping_length: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="ship-w" className="mb-1 block text-xs font-medium text-gray-500">Width cm</label>
                                        <input id="ship-w" type="number" min="0" value={form.shipping_width} onChange={(e) => setForm({ ...form, shipping_width: e.target.value })} className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="ship-h" className="mb-1 block text-xs font-medium text-gray-500">Height cm</label>
                                        <input id="ship-h" type="number" min="0" value={form.shipping_height} onChange={(e) => setForm({ ...form, shipping_height: e.target.value })} className={field} />
                                    </div>
                                    <div className="flex items-end pb-1.5">
                                        <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                            <input type="checkbox" checked={form.shipping_free} onChange={(e) => setForm({ ...form, shipping_free: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                                            Free shipping
                                        </label>
                                    </div>
                                </div>

                                {/* Variants (spec 37) */}
                                <div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Variants</span>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, variants: [...form.variants, { name: '', sku: '', price: '', stock_quantity: '0' }] })}
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                            + Add variant
                                        </button>
                                    </div>
                                    {form.variants.length === 0 && <p className="text-xs text-gray-400">No variants.</p>}
                                    <div className="space-y-2">
                                        {form.variants.map((v, i) => (
                                            <div key={i} className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto] gap-2">
                                                <input placeholder="Name" value={v.name} onChange={(e) => setForm({ ...form, variants: form.variants.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} className={field} />
                                                <input placeholder="SKU" value={v.sku} onChange={(e) => setForm({ ...form, variants: form.variants.map((x, j) => j === i ? { ...x, sku: e.target.value } : x) })} className={field} />
                                                <input placeholder="Price" type="number" min="0" step="0.01" value={v.price} onChange={(e) => setForm({ ...form, variants: form.variants.map((x, j) => j === i ? { ...x, price: e.target.value } : x) })} className={field} />
                                                <input placeholder="Stock" type="number" min="0" value={v.stock_quantity} onChange={(e) => setForm({ ...form, variants: form.variants.map((x, j) => j === i ? { ...x, stock_quantity: e.target.value } : x) })} className={field} />
                                                <button type="button" onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })} className="px-1 text-red-500 hover:text-red-700" aria-label="Remove variant">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={closeForm}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void saveForm()}
                                    disabled={saving}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : formTarget === 'new' ? 'Create Product' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
