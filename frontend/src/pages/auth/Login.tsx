import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Boxes, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const DEMO_CREDS = [
  { role: 'admin', email: 'admin@erp.com', pass: 'Admin@123' },
  { role: 'sales', email: 'sales@erp.com', pass: 'Sales@123' },
  { role: 'warehouse', email: 'warehouse@erp.com', pass: 'Ware@123' },
  { role: 'accounts', email: 'accounts@erp.com', pass: 'Acct@123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCred = (c: typeof DEMO_CREDS[0]) => {
    setEmail(c.email);
    setPassword(c.pass);
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Boxes size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ERP Portal
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Operations Suite</div>
          </div>
        </div>

        <div className="login-title">Sign in to your account</div>
        <div className="login-sub" style={{ marginBottom: 24 }}>Access the ERP dashboard</div>

        {/* Demo credentials */}
        <div className="login-creds">
          <div className="login-creds-title">Quick login — click a role</div>
          {DEMO_CREDS.map((c) => (
            <div key={c.role} className="login-cred-item" onClick={() => fillCred(c)}>
              <span className="login-cred-role">{c.role}</span>
              <span className="login-cred-email">{c.email}</span>
              <span className="login-cred-pass">{c.pass}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ marginTop: 8, padding: '11px 16px', fontSize: '0.9rem' }}
          >
            {loading ? (
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
