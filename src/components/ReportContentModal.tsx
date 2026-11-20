'use client';

import { useState } from 'react';
import { Flag, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';

const REPORT_REASONS = [
  'Conteúdo impróprio ou ofensivo',
  'Direitos de autor / Plágio',
  'Discurso de ódio ou assédio',
  'Spam ou conteúdo enganoso',
  'Informação falsa ou prejudicial',
  'Outro motivo',
];

export default function ReportContentModal({
  open,
  contentType,
  contentId,
  contentTitle,
  onClose,
}: {
  open: boolean;
  contentType: 'music' | 'video';
  contentId: number | null;
  contentTitle?: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open || !contentId) return null;

  const handleClose = () => {
    setDone(false);
    setError(null);
    setDetails('');
    setReason(REPORT_REASONS[0]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível registar a denúncia.'));
      }
      setDone(true);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível registar a denúncia.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-red-400" />
            <h3 className="text-base font-bold">Denunciar Conteúdo</h3>
          </div>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 size={42} className="text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Denúncia registada</h4>
              <p className="text-xs text-gray-300">
                Obrigado por ajudares a manter a PodFéPlay segura. A nossa equipa de moderação irá analisar esta denúncia em breve.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {contentTitle && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <span className="text-gray-400">
                    {contentType === 'video' ? 'Vídeo' : 'Música'}:{' '}
                  </span>
                  <strong className="text-white">{contentTitle}</strong>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-300 mb-1.5">
                  Motivo da denúncia *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1.5">
                  Detalhes adicionais (opcional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Descreve o problema encontrado..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-gray-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Enviar Denúncia</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
