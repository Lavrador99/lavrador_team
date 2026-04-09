'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { workoutsApi } from '../../../../lib/api/workouts.api';

interface CalendarEntry {
  id: string;
  date: string;
  workoutName: string | null;
  durationMin?: number | null;
}

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function buildGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Monday = 0
  const grid: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) grid.push(null);
  for (let d = 1; d <= last.getDate(); d++) grid.push(d);
  return grid;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<number | null>(null);

  const { data: entries = [] } = useSWR<CalendarEntry[]>('my-calendar', () => workoutsApi.getMyCalendar());

  // Build date → entry map
  const dateMap = new Map<string, CalendarEntry>();
  for (const e of entries) {
    const key = e.date.slice(0, 10);
    dateMap.set(key, e);
  }

  const grid = buildGrid(year, month);
  const totalDays = entries.length;
  const totalMin = entries.reduce((s, e) => s + (e.durationMin ?? 0), 0);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
    setSelected(null);
  }

  function dateKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const selectedEntry = selected ? dateMap.get(dateKey(selected)) : null;

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-2">Calendário</h1>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-panel border border-border rounded-xl px-4 py-3 flex-1">
          <div className="font-syne font-black text-2xl text-accent">{totalDays}</div>
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-0.5">Dias treinados</div>
        </div>
        <div className="bg-panel border border-border rounded-xl px-4 py-3 flex-1">
          <div className="font-syne font-black text-2xl text-[#f5a442]">{Math.round(totalMin / 60)}h</div>
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-0.5">Total de treino</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-panel border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-muted hover:text-white transition-colors px-2">←</button>
          <span className="font-syne font-bold text-sm text-white">
            {MONTHS_PT[month]} {year}
          </span>
          <button onClick={nextMonth} className="text-muted hover:text-white transition-colors px-2">→</button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center font-mono text-[10px] text-faint tracking-widest">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (!d) return <div key={i} />;
            const key = dateKey(d);
            const trained = dateMap.has(key);
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSel = selected === d;
            return (
              <button
                key={i}
                onClick={() => setSelected(d === selected ? null : d)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all text-sm ${
                  isSel
                    ? 'bg-accent text-dark font-black'
                    : isToday
                    ? 'border border-accent/40 text-accent'
                    : trained
                    ? 'bg-accent/10 text-white'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="font-mono text-xs">{d}</span>
                {trained && !isSel && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="mt-4 bg-panel border border-border rounded-xl p-4">
          {selectedEntry ? (
            <>
              <div className="font-mono text-[10px] text-accent tracking-widest uppercase mb-2">
                {String(selected).padStart(2, '0')} {MONTHS_PT[month]}
              </div>
              <div className="font-syne font-bold text-base text-white">{selectedEntry.workoutName}</div>
              {selectedEntry.durationMin && (
                <div className="font-mono text-xs text-muted mt-1">{selectedEntry.durationMin} min</div>
              )}
            </>
          ) : (
            <div className="font-mono text-xs text-muted">Sem treino registado neste dia.</div>
          )}
        </div>
      )}
    </div>
  );
}
