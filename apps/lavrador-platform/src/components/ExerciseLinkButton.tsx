'use client';
import { useEffect, useState } from 'react';

interface Props {
  name: string;
  className?: string;
  label?: string;
}

function fitnessprogramerUrl(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  return `https://fitnessprogramer.com/exercise/${slug}/`;
}

function youtubeUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' exercise tutorial')}`;
}

export function ExerciseLinkButton({ name, className = '', label }: Props) {
  const [href, setHref] = useState<string | null>(null);
  const [isYoutube, setIsYoutube] = useState(false);

  useEffect(() => {
    const fp = fitnessprogramerUrl(name);
    fetch(`/api/check-exercise-url?url=${encodeURIComponent(fp)}`)
      .then((r) => r.json())
      .then(({ exists }: { exists: boolean }) => {
        if (exists) {
          setHref(fp);
          setIsYoutube(false);
        } else {
          setHref(youtubeUrl(name));
          setIsYoutube(true);
        }
      })
      .catch(() => {
        setHref(youtubeUrl(name));
        setIsYoutube(true);
      });
  }, [name]);

  if (!href) {
    return (
      <div className={`flex items-center justify-center gap-2 font-mono text-xs text-faint border border-border rounded-xl py-3 ${className}`}>
        A verificar...
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 font-mono text-xs border rounded-xl py-3 transition-colors ${
        isYoutube
          ? 'border-red-500/30 bg-red-500/5 text-red-400 hover:border-red-500/60 hover:bg-red-500/10'
          : 'border-accent/30 bg-accent/5 text-accent hover:border-accent/60 hover:bg-accent/10'
      } ${className}`}
    >
      {isYoutube ? (
        <>▶ {label ?? 'Ver no YouTube'} ↗</>
      ) : (
        <>{label ?? 'Ver exercício'} ↗</>
      )}
    </a>
  );
}
