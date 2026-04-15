/** Shared Tailwind class strings — admin (light/Material) theme */

export const INPUT_CLS =
  'w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-0 focus:bg-surface-container-lowest border-b-2 border-transparent focus:border-primary outline-none transition-all';

export const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

export const SELECT_CLS =
  'bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface font-body focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest outline-none transition-all';

/** Status lookups reused across admin pages */
export const SESSION_STATUS_STYLE: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  SCHEDULED: { dot: 'bg-blue-500',   bg: 'bg-blue-50',            text: 'text-blue-700',  border: 'border-l-blue-500' },
  COMPLETED: { dot: 'bg-primary',    bg: 'bg-primary-fixed/40',   text: 'text-primary',   border: 'border-l-primary' },
  CANCELLED: { dot: 'bg-error',      bg: 'bg-error-container/40', text: 'text-error',     border: 'border-l-error' },
  NO_SHOW:   { dot: 'bg-orange-400', bg: 'bg-orange-50',          text: 'text-orange-600',border: 'border-l-orange-400' },
};

export const SESSION_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada', COMPLETED: 'Concluída', CANCELLED: 'Cancelada', NO_SHOW: 'Falta',
};

export const SESSION_TYPE_LABEL: Record<string, string> = {
  TRAINING: 'Treino', ASSESSMENT: 'Avaliação', FOLLOWUP: 'Follow-up',
};

export const INVOICE_STATUS_STYLE: Record<string, { dot: string; text: string; badge: string }> = {
  PENDING:   { dot: 'bg-blue-500',  text: 'text-blue-700',   badge: 'bg-blue-50 text-blue-700' },
  PAID:      { dot: 'bg-primary',   text: 'text-primary',    badge: 'bg-primary-fixed text-primary' },
  OVERDUE:   { dot: 'bg-error',     text: 'text-error',      badge: 'bg-error-container text-on-error-container' },
  CANCELLED: { dot: 'bg-outline',   text: 'text-secondary',  badge: 'bg-surface-container text-secondary' },
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Em atraso', CANCELLED: 'Cancelado',
};

export const LEVEL_STYLE: Record<string, string> = {
  INICIANTE:  'text-orange-600 bg-orange-50',
  INTERMEDIO: 'text-blue-700 bg-blue-50',
  AVANCADO:   'text-primary bg-primary-fixed',
  iniciante:  'text-orange-600 bg-orange-50',
  intermedio: 'text-blue-700 bg-blue-50',
  avancado:   'text-primary bg-primary-fixed',
};
