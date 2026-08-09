import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'default' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'default' }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'lg' ? ' modal-lg' : size === 'xl' ? ' modal-xl' : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${sizeClass}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label={title}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="" footer={
      <>
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-secondary'}`}
          style={variant === 'danger' ? { background: 'var(--color-danger)', color: 'white' } : {}}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
          {confirmLabel}
        </button>
      </>
    }>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className={`confirm-icon ${variant}`}>
          <AlertTriangle size={24} />
        </div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{description}</div>
      </div>
    </Modal>
  );
}
