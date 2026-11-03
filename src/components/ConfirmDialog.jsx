import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-ghost" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="confirm-dialog">
          <AlertTriangle size={56} className="icon" style={{ color: variant === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)' }} />
          <p>{message}</p>
          <div className="btn-group">
            <button className="btn btn-outline" onClick={onCancel}>{cancelLabel}</button>
            <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
