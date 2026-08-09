import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '../../api';
import type { Customer } from '../../types';
import { formatDate } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { ConfirmDialog } from '../../components/Modal';
import CustomerForm from './CustomerForm';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerList() {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'sales';
  const canDelete = user?.role === 'admin';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.customerType = typeFilter;
      const res = await customersApi.list(params);
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { loadCustomers(1); }, [loadCustomers]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await customersApi.delete(deleteId);
      toast.success('Customer deleted');
      setDeleteId(null);
      loadCustomers(pagination.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    } finally { setDeleteLoading(false); }
  };

  const handleSaved = () => {
    setDrawerOpen(false);
    setEditCustomer(null);
    loadCustomers(pagination.page);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">Customers</h1>
          <p className="page-description">{pagination.total} total customers</p>
        </div>
        {canEdit && (
          <button
            id="add-customer-btn"
            className="btn btn-primary"
            onClick={() => { setEditCustomer(null); setDrawerOpen(true); }}
          >
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            id="customer-search"
            className="search-input"
            placeholder="Search by name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="status-filter"
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          id="type-filter"
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="distributor">Distributor</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /> Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={28} /></div>
            <div className="empty-title">No customers found</div>
            <div className="empty-desc">Try adjusting your filters or add a new customer</div>
            {canEdit && (
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setDrawerOpen(true)}>
                <Plus size={14} /> Add Customer
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Mobile</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Follow-up</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        {c.businessName && <div className="td-muted">{c.businessName}</div>}
                      </td>
                      <td>{c.mobile}</td>
                      <td><StatusBadge status={c.customerType} /></td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="td-muted">
                        {c.followUpDate ? formatDate(c.followUpDate) : '—'}
                      </td>
                      <td className="td-muted">{formatDate(c.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link to={`/customers/${c.id}`} className="btn btn-ghost btn-icon btn-sm" title="View">
                            <Eye size={14} />
                          </Link>
                          {canEdit && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Edit"
                              onClick={() => { setEditCustomer(c); setDrawerOpen(true); }}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              title="Delete"
                              onClick={() => setDeleteId(c.id)}
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
              <Pagination {...pagination} onPageChange={loadCustomers} />
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Drawer */}
      <CustomerForm
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditCustomer(null); }}
        onSaved={handleSaved}
        customer={editCustomer}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
