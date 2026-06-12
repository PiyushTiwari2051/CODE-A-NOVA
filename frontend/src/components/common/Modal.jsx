import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';

// --- CONFIRMATION MODAL (Replaces confirm()) ---
// Supports a typed-matching validation (like typing name to delete)
export function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  matchText = '', // If provided, user must type this to enable confirmation
  matchPlaceholder = 'Type here to confirm',
  isDanger = false
}) {
  const [inputValue, setInputValue] = useState('');

  // Reset input value when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmEnabled = !matchText || inputValue.trim().toLowerCase() === matchText.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 backdrop-blur-sm p-16">
      <div className="relative w-full max-w-md bg-surface-card rounded-md border border-customBorder shadow-lg p-20 modal-animate-open">
        {/* Header */}
        <div className="flex items-start gap-12">
          <div className={`p-8 rounded-full ${isDanger ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
            {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold text-text-primary leading-tight">{title}</h3>
            <p className="mt-8 text-sm text-text-secondary">{message}</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Typed Matching requirement (GitHub style) */}
        {matchText && (
          <div className="mt-16 bg-surface p-12 rounded-sm border border-customBorder">
            <label className="block text-xs font-medium text-text-secondary mb-6">
              Please type <span className="font-mono bg-accent-soft text-warning px-4 py-2 rounded-sm text-[12px]">{matchText}</span> to proceed.
            </label>
            <input
              type="text"
              className="w-full text-sm px-8 py-6 rounded-sm border border-customBorder bg-surface-card focus:outline-none focus:border-accent font-mono"
              placeholder={matchPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-20 flex justify-end gap-12">
          <button
            onClick={onCancel}
            className="px-16 py-8 text-xs font-semibold rounded-sm border border-customBorder text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              if (isConfirmEnabled) {
                onConfirm();
              }
            }}
            disabled={!isConfirmEnabled}
            className={`px-16 py-8 text-xs font-semibold rounded-sm text-white transition-all ${
              isDanger 
                ? 'bg-danger hover:bg-danger/90 disabled:bg-danger/40' 
                : 'bg-accent hover:bg-accent/90 disabled:bg-accent/40'
            } disabled:cursor-not-allowed`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ALERT MODAL (Replaces alert()) ---
export function AlertModal({
  isOpen,
  title = 'Notification',
  message,
  type = 'info', // 'success', 'error', 'info'
  onClose
}) {
  if (!isOpen) return null;

  const iconMap = {
    success: <CheckCircle size={20} className="text-success" />,
    error: <AlertTriangle size={20} className="text-danger" />,
    info: <Info size={20} className="text-info" />
  };

  const badgeBgMap = {
    success: 'bg-success/10',
    error: 'bg-danger/10',
    info: 'bg-info/10'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 backdrop-blur-sm p-16">
      <div className="relative w-full max-w-sm bg-surface-card rounded-md border border-customBorder shadow-lg p-20 modal-animate-open">
        <div className="flex items-start gap-12">
          <div className={`p-8 rounded-full ${badgeBgMap[type] || 'bg-info/10'}`}>
            {iconMap[type] || iconMap.info}
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-base font-bold text-text-primary leading-tight">{title}</h3>
            <p className="mt-8 text-sm text-text-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-20 flex justify-end">
          <button
            onClick={onClose}
            className="px-16 py-8 text-xs font-semibold rounded-sm bg-primary text-white hover:bg-primary-light transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
