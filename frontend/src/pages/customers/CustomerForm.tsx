import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Drawer from '../../components/Drawer';
import { customersApi } from '../../api';
import type { Customer } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  customer?: Customer | null;
}

interface FormState {
  name: string; mobile: string; email: string; businessName: string; gstNumber: string;
  customerType: 'retail' | 'wholesale' | 'distributor';
  address: string;
  status: 'lead' | 'active' | 'inactive';
  followUpDate: string; notes: string;
}

const emptyForm: FormState = {
  name: '', mobile: '', email: '', businessName: '', gstNumber: '',
  customerType: 'retail',
  address: '', status: 'lead', followUpDate: '', notes: '',
};

export default function CustomerForm({ open, onClose, onSaved, customer }: Props) {
  const isEdit = !!customer;
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        businessName: customer.businessName || '',
        gstNumber: customer.gstNumber || '',
        customerType: (customer.customerType as 'retail' | 'wholesale' | 'distributor') || 'retail',
        address: customer.address || '',
        status: (customer.status as 'lead' | 'active' | 'inactive') || 'lead',
        followUpDate: customer.followUpDate ? customer.followUpDate.split('T')[0] : '',
        notes: customer.notes || '',
      });
    } else {
      setForm({ ...emptyForm });
    }
    setErrors({});
  }, [customer, open]);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\d{10}$/.test(form.mobile)) errs.mobile = 'Must be 10 digits';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : undefined,
      };
      if (isEdit) {
        await customersApi.update(customer!.id, payload);
        toast.success('Customer updated');
      } else {
        await customersApi.create(payload);
        toast.success('Customer added');
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
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
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
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required">Full Name</label>
            <input id="customer-name" className="form-control" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Customer name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label required">Mobile</label>
            <input id="customer-mobile" className="form-control" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="10-digit number" maxLength={10} />
            {errors.mobile && <span className="form-error">{errors.mobile}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input id="customer-email" type="email" className="form-control" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email address" />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input id="customer-business" className="form-control" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Company name" />
          </div>
          <div className="form-group">
            <label className="form-label">GST Number</label>
            <input id="customer-gst" className="form-control" value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} placeholder="GST number (optional)" />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required">Customer Type</label>
            <select id="customer-type" className="form-control" value={form.customerType} onChange={(e) => set('customerType', e.target.value)}>
              <option value="retail">Retail</option>
              <option value="wholesale">Wholesale</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label required">Status</label>
            <select id="customer-status" className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea id="customer-address" className="form-control" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address" rows={2} />
        </div>

        <div className="form-group">
          <label className="form-label">Follow-up Date</label>
          <input id="customer-followup" type="date" className="form-control" value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea id="customer-notes" className="form-control" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional notes..." rows={3} />
        </div>
      </form>
    </Drawer>
  );
}
