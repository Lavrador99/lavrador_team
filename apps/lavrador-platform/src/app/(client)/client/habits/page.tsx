'use client';
import { useEffect, useState } from 'react';
import { habitsApi, HabitDto, HabitAdherence } from '../../../../lib/api/habits.api';

const todayStr = () => new Date().toISOString().split('T')[0];
const isLoggedToday = (h: HabitDto) => h.logs.some((l) => l.date.split('T')[0] === todayStr() && l.completed);
const last7Days = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0];
});

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

  if (loading) return <div className="py-20 font-mono text-sm text-muted text-center">A carregar hábitos...</div>;

  if (habits.length === 0) {
    return (
      <div>
        <h1 className="font-syne font-black text-2xl text-white mb-1">Os meus hábitos</h1>
        <p className="font-mono text-xs text-muted mb-6">// Rotinas diárias</p>
        <div className="py-16 font-mono text-sm text-muted text-center leading-relaxed">
          Ainda não tens hábitos definidos.<br />Fala com o teu treinador para começar!
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-2xl text-white">Os meus hábitos</h1>
          <p className="font-mono text-xs text-muted mt-1">// {habits.length} hábito{habits.length !== 1 ? 's' : ''} · hoje</p>
        </div>
        {adherence && (
          <div className="bg-accent/8 border border-accent/25 rounded-xl px-4 py-3 text-center flex-shrink-0">
            <div className="font-syne font-black text-2xl text-accent">{adherence.adherencePct}%</div>
            <div className="font-mono text-[9px] text-muted tracking-widest">adesão 7d</div>
          </div>
        )}
      </div>

      {/* Today's checklist */}
      <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-3">Hoje</p>
      <div className="flex flex-col gap-2 mb-8">
        {habits.map((habit) => {
          const done = isLoggedToday(habit);
          const toggling = togglingId === habit.id;
          return (
            <div key={habit.id} className={`flex items-center gap-4 bg-panel border rounded-xl px-4 py-3.5 transition-all ${
              done ? 'border-accent/20 opacity-70' : 'border-border'
            }`}>
              <span className="text-xl flex-shrink-0">{habit.icon ?? '●'}</span>
              <span className={`flex-1 font-sans text-sm font-medium transition-all ${done ? 'text-muted line-through' : 'text-white'}`}>
                {habit.name}
              </span>
              <button onClick={() => handleToggle(habit)} disabled={toggling}
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                  done ? 'border-accent bg-accent/15 text-accent' : 'border-[#2a2a35] text-faint hover:border-accent hover:text-accent'
                } disabled:opacity-50 disabled:cursor-wait`}>
                <span className="text-base">{done ? '✓' : '○'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* 7-day heatmap */}
      <p className="font-mono text-[9px] text-faint uppercase tracking-widest mb-3">Últimos 7 dias</p>
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Header */}
          <div className="flex items-center gap-1 mb-2">
            <div className="w-40 flex-shrink-0" />
            {days.map((d) => (
              <div key={d} className="flex-1 text-center font-mono text-[9px] text-faint uppercase tracking-widest">
                {new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'short' })}
              </div>
            ))}
          </div>
          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-1 mb-1.5">
              <div className="w-40 flex-shrink-0 font-mono text-[10px] text-muted truncate">
                {habit.icon} {habit.name}
              </div>
              {days.map((d) => {
                const log = habit.logs.find((l) => l.date.split('T')[0] === d);
                const done = log?.completed ?? false;
                return (
                  <div key={d} className={`flex-1 h-7 rounded transition-colors ${done ? 'bg-accent/45 border border-accent/30' : 'bg-[#1a1a22]'}`}
                    title={d} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
