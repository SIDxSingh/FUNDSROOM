

type Status =
  | 'lead' | 'active' | 'inactive'
  | 'draft' | 'confirmed' | 'cancelled'
  | 'retail' | 'wholesale' | 'distributor'
  | 'IN' | 'OUT';

const statusConfig: Record<Status, { label: string; className: string }> = {
  lead:        { label: 'Lead',        className: 'badge-warning' },
  active:      { label: 'Active',      className: 'badge-success' },
  inactive:    { label: 'Inactive',    className: 'badge-muted' },
  draft:       { label: 'Draft',       className: 'badge-muted' },
  confirmed:   { label: 'Confirmed',   className: 'badge-success' },
  cancelled:   { label: 'Cancelled',   className: 'badge-danger' },
  retail:      { label: 'Retail',      className: 'badge-info' },
  wholesale:   { label: 'Wholesale',   className: 'badge-purple' },
  distributor: { label: 'Distributor', className: 'badge-blue' },
  IN:          { label: 'IN',          className: 'badge-success' },
  OUT:         { label: 'OUT',         className: 'badge-danger' },
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const config = statusConfig[status as Status] || { label: status, className: 'badge-muted' };
  return (
    <span className={`badge ${config.className}`}>
      <span className="badge-dot" />
      {config.label}
    </span>
  );
}
