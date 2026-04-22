'use client';
import { useEffect, useRef, useState } from 'react';
import { AchievementDto } from '@libs/types';

interface Props {
  achievement: AchievementDto;
  onDismiss: () => void;
}

export function AchievementCelebration({ achievement, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-400 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-8px',
              background: ['#c8f542', '#84d4d3', '#ffffff', '#f59e0b', '#818cf8'][i % 5],
              animation: `confetti-fall ${1.5 + Math.random() * 2}s ${Math.random() * 0.8}s ease-in forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 bg-surface-container-lowest rounded-2xl p-8 flex flex-col items-center text-center max-w-xs mx-4 shadow-2xl"
        style={{ border: '1px solid rgba(200, 245, 66, 0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 20px rgba(200,245,66,0.6))' }}>
          {achievement.icon}
        </div>
        <div className="font-label text-xs text-primary uppercase tracking-widest mb-2">
          Conquista desbloqueada!
        </div>
        <div className="font-headline font-black text-xl text-on-surface mb-2">
          {achievement.name}
        </div>
        <div className="font-label text-sm text-secondary leading-relaxed">
          {achievement.description}
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
          className="mt-6 kinetic-gradient text-on-primary font-headline font-bold px-6 py-2.5 rounded-xl text-sm"
        >
          Continuar
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
