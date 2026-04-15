'use client';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({ title, onClose, children, footer, maxWidth = 'max-w-md' }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-on-surface/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-surface-container-lowest rounded-2xl p-6 w-full ${maxWidth} shadow-ambient-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-headline font-black text-xl text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-5 pt-4 border-t border-outline-variant/10">{footer}</div>}
      </div>
    </div>
  );
}
