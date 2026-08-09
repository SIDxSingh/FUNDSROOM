import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Drawer from '../../components/Drawer';
import { productsApi } from '../../api';
import type { Product, Category } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}

const emptyForm = {
  name: '', sku: '', categoryId: '', unitPrice: '',
  currentStock: '0', minStockAlert: '10', location: '',
};

export default function ProductForm({ open, onClose, onSaved, product }: Props) {
  const isEdit = !!product;
  const [form, setForm] = useState({ ...emptyForm });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    productsApi.getCategories().then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        categoryId: product.categoryId || '',
        unitPrice: String(product.unitPrice),
        currentStock: String(product.currentStock),
        minStockAlert: String(product.minStockAlert),
        location: product.location || '',
      });
    } else {
      setForm({ ...emptyForm });
    }
    setErrors({});
  }, [product, open]);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (!form.unitPrice || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) <= 0) errs.unitPrice = 'Must be a positive number';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId || undefined,
        unitPrice: parseFloat(form.unitPrice),
        currentStock: parseInt(form.currentStock, 10),
        minStockAlert: parseInt(form.minStockAlert, 10),
        location: form.location || undefined,
      };
      if (isEdit) {
        await productsApi.update(product!.id, payload);
        toast.success('Product updated');
      } else {
        await productsApi.create(payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Save size={14} />}
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label required">Product Name</label>
          <input id="product-name" className="form-control" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Product name" />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required">SKU / Code</label>
            <input id="product-sku" className="form-control" value={form.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} placeholder="e.g. ELEC-001" />
            {errors.sku && <span className="form-error">{errors.sku}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select id="product-category" className="form-control" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label required">Unit Price (₹)</label>
          <input id="product-price" type="number" step="0.01" className="form-control" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} placeholder="0.00" />
          {errors.unitPrice && <span className="form-error">{errors.unitPrice}</span>}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">{isEdit ? 'Current Stock' : 'Opening Stock'}</label>
            <input id="product-stock" type="number" className="form-control" value={form.currentStock} onChange={(e) => set('currentStock', e.target.value)} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Min Stock Alert</label>
            <input id="product-min-stock" type="number" className="form-control" value={form.minStockAlert} onChange={(e) => set('minStockAlert', e.target.value)} min="0" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location / Warehouse</label>
          <input id="product-location" className="form-control" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Rack A-1" />
        </div>
      </form>
    </Drawer>
  );
}
