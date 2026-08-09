import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { challansApi } from '../../api';
import type { Challan } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAct = user?.role === 'admin' || user?.role === 'sales';

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await challansApi.get(id);
      setChallan(res.data.data);
    } catch { toast.error('Challan not found'); navigate('/challans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await challansApi.confirm(id);
      toast.success('Challan confirmed — stock deducted');
      setConfirmDialog(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await challansApi.cancel(id);
      toast.success('Challan cancelled');
      setCancelDialog(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    } finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /> Loading...</div>;
  if (!challan) return null;

  const snapshot = challan.customerSnapshot as any;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/challans')}>
        <ArrowLeft size={14} /> Back to Challans
      </button>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">{challan.challanNumber}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <StatusBadge status={challan.status} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Created {formatDateTime(challan.createdAt)} by {challan.createdBy?.name}
            </span>
          </div>
        </div>
        {canAct && challan.status === 'draft' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success" style={{ background: 'var(--color-success)', color: 'white' }} onClick={() => setConfirmDialog(true)}>
              <CheckCircle size={14} /> Confirm
            </button>
            <button className="btn btn-danger" style={{ background: 'var(--color-danger)', color: 'white' }} onClick={() => setCancelDialog(true)}>
              <XCircle size={14} /> Cancel
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Items */}
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Line Items</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {challan.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.productSnapshot.name}</td>
                      <td><code style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', background: 'var(--accent-primary-light)', padding: '2px 6px', borderRadius: 4 }}>{item.productSnapshot.sku}</code></td>
                      <td>{formatCurrency(Number(item.unitPrice))}</td>
                      <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(Number(item.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="challan-total-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 8 }}>
              <span className="challan-total-label">Total Quantity: {challan.totalQuantity} items</span>
              <span style={{ flex: 1 }} />
              <span className="challan-total-label">Total Amount:</span>
              <span className="challan-total-value" style={{ fontSize: '1.1rem' }}>{formatCurrency(Number(challan.totalAmount))}</span>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Customer (Snapshot)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="detail-item">
              <span className="detail-label">Name</span>
              <span className="detail-value">{snapshot.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mobile</span>
              <span className="detail-value">{snapshot.mobile}</span>
            </div>
            {snapshot.businessName && (
              <div className="detail-item">
                <span className="detail-label">Business</span>
                <span className="detail-value">{snapshot.businessName}</span>
              </div>
            )}
            {snapshot.gstNumber && (
              <div className="detail-item">
                <span className="detail-label">GST</span>
                <span className="detail-value">{snapshot.gstNumber}</span>
              </div>
            )}
            {snapshot.address && (
              <div className="detail-item">
                <span className="detail-label">Address</span>
                <span className="detail-value">{snapshot.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={handleConfirm}
        title="Confirm Challan"
        description="This will mark the challan as confirmed and immediately deduct stock for all items. This cannot be undone."
        confirmLabel="Confirm Challan"
        variant="warning"
        loading={actionLoading}
      />
      <ConfirmDialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        onConfirm={handleCancel}
        title="Cancel Challan"
        description="Are you sure? The challan will be cancelled. Stock will NOT be automatically restored."
        confirmLabel="Cancel Challan"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
