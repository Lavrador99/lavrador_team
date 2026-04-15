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
  const startDow = (first.getDay() + 6) % 7;
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

  const dateMap = new Map<string, CalendarEntry>();
  for (const e of entries) dateMap.set(e.date.slice(0, 10), e);

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
  function goToday() {
    setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today.getDate());
  }
  function dateKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const selectedEntry = selected ? dateMap.get(dateKey(selected)) : null;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Histórico</div>
        <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">Calendário</h1>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-[#84d4d3]/20">
          <div className="font-[Manrope] font-black text-3xl text-[#84d4d3]">{totalDays}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">Dias treinados</div>
        </div>
        <div className="bg-zinc-900 rounded-2xl px-4 py-4 border border-zinc-800/60">
          <div className="font-[Manrope] font-black text-3xl text-white">{Math.round(totalMin / 60)}h</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">Total de treino</div>
        </div>
      </div>

      {/* ── Calendar grid ────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/60">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-zinc-600 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-[Manrope] font-bold text-sm text-white">
              {MONTHS_PT[month]} {year}
            </span>
            <button
              onClick={goToday}
              className="text-[10px] font-bold uppercase tracking-widest text-[#84d4d3] bg-[#005050]/30 px-2 py-0.5 rounded-lg"
            >
              Hoje
            </button>
          </div>
          <button onClick={nextMonth} className="text-zinc-600 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-zinc-600">{d}</div>
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
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-xs font-bold ${
                  isSel
                    ? 'text-black'
                    : isToday
                    ? 'bg-[#005050]/40 text-[#84d4d3] border border-[#84d4d3]/30'
                    : trained
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-700 hover:text-zinc-400'
                }`}
                style={isSel ? { background: '#c8f542' } : {}}
              >
                {d}
                {trained && !isSel && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#84d4d3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected day detail ──────────────────────────────────────────────── */}
      {selected && (
        <div className="mt-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800/60">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#84d4d3] mb-2">
            {String(selected).padStart(2, '0')} {MONTHS_PT[month]}
          </div>
          {selectedEntry ? (
            <>
              <div className="font-[Manrope] font-bold text-base text-white">{selectedEntry.workoutName}</div>
              {selectedEntry.durationMin && (
                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {selectedEntry.durationMin} min
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-zinc-500">Sem treino registado neste dia.</div>
          )}
        </div>
      )}
    </div>
  );
}
