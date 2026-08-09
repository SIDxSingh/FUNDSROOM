import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Business overview' },
  '/customers': { title: 'Customer CRM', subtitle: 'Manage customers and follow-ups' },
  '/products': { title: 'Products & Inventory', subtitle: 'Manage products and stock' },
  '/stock-movements': { title: 'Stock Log', subtitle: 'Track all stock movements' },
  '/challans': { title: 'Sales Challans', subtitle: 'Create and manage challans' },
};

export default function Topbar() {
  const { user } = useAuth();
  const location = useLocation();

  const pageInfo = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || { title: 'ERP Portal', subtitle: '' };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{pageInfo.title}</span>
        {pageInfo.subtitle && (
          <span className="topbar-subtitle">{pageInfo.subtitle}</span>
        )}
      </div>
      <div className="topbar-right">
        <button
          className="btn btn-ghost btn-icon"
          title="Notifications"
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
        </button>
        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-info-name">{user?.name}</div>
            <div className="user-info-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
