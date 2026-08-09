import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Package, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../../api';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

import Pagination from '../../components/Pagination';
import { ConfirmDialog } from '../../components/Modal';
import ProductForm from './ProductForm';
import StockMovementModal from './StockMovementModal';
import { useAuth } from '../../contexts/AuthContext';

export default function ProductList() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'warehouse';
  const canDelete = user?.role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      const res = await productsApi.list(params);
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { loadProducts(1); }, [loadProducts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await productsApi.delete(deleteId);
      toast.success('Product deleted');
      setDeleteId(null);
      loadProducts(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    } finally { setDeleteLoading(false); }
  };

  const isLowStock = (p: Product) => p.currentStock <= p.minStockAlert;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">Products & Inventory</h1>
          <p className="page-description">{pagination.total} total products</p>
        </div>
        {canEdit && (
          <button id="add-product-btn" className="btn btn-primary" onClick={() => { setEditProduct(null); setFormOpen(true); }}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            id="product-search"
            className="search-input"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /> Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Package size={28} /></div>
            <div className="empty-title">No products found</div>
            <div className="empty-desc">Add your first product to get started</div>
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Stock</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={isLowStock(p) ? { background: 'rgba(245, 158, 11, 0.04)' } : undefined}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {isLowStock(p) && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: 2 }}>
                            ⚠ Low stock
                          </div>
                        )}
                      </td>
                      <td><code style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', background: 'var(--accent-primary-light)', padding: '2px 6px', borderRadius: 4 }}>{p.sku}</code></td>
                      <td className="td-muted">{p.category?.name || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(Number(p.unitPrice))}</td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: isLowStock(p) ? 'var(--color-warning)' : 'var(--color-success)',
                        }}>
                          {p.currentStock}
                        </span>
                        <span className="td-muted"> / {p.minStockAlert} min</span>
                      </td>
                      <td className="td-muted">{p.location || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {canEdit && (
                            <>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                title="Adjust Stock"
                                onClick={() => setStockModalProduct(p)}
                                style={{ color: 'var(--color-success)' }}
                              >
                                <ArrowUpDown size={14} />
                              </button>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                title="Edit"
                                onClick={() => { setEditProduct(p); setFormOpen(true); }}
                              >
                                <Pencil size={14} />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              title="Delete"
                              onClick={() => setDeleteId(p.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <Pagination {...pagination} onPageChange={loadProducts} />
            </div>
          </>
        )}
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProduct(null); }}
        onSaved={() => { setFormOpen(false); setEditProduct(null); loadProducts(pagination.page); }}
        product={editProduct}
      />

      {stockModalProduct && (
        <StockMovementModal
          product={stockModalProduct}
          onClose={() => setStockModalProduct(null)}
          onSaved={() => { setStockModalProduct(null); loadProducts(pagination.page); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? All stock history will also be removed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
