import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, FileText, TrendingUp, AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { dashboardApi } from '../../api';
import type { DashboardStats } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /> Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-description">Real-time business overview</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue"><Users size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value">{stats?.customers.total ?? 0}</div>
            <div className="stat-sub">{stats?.customers.active ?? 0} active</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green"><Package size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Products</div>
            <div className="stat-value">{stats?.products.total ?? 0}</div>
            <div className="stat-sub" style={{ color: stats?.products.lowStock ? 'var(--color-warning)' : undefined }}>
              {stats?.products.lowStock ?? 0} low stock
            </div>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-icon amber"><FileText size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Challans</div>
            <div className="stat-value">{stats?.challans.total ?? 0}</div>
            <div className="stat-sub">{stats?.challans.draft ?? 0} draft · {stats?.challans.confirmed ?? 0} confirmed</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon purple"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Confirmed Revenue</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>
              {formatCurrency(Number(stats?.challans.revenue ?? 0))}
            </div>
            <div className="stat-sub">from confirmed challans</div>
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {(stats?.products.lowStock ?? 0) > 0 && (
        <div className="card mb-4" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} color="var(--color-warning)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-warning)', fontSize: '0.875rem' }}>
                Low Stock Alert
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {stats?.products.lowStock} product(s) are below minimum stock threshold
              </div>
            </div>
            <Link to="/products?lowStock=true" className="btn btn-warning btn-sm ml-auto" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.25)' }}>
              View <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Recent challans */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Challans</div>
            <div className="card-subtitle">Latest sales activity</div>
          </div>
          <Link to="/challans" className="btn btn-ghost btn-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {(stats?.recentChallans?.length ?? 0) === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}>
            <div className="empty-icon"><FileText size={24} /></div>
            <div className="empty-title">No challans yet</div>
            <div className="empty-desc">Create your first sales challan to get started</div>
            <Link to="/challans" className="btn btn-primary btn-sm mt-2">Create Challan</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentChallans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`} style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td>{c.customer?.name}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(Number(c.totalAmount))}</td>
                    <td className="td-muted">{formatDate(c.createdAt)}</td>
                    <td className="td-muted">{c.createdBy?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
