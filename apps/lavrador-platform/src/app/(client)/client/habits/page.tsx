'use client';
import { useEffect, useState } from 'react';
import { habitsApi, HabitDto, HabitAdherence } from '../../../../lib/api/habits.api';

const todayStr = () => new Date().toISOString().split('T')[0];
const isLoggedToday = (h: HabitDto) =>
  h.logs.some((l) => l.date.split('T')[0] === todayStr() && l.completed);
const last7Days = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

function CircleRing({ pct }: { pct: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="110" height="110" className="flex-shrink-0">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke="#84d4d3" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="51" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="Manrope,sans-serif">{pct}%</text>
      <text x="55" y="65" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="Inter,sans-serif" letterSpacing="2">ADESÃO</text>
    </svg>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [adherence, setAdherence] = useState<HabitAdherence | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    Promise.all([habitsApi.getMy(), habitsApi.getMyAdherence()])
      .then(([h, a]) => { setHabits(h); setAdherence(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (habit: HabitDto) => {
    const done = isLoggedToday(habit);
    setTogglingId(habit.id);
    try { await habitsApi.log(habit.id, todayStr(), !done); load(); }
    finally { setTogglingId(null); }
  };

  const days = last7Days();
  const doneTodayCount = habits.filter(isLoggedToday).length;

  if (loading) {
    return <div className="py-20 text-sm text-zinc-500 text-center">A carregar hábitos...</div>;
  }

  if (habits.length === 0) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-4xl text-zinc-700 mb-3 block">self_improvement</span>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Ainda não tens hábitos definidos.<br />Fala com o teu treinador para começar!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Rotina diária</div>
          <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">Os meus hábitos</h1>
          <p className="text-xs text-zinc-500 mt-1">{doneTodayCount}/{habits.length} completos hoje</p>
        </div>
        {adherence && <CircleRing pct={adherence.adherencePct} />}
      </div>

      {/* ── Daily checklist ──────────────────────────────────────────────────── */}
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">Hoje</div>
      <div className="flex flex-col gap-2 mb-8">
        {habits.map((habit) => {
          const done = isLoggedToday(habit);
          const toggling = togglingId === habit.id;
          return (
            <div
              key={habit.id}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 border transition-all ${
                done ? 'bg-[#005050]/15 border-[#84d4d3]/20' : 'bg-zinc-900 border-zinc-800/60'
              }`}
            >
              <span className="text-xl flex-shrink-0">{habit.icon ?? '●'}</span>
              <span className={`flex-1 text-sm font-medium transition-all ${
                done ? 'text-zinc-500 line-through' : 'text-white'
              }`}>
                {habit.name}
              </span>
              <button
                onClick={() => handleToggle(habit)}
                disabled={toggling}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50 active:scale-90 ${
                  done ? 'bg-[#005050] border border-[#84d4d3]/30' : 'bg-zinc-800 border border-zinc-700/60'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-base ${done ? 'text-[#84d4d3]' : 'text-zinc-600'}`}
                  style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── 7-day heatmap ────────────────────────────────────────────────────── */}
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">Últimos 7 dias</div>
      <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/60 overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Day labels */}
          <div className="flex items-center gap-1 mb-2 pl-[120px]">
            {days.map((d) => (
              <div key={d} className="flex-1 text-center text-[10px] font-bold text-zinc-600 uppercase">
                {new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3)}
              </div>
            ))}
          </div>
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-1 mb-1.5">
              <div className="w-[120px] flex-shrink-0 text-xs text-zinc-500 truncate pr-3">
                {habit.icon} {habit.name}
              </div>
              {days.map((d) => {
                const log = habit.logs.find((l) => l.date.split('T')[0] === d);
                const done = log?.completed ?? false;
                return (
                  <div
                    key={d}
                    className={`flex-1 h-6 rounded-lg transition-colors ${done ? 'bg-[#005050]' : 'bg-zinc-800'}`}
                    title={d}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
