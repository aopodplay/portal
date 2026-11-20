'use client';

import { useEffect, useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchWithAuth } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';

interface PlanInfo {
  key: string;
  name: string;
  priceUsd: number;
  priceAoa: number;
}

interface AvailableMethod {
  provider: 'emis' | 'paypay';
  label: string;
  integrationMode: 'api' | 'iframe';
  environment: 'sandbox' | 'production';
  iframeUrl?: string | null;
}

export default function PlanCheckoutModal({
  plan,
  onClose,
  onPaid,
}: {
  plan: PlanInfo | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [methods, setMethods] = useState<AvailableMethod[]>([]);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<'emis' | 'paypay' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<any | null>(null);

  useEffect(() => {
    if (!plan) {
      setMethods([]);
      setSelectedProvider(null);
      setTxResult(null);
      setError(null);
      return;
    }

    (async () => {
      try {
        setLoadingMethods(true);
        setError(null);
        const res = await fetchWithAuth(`/api/v1/payments/plans/${plan.key}/methods`);
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.success) {
          throw new Error(parseApiError(res, body));
        }
        const list: AvailableMethod[] = body.data?.methods || [];
        setMethods(list);
        setOnlineEnabled(Boolean(body.data?.onlinePaymentEnabled));
        setSelectedProvider(list[0]?.provider || null);
      } catch (err) {
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoadingMethods(false);
      }
    })();
  }, [plan]);

  // Polling apenas para aguardar confirmação oficial do webhook
  useEffect(() => {
    if (!txResult?.transactionUuid || txResult?.status === 'PAID') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetchWithAuth(`/api/v1/payments/transactions/${txResult.transactionUuid}`);
        const body = await res.json().catch(() => null);
        if (res.ok && body?.success && body.data) {
          setTxResult((prev: any) => ({ ...prev, status: body.data.status }));
          if (body.data.status === 'PAID') {
            clearInterval(interval);
            onPaid();
          }
        }
      } catch {
        // Silencioso
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [txResult?.transactionUuid, txResult?.status, onPaid]);

  if (!plan) return null;

  const handleConfirmCheckout = async () => {
    if (!selectedProvider || submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetchWithAuth('/api/v1/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({
          planKey: plan.key,
          provider: selectedProvider,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível iniciar o pagamento.'));
      }
      setTxResult(body.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-purple-400" />
            <h3 className="text-base font-bold">Subscrever Plano {plan.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-200">Plano selecionado</p>
              <p className="text-sm font-bold text-white">{plan.name}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-white">
                AOA {plan.priceAoa.toLocaleString('pt-PT')}
              </p>
              <p className="text-[11px] text-gray-400">por mês</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingMethods ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-purple-400 animate-spin" />
            </div>
          ) : txResult ? (
            <div className="space-y-3">
              {txResult.status === 'PAID' ? (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span>Pagamento confirmado oficialmente! O teu plano foi ativado.</span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <p className="font-semibold text-white">
                    Referência: <span className="text-purple-300">{txResult.reference}</span>
                  </p>
                  <p className="text-gray-300">
                    Estado atual: <strong>{txResult.status}</strong> — A aguardar confirmação oficial do fornecedor.
                  </p>
                  {txResult.paymentUrl && (
                    <a
                      href={txResult.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                    >
                      <span>Abrir página oficial de pagamento</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  {txResult.iframeUrl && (
                    <iframe
                      src={txResult.iframeUrl}
                      title="Pagamento EMIS"
                      sandbox="allow-scripts allow-forms allow-same-origin"
                      className="w-full h-72 rounded-xl border border-white/15 bg-white mt-2"
                    />
                  )}
                </div>
              )}
            </div>
          ) : !onlineEnabled || methods.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs">
              Ainda não existem métodos de pagamento online configurados e ativos para este plano no momento.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-300 font-medium">Escolhe o método de pagamento:</p>
              <div className="space-y-2">
                {methods.map((m) => (
                  <label
                    key={m.provider}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedProvider === m.provider
                        ? 'bg-purple-600/20 border-purple-400'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={selectedProvider === m.provider}
                        onChange={() => setSelectedProvider(m.provider)}
                        className="accent-purple-600"
                      />
                      <span className="text-sm font-medium text-white">{m.label}</span>
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/10 text-gray-300">
                      {m.environment}
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={!selectedProvider || submitting}
                className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                <span>Continuar para Pagamento</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
