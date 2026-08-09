import { useEffect, useState, useCallback } from 'react';
import { ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../../api';
import type { StockMovement } from '../../types';
import { formatDateTime } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (typeFilter) params.movementType = typeFilter;
      const res = await productsApi.getMovements(params);
      setMovements(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load stock log'); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">Stock Movement Log</h1>
          <p className="page-description">Full history of all stock changes</p>
        </div>
      </div>

      <div className="filters-bar">
        <select
          id="movement-type-filter"
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Movements</option>
          <option value="IN">Stock IN</option>
          <option value="OUT">Stock OUT</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /> Loading stock log...</div>
        ) : movements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ArrowUpDown size={28} /></div>
            <div className="empty-title">No stock movements yet</div>
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.product?.name}</td>
                      <td><code style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', background: 'var(--accent-primary-light)', padding: '2px 6px', borderRadius: 4 }}>{m.product?.sku}</code></td>
                      <td><StatusBadge status={m.movementType} /></td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: m.movementType === 'IN' ? 'var(--color-success)' : 'var(--color-danger)',
                        }}>
                          {m.movementType === 'IN' ? '+' : '-'}{m.quantityChanged}
                        </span>
                      </td>
                      <td className="td-muted" style={{ maxWidth: 200 }}>{m.reason}</td>
                      <td className="td-muted">{m.createdBy?.name}</td>
                      <td className="td-muted">{formatDateTime(m.createdAt)}</td>
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
    </div>
  );
}
