'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  gifUrl: string;
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

export function ExerciseImageLoop({ gifUrl, alt, className = '', loop = true }: Props) {
  const [frames, setFrames] = useState<string[]>([gifUrl]);
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Descobrir todos os frames quando entra em modo loop
  useEffect(() => {
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

  return (
    <img
      src={loop ? frames[activeIdx] : gifUrl}
      alt={alt}
      className={className}
    />
  );
}
