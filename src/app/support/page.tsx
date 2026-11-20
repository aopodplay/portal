'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import PodPlaySidebar from '@/components/PodPlaySidebar';
import PlayerBar from '@/components/PlayerBar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithAuth } from '@/config/api';
import { getFriendlyErrorMessage, parseApiError } from '@/lib/errorHandler';
import {
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Mic2,
  CreditCard,
  Headphones,
  Paperclip,
  X,
} from 'lucide-react';

export default function SupportPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName || user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('geral');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [myTickets, setMyTickets] = useState<any[]>([]);

  const loadMyTickets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth('/api/v1/support/my');
      const body = await res.json();
      if (res.ok && body?.success && Array.isArray(body.data)) {
        setMyTickets(body.data);
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    loadMyTickets();
  }, [loadMyTickets]);

  const handleAttachmentChange = (file: File | null) => {
    if (!file) {
      setAttachment(null);
      return;
    }
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Formato não permitido. Envia apenas imagens (JPG, PNG, WEBP, GIF) ou PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('O ficheiro anexo não pode ultrapassar 10 MB.');
      return;
    }
    setError('');
    setAttachment(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const fd = new FormData();
      fd.append('name', name.trim() || user?.fullName || user?.username || 'Utilizador');
      if (email.trim() || user?.email) {
        fd.append('email', (email.trim() || user?.email || '') as string);
      }
      fd.append('category', category);
      fd.append('subject', subject.trim());
      fd.append('message', message.trim());
      if (attachment) {
        fd.append('attachment', attachment);
      }

      const res = await fetchWithAuth('/api/v1/support', {
        method: 'POST',
        body: fd,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(parseApiError(res, body, 'Não foi possível enviar o pedido de suporte.'));
      }
      setSubject('');
      setMessage('');
      setAttachment(null);
      setSuccess(body?.message || 'Pedido enviado! A equipa PodFéPlay responderá em breve.');
      window.dispatchEvent(new CustomEvent('podplay:notifications-updated'));
      await loadMyTickets();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'Não foi possível enviar o pedido de suporte.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950/80 to-slate-950 text-white">
      <PodPlaySidebar />

      <main className="ml-0 md:ml-60 min-h-screen pb-28 transition-all duration-300">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center">
              <HelpCircle size={24} className="text-purple-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Suporte PodFéPlay</h1>
              <p className="text-sm text-gray-400">
                Precisas de ajuda com a tua conta, Estúdio do Criador, pagamentos ou denúncias? Fala connosco.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Headphones, title: 'Conta & Acesso', desc: 'Recuperação de senha, sessões e preferências.' },
              { icon: Mic2, title: 'Estúdio & Artistas', desc: 'Verificação, uploads, agendamentos e pitching.' },
              { icon: CreditCard, title: 'Planos & Apoios', desc: 'Royalties (70%), doações (90%) e levantamentos.' },
              { icon: ShieldCheck, title: 'Moderação', desc: 'Revisão de conteúdos, denúncias e direitos autorais.' },
            ].map((card) => (
              <div key={card.title} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <card.icon size={18} className="text-purple-400 mb-2" />
                <h2 className="text-sm font-semibold text-white">{card.title}</h2>
                <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 shadow-lg"
          >
            <h2 className="text-lg font-bold text-white">Enviar Mensagem ao Suporte</h2>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}
            {success && (
              <div role="status" className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Email de contacto</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teu@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Tópico</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white"
                >
                  <option value="geral">Dúvida Geral</option>
                  <option value="conta">Conta & Palavra-passe</option>
                  <option value="estudio">Estúdio & Verificação de Artista</option>
                  <option value="pagamentos">Planos, Doações & Saques</option>
                  <option value="tecnico">Problema Técnico / Bug</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Assunto *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Resume o teu pedido"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">Mensagem *</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreve como podemos ajudar..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Anexo (opcional — JPG, PNG, WEBP, GIF ou PDF até 10 MB)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-dashed border-white/25 cursor-pointer text-xs text-gray-200 transition-colors">
                  <Paperclip size={14} className="text-purple-300" />
                  <span>{attachment ? attachment.name : 'Carregar ficheiro'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    className="hidden"
                    onChange={(e) => handleAttachmentChange(e.target.files?.[0] || null)}
                  />
                </label>
                {attachment && (
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 text-xs"
                  >
                    <X size={13} />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Enviar Pedido de Suporte
            </button>
          </form>

          {user && (
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              {(() => {
                const openTickets = myTickets.filter((tk) => tk.status !== 'resolved');
                return (
                  <>
                    <h2 className="text-lg font-bold text-white">
                      Pedidos em Aberto ({openTickets.length})
                    </h2>
                    {openTickets.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        Não tens pedidos em aberto. Pedidos resolvidos são removidos desta lista após notificação.
                      </p>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {openTickets.map((tk) => (
                          <div key={tk.id} className="py-3.5 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-white">
                                #{tk.id} · {tk.subject}
                              </p>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300">
                                Recebido · Em análise
                              </span>
                            </div>
                            <p className="text-xs text-gray-300">{tk.message}</p>
                            <p className="text-[11px] text-gray-500">
                              Enviado em {new Date(tk.created_at).toLocaleString('pt-PT')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
          )}
        </div>
      </main>

      <PlayerBar />
    </div>
  );
}
