import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Eye, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { challansApi } from '../../api';
import type { Challan } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { ConfirmDialog } from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';

export default function ChallanList() {
  const { user } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'sales';
  const navigate = useNavigate();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await challansApi.list(params);
      setChallans(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load challans'); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(1); }, [load]);

  const handleConfirm = async () => {
    if (!confirmId) return;
    setActionLoading(true);
    try {
      await challansApi.confirm(confirmId);
      toast.success('Challan confirmed — stock deducted');
      setConfirmId(null);
      load(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setActionLoading(true);
    try {
      await challansApi.cancel(cancelId);
      toast.success('Challan cancelled');
      setCancelId(null);
      load(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel');
    } finally { setActionLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">Sales Challans</h1>
          <p className="page-description">{pagination.total} total challans</p>
        </div>
        {canCreate && (
          <button id="create-challan-btn" className="btn btn-primary" onClick={() => navigate('/challans/new')}>
            <Plus size={16} /> Create Challan
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper" style={{ flex: 'none', width: 280 }}>
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            id="challan-search"
            className="search-input"
            placeholder="Search challan # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="challan-status-filter"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /> Loading challans...</div>
        ) : challans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={28} /></div>
            <div className="empty-title">No challans found</div>
            {canCreate && (
              <button className="btn btn-primary btn-sm mt-2" onClick={() => navigate('/challans/new')}>
                <Plus size={14} /> Create Challan
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/challans/${c.id}`} style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                          {c.challanNumber}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.customer?.name}</div>
                        {c.customer?.businessName && <div className="td-muted">{c.customer.businessName}</div>}
                      </td>
                      <td className="td-muted">{c.totalQuantity} qty</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(Number(c.totalAmount))}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="td-muted">{formatDate(c.createdAt)}</td>
                      <td className="td-muted">{c.createdBy?.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link to={`/challans/${c.id}`} className="btn btn-ghost btn-icon btn-sm" title="View">
                            <Eye size={14} />
                          </Link>
                          {canCreate && c.status === 'draft' && (
                            <>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                style={{ color: 'var(--color-success)' }}
                                title="Confirm"
                                onClick={() => setConfirmId(c.id)}
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                style={{ color: 'var(--color-danger)' }}
                                title="Cancel"
                                onClick={() => setCancelId(c.id)}
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <Pagination {...pagination} onPageChange={load} />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleConfirm}
        title="Confirm Challan"
        description="This will mark the challan as confirmed and deduct stock for all line items. This action cannot be undone."
        confirmLabel="Confirm Challan"
        variant="warning"
        loading={actionLoading}
      />
      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel Challan"
        description="Are you sure you want to cancel this challan? Stock will NOT be automatically restored."
        confirmLabel="Cancel Challan"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
