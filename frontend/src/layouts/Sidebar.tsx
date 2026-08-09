import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText,
  LogOut, Boxes, ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/customers', icon: <Users size={18} />, label: 'Customers', roles: ['admin', 'sales'] },
  { to: '/products', icon: <Package size={18} />, label: 'Products' },
  { to: '/stock-movements', icon: <ArrowUpDown size={18} />, label: 'Stock Log' },
  { to: '/challans', icon: <FileText size={18} />, label: 'Sales Challans', roles: ['admin', 'sales', 'warehouse', 'accounts'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Boxes size={18} color="white" />
        </div>
        <div>
          <div className="sidebar-logo-text">ERP Portal</div>
          <div className="sidebar-logo-sub">Operations Suite</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {user?.role} · {user?.email}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm w-full" onClick={logout} style={{ gap: 6 }}>
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
