'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export interface ActionModalConfig {
  mode: 'confirm' | 'prompt' | 'alert';
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void | Promise<void>;
}

export default function ActionModal({
  config,
  onClose,
}: {
  config: ActionModalConfig | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (config) {
      setValue(config.defaultValue || '');
      setBusy(false);
    }
  }, [config]);

  if (!config) return null;

  const handleConfirm = async () => {
    try {
      setBusy(true);
      await config.onConfirm?.(config.mode === 'prompt' ? value : undefined);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {config.danger ? (
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle size={20} className="text-purple-400 flex-shrink-0" />
            )}
            <h3 className="text-base font-bold text-white">{config.title}</h3>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Fechar"
          >
            <XCircle size={18} />
          </button>
        </div>

        {config.message && (
          <p className="text-sm text-gray-300 leading-relaxed">{config.message}</p>
        )}

        {config.mode === 'prompt' && (
          <div>
            {config.inputLabel && (
              <label className="block text-xs text-gray-400 mb-1.5">{config.inputLabel}</label>
            )}
            <textarea
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config.inputPlaceholder || 'Escreve aqui...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          {config.mode !== 'alert' && (
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-gray-200 transition-colors"
            >
              {config.cancelLabel || 'Cancelar'}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={config.mode === 'alert' ? onClose : handleConfirm}
            className={`px-5 py-2 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
              config.danger
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {busy
              ? 'A processar...'
              : config.confirmLabel || (config.mode === 'alert' ? 'OK' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
