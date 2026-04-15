'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  gifUrl: string | null | undefined;
  alt: string;
  className?: string;
  /** false = imagem estática (só primeiro frame). true = loop entre todos os frames. */
  loop?: boolean;
}

/**
 * Dado o URL do primeiro frame (ex: .../0.jpg), tenta carregar .../1.jpg, .../2.jpg, ...
 * até receber um erro — devolve todos os frames encontrados.
 */
function discoverFrames(firstUrl: string): Promise<string[]> {
  const match = firstUrl.match(/^(.+\/)(\d+)\.(jpg|jpeg|png|webp)$/i);
  if (!match) return Promise.resolve([firstUrl]);

  const base = match[1];
  const ext = match[3];
  const frames: string[] = [firstUrl];

  return new Promise((resolve) => {
    let idx = 1;

    const tryNext = () => {
      if (idx >= 10) { resolve(frames); return; } // safety cap
      const url = `${base}${idx}.${ext}`;
      const img = new Image();
      img.onload = () => { frames.push(url); idx++; tryNext(); };
      img.onerror = () => resolve(frames);
      img.src = url;
    };

    tryNext();
  });
}

function ExerciseFallback({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-zinc-900 ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-1/2 h-1/2 opacity-30">
        <rect x="4" y="28" width="8" height="10" rx="3" fill="currentColor" className="text-zinc-400"/>
        <rect x="52" y="28" width="8" height="10" rx="3" fill="currentColor" className="text-zinc-400"/>
        <rect x="10" y="24" width="6" height="18" rx="2" fill="currentColor" className="text-zinc-400"/>
        <rect x="48" y="24" width="6" height="18" rx="2" fill="currentColor" className="text-zinc-400"/>
        <rect x="16" y="29" width="32" height="8" rx="4" fill="currentColor" className="text-zinc-400"/>
        <circle cx="32" cy="10" r="6" fill="currentColor" className="text-zinc-400"/>
        <path d="M24 22c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-zinc-400"/>
      </svg>
    </div>
  );
}

export function ExerciseImageLoop({ gifUrl, alt, className = '', loop = true }: Props) {
  const [frames, setFrames] = useState<string[]>(gifUrl ? [gifUrl] : []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!gifUrl) { setFrames([]); return; }
    setImgError(false);
    if (!loop) { setFrames([gifUrl]); setActiveIdx(0); return; }

    setActiveIdx(0);
    discoverFrames(gifUrl).then(setFrames);
  }, [gifUrl, loop]);

  // Iniciar/parar o loop
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!loop || frames.length <= 1) return;

    timerRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % frames.length);
    }, 2000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loop, frames]);

  if (!gifUrl || imgError) {
    return <ExerciseFallback className={className} />;
  }

  return (
    <img
      src={loop ? frames[activeIdx] : gifUrl}
      alt={alt}
      className={className}
      onError={() => setImgError(true)}
    />
  );
}
