'use client';
import { usePushNotifications } from '../../lib/hooks/usePushNotifications';

export function PushNotificationToggle() {
  const { state, subscribe, unsubscribe } = usePushNotifications();

  if (state === 'unsupported') return null;

  const isLoading    = state === 'loading';
  const isSubscribed = state === 'subscribed';
  const isDenied     = state === 'denied';

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-900 border border-zinc-800/60 px-5 py-4">
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined text-xl"
          style={{
            color: isSubscribed ? '#c8f542' : isDenied ? '#ef4444' : '#71717a',
            fontVariationSettings: "'FILL' 1",
          }}
        >
          {isSubscribed ? 'notifications_active' : isDenied ? 'notifications_off' : 'notifications'}
        </span>
        <div>
          <div className="text-sm font-semibold text-white">Notificações push</div>
          <div className="text-[11px] text-zinc-400">
            {isDenied
              ? 'Bloqueadas no browser — activa nas definições'
              : isSubscribed
              ? 'Activas — recebes alertas do teu PT'
              : 'Recebe lembretes de treino e mensagens do PT'}
          </div>
        </div>
      </div>

      {!isDenied && (
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
            isSubscribed ? 'bg-[#c8f542]' : 'bg-zinc-700'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              isSubscribed ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      )}
    </div>
  );
}
