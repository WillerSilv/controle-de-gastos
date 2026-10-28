import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      borderRadius: '12px',
      background: isError ? 'var(--danger)' : 'var(--success)',
      color: '#fff',
      boxShadow: 'none',
      fontWeight: 500,
      fontSize: '14px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          marginLeft: '8px',
          opacity: 0.8
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
