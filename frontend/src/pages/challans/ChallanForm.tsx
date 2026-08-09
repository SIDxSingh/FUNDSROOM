import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi, productsApi, challansApi } from '../../api';
import type { Customer, Product } from '../../types';
import { formatCurrency } from '../../utils/format';

interface LineItem {
  productId: string;
  product?: Product;
  quantity: number;
}

export default function ChallanForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customersApi.list({ limit: '200' }),
      productsApi.list({ limit: '200' }),
    ]).then(([custRes, prodRes]) => {
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
    }).finally(() => setDataLoading(false));
  }, []);

  const addItem = () => setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const setItemProduct = (i: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, productId, product } : item));
  };

  const setItemQty = (i: number, quantity: number) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, quantity } : item));
  };

  const totalAmount = items.reduce((sum, item) => {
    if (!item.product) return sum;
    return sum + Number(item.product.unitPrice) * item.quantity;
  }, 0);

  const validate = () => {
    if (!customerId) { toast.error('Please select a customer'); return false; }
    if (items.some((i) => !i.productId)) { toast.error('Please select a product for each line item'); return false; }
    if (items.some((i) => i.quantity < 1)) { toast.error('Quantity must be at least 1'); return false; }
    const ids = items.map((i) => i.productId);
    if (new Set(ids).size !== ids.length) { toast.error('Duplicate products found — combine them instead'); return false; }
    return true;
  };

  const handleSubmit = async (saveStatus: 'draft' | 'confirmed') => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await challansApi.create({
        customerId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        status: saveStatus,
      });
      toast.success(saveStatus === 'confirmed' ? 'Challan confirmed — stock deducted!' : 'Challan saved as draft');
      navigate(`/challans/${res.data.data.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save challan';
      toast.error(msg, { duration: 5000 });
    } finally { setLoading(false); }
  };

  if (dataLoading) return <div className="loading-overlay"><div className="spinner" /> Loading data...</div>;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/challans')}>
        <ArrowLeft size={14} /> Back to Challans
      </button>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">New Sales Challan</h1>
          <p className="page-description">Create a new challan for a customer</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left: Main form */}
        <div>
          {/* Customer */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Customer</div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                id="challan-customer"
                className="form-control"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.businessName ? `— ${c.businessName}` : ''} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Line Items</div>
              <button className="btn btn-secondary btn-sm" type="button" onClick={addItem}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="table-wrapper" style={{ marginBottom: 12 }}>
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Product</th>
                    <th style={{ width: '15%' }}>Stock</th>
                    <th style={{ width: '15%' }}>Unit Price</th>
                    <th style={{ width: '15%' }}>Qty</th>
                    <th style={{ width: '15%' }}>Total</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const product = item.product;
                    const lineTotal = product ? Number(product.unitPrice) * item.quantity : 0;
                    return (
                      <tr key={i}>
                        <td>
                          <select
                            id={`item-product-${i}`}
                            className="form-control"
                            style={{ fontSize: '0.82rem', padding: '6px 28px 6px 8px' }}
                            value={item.productId}
                            onChange={(e) => setItemProduct(i, e.target.value)}
                          >
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ color: product && product.currentStock <= product.minStockAlert ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 600 }}>
                          {product ? product.currentStock : '—'}
                        </td>
                        <td>{product ? formatCurrency(Number(product.unitPrice)) : '—'}</td>
                        <td>
                          <input
                            id={`item-qty-${i}`}
                            type="number"
                            className="form-control"
                            style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                            value={item.quantity}
                            min={1}
                            max={product?.currentStock}
                            onChange={(e) => setItemQty(i, Math.max(1, parseInt(e.target.value, 10) || 1))}
                          />
                        </td>
                        <td className="line-total">{product ? formatCurrency(lineTotal) : '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="challan-total-row">
              <span className="challan-total-label">Total Amount:</span>
              <span className="challan-total-value">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions sidebar */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Save Options</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              id="save-draft-btn"
              className="btn btn-secondary"
              style={{ justifyContent: 'center', padding: '12px 16px' }}
              onClick={() => handleSubmit('draft')}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Save size={16} />}
              Save as Draft
            </button>
            <button
              id="confirm-challan-btn"
              className="btn btn-success"
              style={{ justifyContent: 'center', padding: '12px 16px', background: 'var(--color-success)', color: 'white' }}
              onClick={() => handleSubmit('confirmed')}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <CheckCircle size={16} />}
              Confirm & Deduct Stock
            </button>
          </div>

          <div className="divider" />

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Draft</strong> — saves without touching stock. Editable later.<br /><br />
            <strong style={{ color: 'var(--text-secondary)' }}>Confirm</strong> — deducts stock immediately. Cannot be re-opened.
          </div>

          {totalAmount > 0 && (
            <>
              <div className="divider" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Challan Total</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
