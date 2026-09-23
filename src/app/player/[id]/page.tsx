// app/player/[id]/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { historyApi } from '@/lib/historyApi';

export default function PlayerPage({ params }: { params: { id: string } }) {
  const contentId = Number(params.id);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSaved = useRef(0);
  const [resumed, setResumed] = useState(false);

  // 1) Ao abrir, pergunta ao backend onde parou
  useEffect(() => {
    (async () => {
      try {
        const rp = await historyApi.getResumePoint(contentId);
        if (rp && rp.position > 0 && audioRef.current) {
          audioRef.current.currentTime = rp.position;
          setResumed(true);
        }
      } catch { /* ignora — sem histórico é normal */ }
    })();
  }, [contentId]);

  // 2) Guarda o progresso a cada ~10s de reprodução
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const cur = audio.currentTime;
    if (cur - lastSaved.current < 10) return;
    lastSaved.current = cur;

    historyApi
      .recordPlayback({
        contentId,
        progress: cur,
        completed: false,
        deviceType: 'web',
      })
      .catch((e) => console.warn('Falha ao gravar progresso:', e));
  };

  // 3) Ao terminar, marca como concluído
  const handleEnded = () => {
    historyApi.markCompleted(contentId).catch(() => {});
  };

  // 4) Ao fechar/desmontar, faz flush final
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio && audio.currentTime > 0) {
        // navigator.sendBeacon é ideal aqui — não é bloqueado pelo unload
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/history/playback`;
        const payload = JSON.stringify({
          contentId,
          progress: audio.currentTime,
          completed: false,
          deviceType: 'web',
        });
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      }
    };
  }, [contentId]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <h1 className="text-white text-xl mb-4">Episódio #{contentId}</h1>
      {resumed && (
        <p className="text-purple-300 text-sm mb-2">↺ Retomado de onde paraste</p>
      )}
      <audio
        ref={audioRef}
        src="/audio/episodio.mp3"
        controls
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="w-full max-w-md"
      />
    </div>
  );
}