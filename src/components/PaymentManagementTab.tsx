'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Power,
  Activity,
  History,
  Layers,
  Eye,
  X,
} from 'lucide-react';
import { fetchWithAuth } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';
import ActionModal, { ActionModalConfig } from '@/components/ActionModal';

type SubTab = 'providers' | 'plans' | 'monitoring' | 'audit';

interface ProviderConfig {
  provider: 'emis' | 'paypay';
  isActive: boolean;
  environment: 'sandbox' | 'production';
  integrationMode: 'api' | 'iframe';
  status:
    | 'not_configured'
    | 'configured_inactive'
    | 'active'
    | 'connection_error'
    | 'needs_validation';
  lastTestedAt: string | null;
  lastTestMessage: string | null;
  credentialsStatus: {
    hasMerchantId: boolean;
    merchantIdMasked: string | null;
    hasClientId: boolean;
    clientIdMasked: string | null;
    hasClientSecret: boolean;
    hasApiKey: boolean;
    hasWebhookSecret: boolean;
  };
  endpoints: {
    apiBaseUrl?: string;
    authEndpoint?: string;
    createPaymentEndpoint?: string;
    queryPaymentEndpoint?: string;
    cancelEndpoint?: string;
    confirmEndpoint?: string;
    returnUrl?: string;
    webhookUrl?: string;
    iframeUrl?: string;
    allowedMethods?: string[];
  };
}

interface PlanRule {
  planKey: string;
  planName: string;
  priceUsd: number;
  priceAoa: number;
  allowEmis: boolean;
  allowPaypay: boolean;
  onlinePaymentEnabled: boolean;
  autoPaymentEnabled: boolean;
  allowedMethods: string[];
}

const STATUS_BADGE: Record<
  ProviderConfig['status'],
  { label: string; cls: string }
> = {
  not_configured: {
    label: 'Não configurada',
    cls: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  },
  configured_inactive: {
    label: 'Configurada (Inativa)',
    cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  active: {
    label: 'Ativa',
    cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  connection_error: {
    label: 'Erro de conexão',
    cls: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  needs_validation: {
    label: 'Necessita de validação',
    cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
};

const STORAGE_TOKEN_KEY = 'podplay_payment_admin_token';
const STORAGE_EXP_KEY = 'podplay_payment_admin_exp';

export default function PaymentManagementTab() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string>('');

  // Auth forms
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Stage 3: Email OTP state
  const [otpChallenge, setOtpChallenge] = useState<{
    challengeToken: string;
    maskedEmail: string;
    expiresAt: number;
    resendAvailableAt: number;
  } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Change password modal
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  // Main data
  const [subTab, setSubTab] = useState<SubTab>('providers');
  const [loadingData, setLoadingData] = useState(false);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [planRules, setPlanRules] = useState<PlanRule[]>([]);
  const [dashboard, setDashboard] = useState<{
    summary: { total: number; pending: number; paid: number; failed: number; volumeAoa: number };
    byProvider: any[];
    transactions: any[];
    auditLogs: any[];
  } | null>(null);

  // Filters
  const [txProviderFilter, setTxProviderFilter] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('');
  const [txPlanFilter, setTxPlanFilter] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Feedback
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<ActionModalConfig | null>(null);

  // Provider form drafts
  const [drafts, setDrafts] = useState<
    Record<
      'emis' | 'paypay',
      {
        environment: 'sandbox' | 'production';
        integrationMode: 'api' | 'iframe';
        merchantId: string;
        clientId: string;
        clientSecret: string;
        apiKey: string;
        webhookSecret: string;
        apiBaseUrl: string;
        authEndpoint: string;
        createPaymentEndpoint: string;
        queryPaymentEndpoint: string;
        cancelEndpoint: string;
        confirmEndpoint: string;
        returnUrl: string;
        webhookUrl: string;
        iframeUrl: string;
        allowedMethodsText: string;
      }
    >
  >({
    emis: {
      environment: 'sandbox',
      integrationMode: 'api',
      merchantId: '',
      clientId: '',
      clientSecret: '',
      apiKey: '',
      webhookSecret: '',
      apiBaseUrl: '',
      authEndpoint: '',
      createPaymentEndpoint: '',
      queryPaymentEndpoint: '',
      cancelEndpoint: '',
      confirmEndpoint: '',
      returnUrl: '',
      webhookUrl: '',
      iframeUrl: '',
      allowedMethodsText: '',
    },
    paypay: {
      environment: 'sandbox',
      integrationMode: 'api',
      merchantId: '',
      clientId: '',
      clientSecret: '',
      apiKey: '',
      webhookSecret: '',
      apiBaseUrl: '',
      authEndpoint: '',
      createPaymentEndpoint: '',
      queryPaymentEndpoint: '',
      cancelEndpoint: '',
      confirmEndpoint: '',
      returnUrl: '',
      webhookUrl: '',
      iframeUrl: '',
      allowedMethodsText: '',
    },
  });

  const notifySuccess = (msg: string) => {
    setBannerError(null);
    setBannerSuccess(msg);
    setTimeout(() => setBannerSuccess(null), 5000);
  };

  const lockSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_TOKEN_KEY);
      sessionStorage.removeItem(STORAGE_EXP_KEY);
    }
    setPaymentToken('');
    setUnlocked(false);
    setPasswordInput('');
  }, []);

  const paymentFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}, overrideToken?: string) => {
      const tok = overrideToken || paymentToken;
      const res = await fetchWithAuth(endpoint, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(tok ? { 'X-Payment-Auth': tok } : {}),
        },
      });
      if (res.status === 401) {
        const body = await res.clone().json().catch(() => null);
        if (body?.requiresPaymentAuth) {
          lockSession();
        }
      }
      return res;
    },
    [paymentToken, lockSession]
  );

  const checkAccess = useCallback(async () => {
    try {
      setCheckingAccess(true);
      let storedToken = '';
      if (typeof window !== 'undefined') {
        const t = sessionStorage.getItem(STORAGE_TOKEN_KEY) || '';
        const exp = Number(sessionStorage.getItem(STORAGE_EXP_KEY) || 0);
        if (t && exp > Date.now()) {
          storedToken = t;
        } else {
          sessionStorage.removeItem(STORAGE_TOKEN_KEY);
          sessionStorage.removeItem(STORAGE_EXP_KEY);
        }
      }

      const res = await fetchWithAuth('/api/v1/admin/payments/access-status', {
        headers: storedToken ? { 'X-Payment-Auth': storedToken } : {},
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.success && body.data) {
        setHasPassword(Boolean(body.data.hasPassword));
        setLockedUntil(body.data.lockedUntil || null);
        if (body.data.unlocked && storedToken) {
          setPaymentToken(storedToken);
          setUnlocked(true);
        } else {
          setUnlocked(false);
        }
      }
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setCheckingAccess(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (!otpChallenge) {
      setOtpSecondsLeft(0);
      setResendSecondsLeft(0);
      return;
    }
    const tick = () => {
      const now = Date.now();
      setOtpSecondsLeft(Math.max(0, Math.ceil((otpChallenge.expiresAt - now) / 1000)));
      setResendSecondsLeft(Math.max(0, Math.ceil((otpChallenge.resendAvailableAt - now) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [otpChallenge]);

  const hydrateDrafts = (list: ProviderConfig[]) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const p of list) {
        next[p.provider] = {
          environment: p.environment,
          integrationMode: p.integrationMode,
          merchantId: '',
          clientId: '',
          clientSecret: '',
          apiKey: '',
          webhookSecret: '',
          apiBaseUrl: p.endpoints.apiBaseUrl || '',
          authEndpoint: p.endpoints.authEndpoint || '',
          createPaymentEndpoint: p.endpoints.createPaymentEndpoint || '',
          queryPaymentEndpoint: p.endpoints.queryPaymentEndpoint || '',
          cancelEndpoint: p.endpoints.cancelEndpoint || '',
          confirmEndpoint: p.endpoints.confirmEndpoint || '',
          returnUrl: p.endpoints.returnUrl || '',
          webhookUrl: p.endpoints.webhookUrl || '',
          iframeUrl: p.endpoints.iframeUrl || '',
          allowedMethodsText: (p.endpoints.allowedMethods || []).join(', '),
        };
      }
      return next;
    });
  };

  const loadPaymentCenterData = useCallback(async () => {
    if (!unlocked || !paymentToken) return;
    try {
      setLoadingData(true);
      setBannerError(null);
      const q = new URLSearchParams();
      if (txProviderFilter) q.set('provider', txProviderFilter);
      if (txStatusFilter) q.set('status', txStatusFilter);
      if (txPlanFilter) q.set('planKey', txPlanFilter);
      if (txSearch.trim()) q.set('search', txSearch.trim());

      const [provRes, planRes, dashRes] = await Promise.all([
        paymentFetch('/api/v1/admin/payments/providers'),
        paymentFetch('/api/v1/admin/payments/plan-methods'),
        paymentFetch(`/api/v1/admin/payments/dashboard?${q.toString()}`),
      ]);

      const [provBody, planBody, dashBody] = await Promise.all([
        provRes.json().catch(() => null),
        planRes.json().catch(() => null),
        dashRes.json().catch(() => null),
      ]);

      if (provRes.ok && provBody?.success) {
        setProviders(provBody.data || []);
        hydrateDrafts(provBody.data || []);
      }
      if (planRes.ok && planBody?.success) {
        setPlanRules(planBody.data || []);
      }
      if (dashRes.ok && dashBody?.success) {
        setDashboard(dashBody.data || null);
      }
    } catch (err) {
      setBannerError(getFriendlyErrorMessage(err));
    } finally {
      setLoadingData(false);
    }
  }, [unlocked, paymentToken, paymentFetch, txProviderFilter, txStatusFilter, txPlanFilter, txSearch]);

  useEffect(() => {
    if (unlocked && paymentToken) {
      loadPaymentCenterData();
    }
  }, [unlocked, paymentToken, loadPaymentCenterData]);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passwordInput.length < 10) {
      setAuthError('A palavra-passe exclusiva deve ter pelo menos 10 caracteres.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('As palavras-passe não coincidem.');
      return;
    }
    try {
      setAuthSubmitting(true);
      const res = await fetchWithAuth('/api/v1/admin/payments/setup-password', {
        method: 'POST',
        body: JSON.stringify({
          password: passwordInput,
          confirmPassword: confirmPasswordInput,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível criar a palavra-passe.'));
      }
      setHasPassword(true);
      setPasswordInput('');
      setConfirmPasswordInput('');
      if (body.data?.requiresOtp) {
        setOtpChallenge({
          challengeToken: body.data.challengeToken,
          maskedEmail: body.data.maskedEmail,
          expiresAt: body.data.expiresAt,
          resendAvailableAt: body.data.resendAvailableAt,
        });
        setOtpCode('');
      }
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passwordInput) return;
    try {
      setAuthSubmitting(true);
      const res = await fetchWithAuth('/api/v1/admin/payments/unlock', {
        method: 'POST',
        body: JSON.stringify({ password: passwordInput }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        if (body?.lockedUntil) setLockedUntil(body.lockedUntil);
        throw new Error(parseApiError(res, body, 'Palavra-passe incorreta.'));
      }
      setLockedUntil(null);
      setPasswordInput('');
      if (body.data?.requiresOtp) {
        setOtpChallenge({
          challengeToken: body.data.challengeToken,
          maskedEmail: body.data.maskedEmail,
          expiresAt: body.data.expiresAt,
          resendAvailableAt: body.data.resendAvailableAt,
        });
        setOtpCode('');
      }
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpChallenge || otpCode.trim().length !== 6) return;
    setAuthError(null);
    try {
      setAuthSubmitting(true);
      const res = await fetchWithAuth('/api/v1/admin/payments/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          challengeToken: otpChallenge.challengeToken,
          code: otpCode.trim(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Código de verificação inválido ou expirado.'));
      }
      const { paymentToken: tok, expiresAt } = body.data;
      sessionStorage.setItem(STORAGE_TOKEN_KEY, tok);
      sessionStorage.setItem(STORAGE_EXP_KEY, String(expiresAt));
      setPaymentToken(tok);
      setOtpChallenge(null);
      setOtpCode('');
      setUnlocked(true);
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpChallenge || resendSecondsLeft > 0 || resendingOtp) return;
    setAuthError(null);
    try {
      setResendingOtp(true);
      const res = await fetchWithAuth('/api/v1/admin/payments/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ challengeToken: otpChallenge.challengeToken }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível reenviar o código.'));
      }
      setOtpChallenge({
        challengeToken: body.data.challengeToken,
        maskedEmail: body.data.maskedEmail,
        expiresAt: body.data.expiresAt,
        resendAvailableAt: body.data.resendAvailableAt,
      });
      setOtpCode('');
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setResendingOtp(false);
    }
  };

  const handleStartForgotPassword = async () => {
    setAuthError(null);
    try {
      setAuthSubmitting(true);
      const res = await fetchWithAuth('/api/v1/admin/payments/forgot-password', {
        method: 'POST',
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível iniciar a recuperação.'));
      }
      setRecoveryMode(true);
      setOtpChallenge({
        challengeToken: body.data.challengeToken,
        maskedEmail: body.data.maskedEmail,
        expiresAt: body.data.expiresAt,
        resendAvailableAt: body.data.resendAvailableAt,
      });
      setOtpCode('');
      setPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResetExclusivePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpChallenge) return;
    setAuthError(null);
    if (passwordInput.length < 10) {
      setAuthError('A nova palavra-passe exclusiva deve ter pelo menos 10 caracteres.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('As palavras-passe não coincidem.');
      return;
    }
    try {
      setAuthSubmitting(true);
      const res = await fetchWithAuth('/api/v1/admin/payments/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          challengeToken: otpChallenge.challengeToken,
          code: otpCode.trim(),
          newPassword: passwordInput,
          confirmPassword: confirmPasswordInput,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível redefinir a palavra-passe.'));
      }
      const { paymentToken: tok, expiresAt } = body.data;
      sessionStorage.setItem(STORAGE_TOKEN_KEY, tok);
      sessionStorage.setItem(STORAGE_EXP_KEY, String(expiresAt));
      setPaymentToken(tok);
      setRecoveryMode(false);
      setOtpChallenge(null);
      setOtpCode('');
      setPasswordInput('');
      setConfirmPasswordInput('');
      setLockedUntil(null);
      setUnlocked(true);
    } catch (err) {
      setAuthError(getFriendlyErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleChangeExclusivePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 10) {
      setBannerError('A nova palavra-passe deve ter pelo menos 10 caracteres.');
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setBannerError('As novas palavras-passe não coincidem.');
      return;
    }
    try {
      setChangingPwd(true);
      const res = await paymentFetch('/api/v1/admin/payments/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
          confirmPassword: confirmNewPwd,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body));
      }
      setShowChangePwd(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmNewPwd('');
      notifySuccess('Palavra-passe exclusiva da Gestão de Pagamentos alterada com sucesso.');
    } catch (err) {
      setBannerError(getFriendlyErrorMessage(err));
    } finally {
      setChangingPwd(false);
    }
  };

  const handleSaveProvider = async (provider: 'emis' | 'paypay') => {
    const d = drafts[provider];
    try {
      setBusyAction(`save-${provider}`);
      setBannerError(null);
      const res = await paymentFetch(`/api/v1/admin/payments/providers/${provider}`, {
        method: 'PUT',
        body: JSON.stringify({
          environment: d.environment,
          integrationMode: d.integrationMode,
          credentials: {
            merchantId: d.merchantId,
            clientId: d.clientId,
            clientSecret: d.clientSecret,
            apiKey: d.apiKey,
            webhookSecret: d.webhookSecret,
          },
          endpoints: {
            apiBaseUrl: d.apiBaseUrl,
            authEndpoint: d.authEndpoint,
            createPaymentEndpoint: d.createPaymentEndpoint,
            queryPaymentEndpoint: d.queryPaymentEndpoint,
            cancelEndpoint: d.cancelEndpoint,
            confirmEndpoint: d.confirmEndpoint,
            returnUrl: d.returnUrl,
            webhookUrl: d.webhookUrl,
            iframeUrl: d.iframeUrl,
            allowedMethods: d.allowedMethodsText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          },
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body));
      }
      notifySuccess(
        `Configuração de ${provider === 'emis' ? 'MULTICAIXA Express (EMIS)' : 'PayPay África'} guardada.`
      );
      await loadPaymentCenterData();
    } catch (err) {
      setBannerError(getFriendlyErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleTestProvider = async (provider: 'emis' | 'paypay') => {
    try {
      setBusyAction(`test-${provider}`);
      setBannerError(null);
      const res = await paymentFetch(`/api/v1/admin/payments/providers/${provider}/test`, {
        method: 'POST',
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body));
      }
      notifySuccess(body.message || 'Teste de ligação concluído.');
      await loadPaymentCenterData();
    } catch (err) {
      setBannerError(getFriendlyErrorMessage(err));
      await loadPaymentCenterData();
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleProvider = (p: ProviderConfig) => {
    const next = !p.isActive;
    const label = p.provider === 'emis' ? 'MULTICAIXA Express (EMIS)' : 'PayPay África';
    setModalConfig({
      mode: 'confirm',
      title: `${next ? 'Ativar' : 'Desativar'} ${label}`,
      message: next
        ? `Tens a certeza que pretendes ativar ${label} para pagamentos na plataforma?`
        : `Ao desativar ${label}, este método deixará imediatamente de aparecer no checkout de todos os planos.`,
      confirmLabel: next ? 'Ativar' : 'Desativar',
      danger: !next,
      onConfirm: async () => {
        try {
          setBusyAction(`toggle-${p.provider}`);
          const res = await paymentFetch(`/api/v1/admin/payments/providers/${p.provider}/toggle`, {
            method: 'POST',
            body: JSON.stringify({ isActive: next }),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.success) {
            throw new Error(parseApiError(res, body));
          }
          notifySuccess(body.message || 'Estado atualizado.');
          await loadPaymentCenterData();
        } catch (err) {
          setBannerError(getFriendlyErrorMessage(err));
        } finally {
          setBusyAction(null);
        }
      },
    });
  };

  const handleSavePlanRule = async (rule: PlanRule) => {
    try {
      setBusyAction(`plan-${rule.planKey}`);
      const res = await paymentFetch(`/api/v1/admin/payments/plan-methods/${rule.planKey}`, {
        method: 'PUT',
        body: JSON.stringify(rule),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body));
      }
      setPlanRules(body.data || []);
      notifySuccess(`Permissões do plano ${rule.planName} atualizadas.`);
    } catch (err) {
      setBannerError(getFriendlyErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // 2ª E 3ª CAMADAS DE AUTENTICAÇÃO (PALAVRA-PASSE EXCLUSIVA + OTP POR E-MAIL)
  // =========================================================================
  if (!unlocked && otpChallenge && recoveryMode) {
    const mins = Math.floor(otpSecondsLeft / 60);
    const secs = otpSecondsLeft % 60;
    const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
      <div className="max-w-md mx-auto my-8 bg-white/5 border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center">
            <KeyRound size={20} className="text-purple-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Redefinir Palavra-passe Exclusiva</h2>
            <p className="text-xs text-gray-400">Verificação por e-mail obrigatória</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed mb-3">
          Enviámos um código de 6 dígitos para o e-mail de administrador{' '}
          <strong className="text-purple-200">{otpChallenge.maskedEmail}</strong>. Introduz o
          código e define uma nova palavra-passe exclusiva.
        </p>

        <div className="mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <span className="text-gray-400">Validade do código</span>
          <span
            className={`font-mono font-bold ${
              otpSecondsLeft <= 30 ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {otpSecondsLeft > 0 ? formattedCountdown : 'Expirado'}
          </span>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleResetExclusivePassword} className="space-y-3.5">
          <div>
            <label className="block text-xs text-gray-300 mb-1">Código de 6 dígitos *</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-center text-lg tracking-[0.45em] font-mono font-bold text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Nova palavra-passe exclusiva (mínimo 10 caracteres) *
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Diferente da palavra-passe da conta"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Confirmar nova palavra-passe *
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={confirmPasswordInput}
              onChange={(e) => setConfirmPasswordInput(e.target.value)}
              placeholder="Repete a nova palavra-passe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={authSubmitting || otpCode.length !== 6 || otpSecondsLeft <= 0}
            className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {authSubmitting && <Loader2 size={16} className="animate-spin" />}
            <span>Redefinir e Aceder</span>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendSecondsLeft > 0 || resendingOtp}
              className="flex-1 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white disabled:opacity-40"
            >
              {resendingOtp
                ? 'A reenviar...'
                : resendSecondsLeft > 0
                  ? `Reenviar código (${resendSecondsLeft}s)`
                  : 'Reenviar código'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRecoveryMode(false);
                setOtpChallenge(null);
                setOtpCode('');
                setAuthError(null);
              }}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!unlocked && otpChallenge) {
    const mins = Math.floor(otpSecondsLeft / 60);
    const secs = otpSecondsLeft % 60;
    const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
      <div className="max-w-md mx-auto my-8 bg-white/5 border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center">
            <ShieldCheck size={20} className="text-purple-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Verificação de Segurança</h2>
            <p className="text-xs text-gray-400">Etapa 3 de 3 · Código enviado por e-mail</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed mb-3">
          Para proteger as configurações de pagamento, enviámos um código de verificação
          para o e-mail associado à tua conta de administrador:{' '}
          <strong className="text-purple-200">{otpChallenge.maskedEmail}</strong>.
        </p>

        <div className="mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <span className="text-gray-400">Validade do código</span>
          <span
            className={`font-mono font-bold ${
              otpSecondsLeft <= 30 ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {otpSecondsLeft > 0 ? formattedCountdown : 'Expirado'}
          </span>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Código de 6 dígitos *
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-center text-xl tracking-[0.5em] font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={authSubmitting || otpCode.length !== 6 || otpSecondsLeft <= 0}
            className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {authSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>Verificar código</span>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendSecondsLeft > 0 || resendingOtp}
              className="flex-1 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white disabled:opacity-40 transition-colors"
            >
              {resendingOtp
                ? 'A reenviar...'
                : resendSecondsLeft > 0
                  ? `Reenviar código (${resendSecondsLeft}s)`
                  : 'Reenviar código'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpChallenge(null);
                setOtpCode('');
                setAuthError(null);
              }}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white/5 border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center">
            <Lock size={20} className="text-purple-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {hasPassword
                ? 'Autenticação da Gestão de Pagamentos'
                : 'Configurar Palavra-passe Exclusiva'}
            </h2>
            <p className="text-xs text-gray-400">
              Camada de segurança independente da conta de administrador
            </p>
          </div>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {lockedUntil && new Date(lockedUntil).getTime() > Date.now() && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
            Acesso temporariamente bloqueado até{' '}
            <strong>{new Date(lockedUntil).toLocaleTimeString('pt-PT')}</strong>.
          </div>
        )}

        {!hasPassword ? (
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              Como é o primeiro acesso ao Centro de Gestão de Pagamentos, cria uma
              palavra-passe exclusiva (mínimo 10 caracteres, diferente da palavra-passe
              da tua conta).
            </p>
            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Palavra-passe exclusiva *
              </label>
              <input
                type="password"
                required
                minLength={10}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Mínimo 10 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Confirmar palavra-passe *
              </label>
              <input
                type="password"
                required
                minLength={10}
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Repete a palavra-passe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              <span>Criar Palavra-passe e Aceder</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Palavra-passe exclusiva da Gestão de Pagamentos *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Introduz a palavra-passe exclusiva"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Unlock size={16} />
              )}
              <span>Desbloquear Gestão de Pagamentos</span>
            </button>

            <button
              type="button"
              onClick={handleStartForgotPassword}
              disabled={authSubmitting}
              className="w-full text-center text-xs text-purple-300 hover:text-purple-200 underline pt-1 disabled:opacity-50"
            >
              Esqueci a palavra-passe exclusiva
            </button>
          </form>
        )}
      </div>
    );
  }

  // =========================================================================
  // PAINEL PRINCIPAL DA GESTÃO DE PAGAMENTOS
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Cabeçalho e controlos de sessão */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <CreditCard size={20} className="text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Centro de Gestão de Pagamentos
            </h2>
            <p className="text-xs text-gray-400">
              MULTICAIXA Express (EMIS) & PayPay África · Sessão segura ativa
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChangePwd(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
          >
            <KeyRound size={14} />
            <span>Alterar Palavra-passe</span>
          </button>
          <button
            type="button"
            onClick={lockSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs text-red-200 transition-colors"
          >
            <Lock size={14} />
            <span>Bloquear Sessão</span>
          </button>
        </div>
      </div>

      {bannerError && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{bannerError}</span>
        </div>
      )}

      {bannerSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {/* Sub-abas */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'providers', label: 'Fornecedores (EMIS & PayPay)', icon: CreditCard },
          { key: 'plans', label: 'Disponibilidade por Plano', icon: Layers },
          { key: 'monitoring', label: 'Monitorização & Transações', icon: Activity },
          { key: 'audit', label: 'Histórico de Auditoria', icon: History },
        ].map((st) => (
          <button
            key={st.key}
            type="button"
            onClick={() => setSubTab(st.key as SubTab)}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === st.key
                ? 'bg-purple-600 text-white shadow'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <st.icon size={14} />
            <span>{st.label}</span>
          </button>
        ))}
      </div>

      {loadingData && providers.length === 0 ? (
        <div className="flex justify-center py-14">
          <Loader2 size={28} className="text-purple-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* SUB-ABA 1: FORNECEDORES */}
          {subTab === 'providers' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {(['emis', 'paypay'] as const).map((provKey) => {
                const info = providers.find((p) => p.provider === provKey);
                const d = drafts[provKey];
                const badge = STATUS_BADGE[info?.status || 'not_configured'];
                const title =
                  provKey === 'emis'
                    ? 'MULTICAIXA Express – EMIS'
                    : 'PayPay África';

                return (
                  <div
                    key={provKey}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{title}</h3>
                        <span
                          className={`inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTestProvider(provKey)}
                          disabled={busyAction === `test-${provKey}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white disabled:opacity-50"
                        >
                          {busyAction === `test-${provKey}` ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RefreshCw size={13} />
                          )}
                          <span>Testar Conexão</span>
                        </button>

                        {info && (
                          <button
                            type="button"
                            onClick={() => handleToggleProvider(info)}
                            disabled={busyAction === `toggle-${provKey}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                              info.isActive
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30'
                            }`}
                          >
                            <Power size={13} />
                            <span>{info.isActive ? 'Desativar' : 'Ativar'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {info?.lastTestMessage && (
                      <p className="text-[11px] text-gray-300 bg-white/5 px-3 py-2 rounded-xl">
                        Último teste: {info.lastTestMessage}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">
                          Ambiente
                        </label>
                        <select
                          value={d.environment}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [provKey]: {
                                ...prev[provKey],
                                environment: e.target.value as 'sandbox' | 'production',
                              },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-xs text-white"
                        >
                          <option value="sandbox">Sandbox (Testes)</option>
                          <option value="production">Produção</option>
                        </select>
                      </div>

                      {provKey === 'emis' && (
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">
                            Método de Integração
                          </label>
                          <select
                            value={d.integrationMode}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                emis: {
                                  ...prev.emis,
                                  integrationMode: e.target.value as 'api' | 'iframe',
                                },
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-xs text-white"
                          >
                            <option value="api">API Direta</option>
                            <option value="iframe">iFrame Autorizado EMIS</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Credenciais encriptadas (nunca expostas após guardadas) */}
                    <div className="space-y-2.5 pt-2 border-t border-white/10">
                      <p className="text-xs font-semibold text-purple-200">
                        Credenciais (encriptadas em repouso — deixa em branco para manter a atual)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">
                            Merchant ID{' '}
                            {info?.credentialsStatus.hasMerchantId && (
                              <span className="text-emerald-400">
                                ({info.credentialsStatus.merchantIdMasked})
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={d.merchantId}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [provKey]: { ...prev[provKey], merchantId: e.target.value },
                              }))
                            }
                            placeholder={
                              info?.credentialsStatus.hasMerchantId
                                ? 'Configurado (substituir opcional)'
                                : 'Merchant ID oficial'
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">
                            Client ID{' '}
                            {info?.credentialsStatus.hasClientId && (
                              <span className="text-emerald-400">
                                ({info.credentialsStatus.clientIdMasked})
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={d.clientId}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [provKey]: { ...prev[provKey], clientId: e.target.value },
                              }))
                            }
                            placeholder={
                              info?.credentialsStatus.hasClientId
                                ? 'Configurado (substituir opcional)'
                                : 'Client ID oficial'
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">
                            Client Secret{' '}
                            {info?.credentialsStatus.hasClientSecret && (
                              <span className="text-emerald-400">(Configurado)</span>
                            )}
                          </label>
                          <input
                            type="password"
                            value={d.clientSecret}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [provKey]: { ...prev[provKey], clientSecret: e.target.value },
                              }))
                            }
                            placeholder={
                              info?.credentialsStatus.hasClientSecret
                                ? '•••••••• (substituir opcional)'
                                : 'Client Secret'
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">
                            API Key{' '}
                            {info?.credentialsStatus.hasApiKey && (
                              <span className="text-emerald-400">(Configurada)</span>
                            )}
                          </label>
                          <input
                            type="password"
                            value={d.apiKey}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [provKey]: { ...prev[provKey], apiKey: e.target.value },
                              }))
                            }
                            placeholder={
                              info?.credentialsStatus.hasApiKey
                                ? '•••••••• (substituir opcional)'
                                : 'API Key'
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-gray-400 mb-1">
                            Webhook Signing Secret{' '}
                            {info?.credentialsStatus.hasWebhookSecret && (
                              <span className="text-emerald-400">(Configurado)</span>
                            )}
                          </label>
                          <input
                            type="password"
                            value={d.webhookSecret}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [provKey]: { ...prev[provKey], webhookSecret: e.target.value },
                              }))
                            }
                            placeholder={
                              info?.credentialsStatus.hasWebhookSecret
                                ? '•••••••• (substituir opcional)'
                                : 'Segredo HMAC para validar webhooks'
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Endpoints Oficiais */}
                    <div className="space-y-2.5 pt-2 border-t border-white/10">
                      <p className="text-xs font-semibold text-purple-200">
                        Endpoints & URLs Oficiais
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {provKey === 'paypay' && (
                          <input
                            type="url"
                            value={d.apiBaseUrl}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                paypay: { ...prev.paypay, apiBaseUrl: e.target.value },
                              }))
                            }
                            placeholder="API Base URL (https://...)"
                            className="sm:col-span-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        )}
                        <input
                          type="url"
                          value={d.authEndpoint}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [provKey]: { ...prev[provKey], authEndpoint: e.target.value },
                            }))
                          }
                          placeholder="Endpoint de autenticação"
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                        />
                        <input
                          type="url"
                          value={d.createPaymentEndpoint}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [provKey]: { ...prev[provKey], createPaymentEndpoint: e.target.value },
                            }))
                          }
                          placeholder="Endpoint de criação de pagamentos"
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                        />
                        <input
                          type="url"
                          value={d.queryPaymentEndpoint}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [provKey]: { ...prev[provKey], queryPaymentEndpoint: e.target.value },
                            }))
                          }
                          placeholder="Endpoint de consulta de pagamentos"
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                        />
                        {provKey === 'emis' ? (
                          <input
                            type="url"
                            value={d.cancelEndpoint}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                emis: { ...prev.emis, cancelEndpoint: e.target.value },
                              }))
                            }
                            placeholder="Endpoint de cancelamento (opcional)"
                            className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        ) : (
                          <input
                            type="url"
                            value={d.confirmEndpoint}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                paypay: { ...prev.paypay, confirmEndpoint: e.target.value },
                              }))
                            }
                            placeholder="Endpoint de confirmação"
                            className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        )}
                        <input
                          type="url"
                          value={d.returnUrl}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [provKey]: { ...prev[provKey], returnUrl: e.target.value },
                            }))
                          }
                          placeholder="Return URL"
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                        />
                        <input
                          type="url"
                          value={d.webhookUrl}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [provKey]: { ...prev[provKey], webhookUrl: e.target.value },
                            }))
                          }
                          placeholder={`Webhook URL (/api/payments/webhooks/${provKey})`}
                          className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                        />
                        {provKey === 'emis' && d.integrationMode === 'iframe' && (
                          <input
                            type="url"
                            value={d.iframeUrl}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                emis: { ...prev.emis, iframeUrl: e.target.value },
                              }))
                            }
                            placeholder="URL oficial do iFrame EMIS (https://...)"
                            className="sm:col-span-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        )}
                        {provKey === 'paypay' && (
                          <input
                            type="text"
                            value={d.allowedMethodsText}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                paypay: { ...prev.paypay, allowedMethodsText: e.target.value },
                              }))
                            }
                            placeholder="Métodos PayPay (ex: wallet, qr_code, card)"
                            className="sm:col-span-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveProvider(provKey)}
                      disabled={busyAction === `save-${provKey}`}
                      className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {busyAction === `save-${provKey}` && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      <span>Guardar Configurações de {provKey.toUpperCase()}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUB-ABA 2: DISPONIBILIDADE POR PLANO */}
          {subTab === 'plans' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Disponibilidade de Pagamentos por Plano
                </h3>
                <p className="text-xs text-gray-400">
                  Um método globalmente desativado nunca poderá ser usado no checkout, mesmo que permitido no plano.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {planRules.map((rule) => (
                  <div
                    key={rule.planKey}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{rule.planName}</h4>
                        <p className="text-xs text-purple-300">
                          {rule.priceAoa === 0
                            ? 'Gratuito'
                            : `AOA ${rule.priceAoa.toLocaleString('pt-PT')} / mês`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-200">
                      {[
                        { field: 'allowEmis', label: 'MULTICAIXA Express (EMIS) permitido' },
                        { field: 'allowPaypay', label: 'PayPay África permitido' },
                        { field: 'onlinePaymentEnabled', label: 'Pagamento online ativo' },
                        { field: 'autoPaymentEnabled', label: 'Renovação / pagamento automático' },
                      ].map((item) => (
                        <label
                          key={item.field}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 cursor-pointer"
                        >
                          <span>{item.label}</span>
                          <input
                            type="checkbox"
                            checked={Boolean((rule as any)[item.field])}
                            onChange={(e) =>
                              setPlanRules((prev) =>
                                prev.map((r) =>
                                  r.planKey === rule.planKey
                                    ? { ...r, [item.field]: e.target.checked }
                                    : r
                                )
                              )
                            }
                            className="h-4 w-4 rounded accent-purple-600"
                          />
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSavePlanRule(rule)}
                      disabled={busyAction === `plan-${rule.planKey}`}
                      className="w-full py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {busyAction === `plan-${rule.planKey}` && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      <span>Guardar Regras do Plano</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-ABA 3: MONITORIZAÇÃO */}
          {subTab === 'monitoring' && dashboard && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Total Transações', val: dashboard.summary.total },
                  { label: 'Pendentes', val: dashboard.summary.pending },
                  { label: 'Concluídas (PAID)', val: dashboard.summary.paid },
                  { label: 'Falhadas / Canceladas', val: dashboard.summary.failed },
                  {
                    label: 'Volume Recebido',
                    val: `AOA ${dashboard.summary.volumeAoa.toLocaleString('pt-PT')}`,
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <p className="text-lg font-bold text-white">{kpi.val}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Pesquisar referência, utilizador ou ID..."
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white min-w-[220px]"
                />
                <select
                  value={txProviderFilter}
                  onChange={(e) => setTxProviderFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white"
                >
                  <option value="">Todos os fornecedores</option>
                  <option value="emis">MULTICAIXA Express</option>
                  <option value="paypay">PayPay África</option>
                </select>
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white"
                >
                  <option value="">Todos os estados</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
                <select
                  value={txPlanFilter}
                  onChange={(e) => setTxPlanFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white"
                >
                  <option value="">Todos os planos</option>
                  {planRules.map((p) => (
                    <option key={p.planKey} value={p.planKey}>
                      {p.planName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-300 uppercase">
                    <tr>
                      <th className="px-4 py-3">Referência / UUID</th>
                      <th className="px-4 py-3">Utilizador</th>
                      <th className="px-4 py-3">Plano</th>
                      <th className="px-4 py-3">Fornecedor</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dashboard.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{tx.reference}</p>
                          <p className="text-[10px] text-gray-400">{tx.transaction_uuid}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-200">
                          {tx.full_name || tx.username || `ID #${tx.user_id}`}
                        </td>
                        <td className="px-4 py-3 uppercase text-purple-300 font-semibold">
                          {tx.plan_key}
                        </td>
                        <td className="px-4 py-3 uppercase text-gray-200">{tx.provider}</td>
                        <td className="px-4 py-3 text-white font-semibold">
                          {tx.currency} {Number(tx.amount).toLocaleString('pt-PT')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-semibold">
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {dashboard.transactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">
                          Nenhuma transação encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-ABA 4: AUDITORIA */}
          {subTab === 'audit' && dashboard && (
            <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
              {dashboard.auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-purple-300">{log.action}</span>
                    {log.target_provider && (
                      <span className="ml-2 uppercase px-2 py-0.5 rounded bg-white/10 text-[10px]">
                        {log.target_provider}
                      </span>
                    )}
                    <p className="text-gray-300 mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right text-[11px] text-gray-400">
                    <p>@{log.actor_username || 'sistema'} · {log.ip_address}</p>
                    <p>{new Date(log.created_at).toLocaleString('pt-PT')}</p>
                  </div>
                </div>
              ))}
              {dashboard.auditLogs.length === 0 && (
                <p className="p-8 text-center text-xs text-gray-400">
                  Sem registos de auditoria até ao momento.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal detalhes de transação */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Detalhes da Transação</h3>
              <button type="button" onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-1.5">
              <p><strong>UUID:</strong> {selectedTx.transaction_uuid}</p>
              <p><strong>ID Externo:</strong> {selectedTx.external_id || '—'}</p>
              <p><strong>Referência:</strong> {selectedTx.reference}</p>
              <p><strong>Fornecedor:</strong> {String(selectedTx.provider).toUpperCase()}</p>
              <p><strong>Plano:</strong> {selectedTx.plan_key}</p>
              <p><strong>Valor:</strong> {selectedTx.currency} {Number(selectedTx.amount).toLocaleString('pt-PT')}</p>
              <p><strong>Estado:</strong> {selectedTx.status}</p>
              <p><strong>Criado em:</strong> {new Date(selectedTx.created_at).toLocaleString('pt-PT')}</p>
              <p>
                <strong>Confirmado em:</strong>{' '}
                {selectedTx.confirmed_at ? new Date(selectedTx.confirmed_at).toLocaleString('pt-PT') : 'Pendente'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal alterar palavra-passe exclusiva */}
      {showChangePwd && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setShowChangePwd(false)}
        >
          <form
            onSubmit={handleChangeExclusivePassword}
            className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Alterar Palavra-passe Exclusiva</h3>
              <button type="button" onClick={() => setShowChangePwd(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <input
              type="password"
              required
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="Palavra-passe atual"
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
            />
            <input
              type="password"
              required
              minLength={10}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Nova palavra-passe (mínimo 10 caracteres)"
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
            />
            <input
              type="password"
              required
              minLength={10}
              value={confirmNewPwd}
              onChange={(e) => setConfirmNewPwd(e.target.value)}
              placeholder="Confirmar nova palavra-passe"
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white"
            />
            <button
              type="submit"
              disabled={changingPwd}
              className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white disabled:opacity-50"
            >
              {changingPwd ? 'A guardar...' : 'Atualizar Palavra-passe'}
            </button>
          </form>
        </div>
      )}

      <ActionModal config={modalConfig} onClose={() => setModalConfig(null)} />
    </div>
  );
}
