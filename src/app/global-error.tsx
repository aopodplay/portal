'use client';

import { getFriendlyErrorMessage } from '@/lib/errorHandler';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = getFriendlyErrorMessage(
    error,
    'Ocorreu um contratempo inesperado na aplicação. Tenta novamente dentro de instantes.'
  );

  return (
    <html lang="pt">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold mb-2">Serviço temporariamente indisponível</h1>
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-gray-200 transition"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
