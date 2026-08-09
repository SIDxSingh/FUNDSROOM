import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../../components/Modal';
import { productsApi } from '../../api';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

interface Props {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}

export default function StockMovementModal({ product, onClose, onSaved }: Props) {
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const quantity = parseInt(qty, 10);
    if (!quantity || quantity <= 0) { toast.error('Enter a valid quantity'); return; }
    if (!reason.trim()) { toast.error('Reason is required'); return; }
    setLoading(true);
    try {
      await productsApi.createMovement({
        productId: product.id,
        quantityChanged: quantity,
        movementType: type,
        reason,
      });
      toast.success(`Stock ${type === 'IN' ? 'added' : 'deducted'} successfully`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update stock');
    } finally { setLoading(false); }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust Stock — ${product.name}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', gap: 24 }}>
        <div>
          <div className="text-xs text-muted">Current Stock</div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: product.currentStock <= product.minStockAlert ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {product.currentStock}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">Min Alert</div>
          <div style={{ fontWeight: 600 }}>{product.minStockAlert}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Unit Price</div>
          <div style={{ fontWeight: 600 }}>{formatCurrency(Number(product.unitPrice))}</div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label required">Movement Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['IN', 'OUT'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`btn ${type === t ? (t === 'IN' ? 'btn-success' : 'btn-danger') : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center', ...(type === t && t === 'IN' ? { background: 'var(--color-success)', color: 'white' } : {}), ...(type === t && t === 'OUT' ? { background: 'var(--color-danger)', color: 'white' } : {}) }}
              onClick={() => setType(t)}
            >
              {t === 'IN' ? '↑ Stock IN' : '↓ Stock OUT'}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label required">Quantity</label>
        <input
          id="stock-quantity"
          type="number"
          className="form-control"
          placeholder="Enter quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          min="1"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="form-label required">Reason</label>
        <textarea
          id="stock-reason"
          className="form-control"
          placeholder="e.g. Purchase order received, Manual correction..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}
