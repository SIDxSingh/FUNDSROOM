import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '../../api';
import type { Customer, CustomerFollowUp } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge';
import CustomerForm from './CustomerForm';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'sales';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [custRes, fuRes] = await Promise.all([
        customersApi.get(id),
        customersApi.getFollowUps(id),
      ]);
      setCustomer(custRes.data.data);
      setFollowUps(fuRes.data.data);
    } catch { toast.error('Customer not found'); navigate('/customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || !id) return;
    setNoteLoading(true);
    try {
      const res = await customersApi.addFollowUp(id, note);
      setFollowUps((f) => [res.data.data, ...f]);
      setNote('');
      toast.success('Follow-up note added');
    } catch { toast.error('Failed to add note'); }
    finally { setNoteLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /> Loading...</div>;
  if (!customer) return null;

  return (
    <div>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/customers')}>
        <ArrowLeft size={14} /> Back to Customers
      </button>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-heading">{customer.name}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <StatusBadge status={customer.status} />
            <StatusBadge status={customer.customerType} />
          </div>
        </div>
        {canEdit && (
          <button className="btn btn-secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={14} /> Edit Customer
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Left: Details */}
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Customer Information</div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Mobile</span>
                <span className="detail-value">{customer.mobile}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{customer.email || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Business Name</span>
                <span className="detail-value">{customer.businessName || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">GST Number</span>
                <span className="detail-value">{customer.gstNumber || '—'}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-label">Address</span>
                <span className="detail-value">{customer.address || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Follow-up Date</span>
                <span className="detail-value">
                  {customer.followUpDate ? formatDate(customer.followUpDate) : '—'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created</span>
                <span className="detail-value">{formatDate(customer.createdAt)}</span>
              </div>
              {customer.notes && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Notes</span>
                  <span className="detail-value">{customer.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Follow-up timeline */}
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Follow-up Timeline</div>

            {/* Add note */}
            {canEdit && (
              <form onSubmit={addNote} style={{ marginBottom: 20 }}>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <textarea
                    id="followup-note"
                    className="form-control"
                    placeholder="Add a follow-up note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
                <button
                  id="add-followup-btn"
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!note.trim() || noteLoading}
                >
                  {noteLoading ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Send size={12} />}
                  Add Note
                </button>
              </form>
            )}

            <div className="divider" />

            {followUps.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-title" style={{ fontSize: '0.875rem' }}>No follow-up notes yet</div>
              </div>
            ) : (
              <div className="timeline">
                {followUps.map((fu) => (
                  <div key={fu.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-note">{fu.note}</div>
                      <div className="timeline-meta">
                        {fu.createdBy?.name} · {formatDateTime(fu.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); load(); }}
        customer={customer}
      />
    </div>
  );
}
