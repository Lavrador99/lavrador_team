'use client';
import useSWR from 'swr';
import { api } from '../../lib/api/axios';

type EventType = 'SESSION' | 'ASSESSMENT' | 'WORKOUT_LOG' | 'PERSONAL_RECORD';

interface TimelineEvent {
  id: string;
  date: string;
  type: EventType;
  title: string;
  subtitle?: string;
  badge?: string;
}

interface ClinicalSummary {
  assessmentId: string;
  assessmentDate: string;
  level: string;
  flags: string[];
  lesoes: unknown;
  objetivo: unknown;
  diasSemana: unknown;
  pas: unknown;
  pad: unknown;
}

const EVENT_CONFIG: Record<EventType, { icon: string; color: string; dot: string }> = {
  SESSION:         { icon: 'calendar_today',    color: 'text-[#84d4d3]',  dot: 'bg-[#84d4d3]'  },
  ASSESSMENT:      { icon: 'assignment',         color: 'text-blue-400',   dot: 'bg-blue-400'    },
  WORKOUT_LOG:     { icon: 'fitness_center',     color: 'text-[#c8f542]',  dot: 'bg-[#c8f542]'  },
  PERSONAL_RECORD: { icon: 'emoji_events',       color: 'text-yellow-400', dot: 'bg-yellow-400'  },
};

const FLAG_LABELS: Record<string, string> = {
  hipertensao:   'Hipertensão',
  joelho:        'Lesão joelho',
  evitar_lombar: 'Lombar',
  evitar_ombro:  'Ombro',
  sedentario:    'Sedentário',
  contraindicado:'Contraindicado',
};

function fetchTimeline(clientId: string) {
  return () => api.get(`/users/clients/${clientId}/timeline`).then((r) => r.data as TimelineEvent[]);
}

function fetchClinical(clientId: string) {
  return () => api.get(`/users/clients/${clientId}/clinical-summary`).then((r) => r.data as ClinicalSummary | null);
}

interface Props {
  clientId: string;
}

export function ClientTimeline({ clientId }: Props) {
  const { data: events = [], isLoading: loadingTimeline } = useSWR(`timeline-${clientId}`, fetchTimeline(clientId));
  const { data: clinical, isLoading: loadingClinical }     = useSWR(`clinical-${clientId}`, fetchClinical(clientId));

  return (
    <div className="space-y-5">

      {/* ── Resumo clínico fixo ─────────────────────────────────────────── */}
      {loadingClinical ? (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5 animate-pulse h-24" />
      ) : clinical ? (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-base text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Resumo clínico</div>
            <span className="ml-auto text-[10px] font-bold text-zinc-500">
              {new Date(clinical.assessmentDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-zinc-800/60 rounded-xl px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Nível</div>
              <div className="font-bold text-sm text-white mt-0.5">{clinical.level}</div>
            </div>
            <div className="bg-zinc-800/60 rounded-xl px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Objetivo</div>
              <div className="font-bold text-sm text-white mt-0.5 truncate">{String(clinical.objetivo ?? '—')}</div>
            </div>
            {clinical.pas && (
              <div className="bg-zinc-800/60 rounded-xl px-3 py-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Pressão arterial</div>
                <div className="font-bold text-sm text-white mt-0.5">{String(clinical.pas)}/{String(clinical.pad)} mmHg</div>
              </div>
            )}
            {clinical.diasSemana && (
              <div className="bg-zinc-800/60 rounded-xl px-3 py-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Dias/semana</div>
                <div className="font-bold text-sm text-white mt-0.5">{String(clinical.diasSemana)}x</div>
              </div>
            )}
          </div>

          {/* Flags */}
          {clinical.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {clinical.flags.map((f) => (
                <span key={f} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-400/10 text-red-400">
                  {FLAG_LABELS[f] ?? f}
                </span>
              ))}
            </div>
          )}

          {/* Lesões */}
          {clinical.lesoes && (
            <div className="mt-2 text-[11px] text-zinc-400 italic">
              Lesões/restrições: {String(clinical.lesoes)}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800/60 p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-4">Timeline</div>

        {loadingTimeline ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-zinc-700 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-zinc-800 rounded w-3/4 mb-1" />
                  <div className="h-2 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-sm">Nenhuma actividade registada.</div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-zinc-800" />

            <div className="space-y-4 pl-6">
              {events.map((event) => {
                const cfg = EVENT_CONFIG[event.type];
                return (
                  <div key={event.id} className="relative">
                    {/* Dot */}
                    <div className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full ${cfg.dot} ring-2 ring-zinc-900`} />

                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-sm ${cfg.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {cfg.icon}
                          </span>
                          <span className="text-sm font-semibold text-white">{event.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 flex-shrink-0">
                          {new Date(event.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      {event.subtitle && (
                        <div className="text-[11px] text-zinc-400 mt-0.5 ml-5">{event.subtitle}</div>
                      )}
                      {event.badge && event.type === 'PERSONAL_RECORD' && (
                        <span className="inline-block mt-1 ml-5 text-[9px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                          NOVO PR
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
