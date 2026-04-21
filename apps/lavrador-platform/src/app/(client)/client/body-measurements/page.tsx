'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { bodyMeasurementsApi, BodyMeasurementDto } from '../../../../lib/api/body-measurements.api';

type MetricKey = 'peso' | 'pctGordura' | 'cc' | 'massaMagra' | 'fcRep';

const METRICS: { key: MetricKey; label: string; unit: string; color: string; icon: string }[] = [
  { key: 'peso',       label: 'Peso',        unit: 'kg',  color: 'text-[#84d4d3]',  icon: 'monitor_weight' },
  { key: 'pctGordura', label: '% Gordura',   unit: '%',   color: 'text-orange-400',  icon: 'water_drop' },
  { key: 'massaMagra', label: 'Massa magra', unit: 'kg',  color: 'text-blue-400',    icon: 'accessibility' },
  { key: 'cc',         label: 'Cintura',     unit: 'cm',  color: 'text-purple-400',  icon: 'straighten' },
  { key: 'fcRep',      label: 'FC Repouso',  unit: 'bpm', color: 'text-rose-400',    icon: 'favorite' },
];

function Sparkline({ data, color }: { data: (number | undefined)[]; color: string }) {
  const values = data.filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" className={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const EMPTY_FORM = { peso: '', pctGordura: '', massaMagra: '', cc: '', cq: '', cBraco: '', cCoxa: '', fcRep: '', pas: '', pad: '', notes: '', recordedAt: new Date().toISOString().split('T')[0] };

export default function BodyMeasurementsPage() {
  const [selected, setSelected] = useState<MetricKey>('peso');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: measurements = [], isLoading, mutate } = useSWR<BodyMeasurementDto[]>('my-body-measurements', bodyMeasurementsApi.getMy);

  const sorted = [...measurements].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const latest = sorted[sorted.length - 1];
  const first  = sorted[0];
  const metric = METRICS.find((m) => m.key === selected)!;
  const latestVal = latest?.[selected];
  const firstVal  = first?.[selected];
  const delta = latestVal != null && firstVal != null && latestVal !== firstVal
    ? Math.round((latestVal - firstVal) * 10) / 10 : null;

  async function handleSave() {
    setSaving(true);
    try {
      await bodyMeasurementsApi.create({
        clientId: '',
        recordedAt: form.recordedAt,
        peso:       form.peso ? parseFloat(form.peso) : undefined,
        pctGordura: form.pctGordura ? parseFloat(form.pctGordura) : undefined,
        massaMagra: form.massaMagra ? parseFloat(form.massaMagra) : undefined,
        cc:         form.cc ? parseFloat(form.cc) : undefined,
        cq:         form.cq ? parseFloat(form.cq) : undefined,
        cBraco:     form.cBraco ? parseFloat(form.cBraco) : undefined,
        cCoxa:      form.cCoxa ? parseFloat(form.cCoxa) : undefined,
        fcRep:      form.fcRep ? parseInt(form.fcRep) : undefined,
        pas:        form.pas ? parseInt(form.pas) : undefined,
        pad:        form.pad ? parseInt(form.pad) : undefined,
        notes:      form.notes || undefined,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      mutate();
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  if (isLoading) return <div className="py-20 text-sm text-zinc-500 text-center">A carregar medições...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Evolução</div>
          <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">Medições corporais</h1>
          <p className="text-xs text-zinc-500 mt-1">{measurements.length} registo{measurements.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-black active:scale-95 transition-all mt-1"
          style={{ background: '#c8f542' }}
        >
          <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Registar'}
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-5 mb-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-4">Nova medição</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { key: 'recordedAt', label: 'Data', type: 'date' },
              { key: 'peso',       label: 'Peso (kg)', type: 'number' },
              { key: 'pctGordura', label: '% Gordura', type: 'number' },
              { key: 'massaMagra', label: 'Massa magra (kg)', type: 'number' },
              { key: 'cc',         label: 'Cintura (cm)', type: 'number' },
              { key: 'cq',         label: 'Quadril (cm)', type: 'number' },
              { key: 'cBraco',     label: 'Braço (cm)', type: 'number' },
              { key: 'cCoxa',      label: 'Coxa (cm)', type: 'number' },
              { key: 'fcRep',      label: 'FC Repouso (bpm)', type: 'number' },
              { key: 'pas',        label: 'Pressão sist.', type: 'number' },
              { key: 'pad',        label: 'Pressão diast.', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#84d4d3]/60"
                  step={type === 'number' ? '0.1' : undefined}
                />
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Notas</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#84d4d3]/60"
              placeholder="Opcional..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full font-[Manrope] font-bold text-sm py-3 rounded-xl text-black disabled:opacity-50 active:scale-[0.98] transition-all"
            style={{ background: '#c8f542' }}
          >
            {saving ? 'A guardar...' : 'Guardar medição'}
          </button>
        </div>
      )}

      {measurements.length === 0 ? (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-zinc-700 mb-3 block">straighten</span>
          <div className="text-sm text-zinc-500">Sem medições registadas.<br />Clica em "Registar" para começar.</div>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {METRICS.slice(0, 2).map((m) => {
              const val = latest?.[m.key];
              const sparkData = sorted.map((s) => s[m.key] as number | undefined);
              return (
                <button key={m.key} onClick={() => setSelected(m.key)}
                  className={`rounded-2xl p-4 text-left border transition-all ${selected === m.key ? 'bg-zinc-800 border-[#84d4d3]/30' : 'bg-zinc-900 border-zinc-800/60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`material-symbols-outlined text-lg ${m.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                    <Sparkline data={sparkData} color={m.color} />
                  </div>
                  <div className={`font-[Manrope] font-black text-2xl ${m.color}`}>
                    {val != null ? val : '—'}<span className="text-sm ml-1 opacity-60">{m.unit}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{m.label}</div>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {METRICS.slice(2).map((m) => {
              const val = latest?.[m.key];
              const sparkData = sorted.map((s) => s[m.key] as number | undefined);
              return (
                <button key={m.key} onClick={() => setSelected(m.key)}
                  className={`rounded-2xl p-4 text-left border transition-all ${selected === m.key ? 'bg-zinc-800 border-[#84d4d3]/30' : 'bg-zinc-900 border-zinc-800/60'}`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <span className={`material-symbols-outlined text-base ${m.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                    <Sparkline data={sparkData} color={m.color} />
                  </div>
                  <div className={`font-[Manrope] font-black text-xl ${m.color}`}>
                    {val != null ? val : '—'}<span className="text-xs ml-1 opacity-60">{m.unit}</span>
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{m.label}</div>
                </button>
              );
            })}
          </div>

          {/* Delta */}
          {delta !== null && (
            <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800/60 mb-5">
              <span className={`material-symbols-outlined text-base ${delta > 0 ? 'text-orange-400' : 'text-[#84d4d3]'}`}>
                {delta > 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span className="text-xs text-zinc-400">Variação total em <strong className="text-white">{metric.label}</strong>:</span>
              <span className={`font-[Manrope] font-black text-sm ml-auto ${delta > 0 ? 'text-orange-400' : 'text-[#84d4d3]'}`}>
                {delta > 0 ? '+' : ''}{delta} {metric.unit}
              </span>
            </div>
          )}

          {/* History */}
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">Histórico — {metric.label}</div>
          <div className="flex flex-col gap-2">
            {[...sorted].reverse().map((m) => {
              const val = m[selected];
              return (
                <div key={m.id} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800/60">
                  <div className="text-xs text-zinc-500">
                    {new Date(m.recordedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <div className={`font-[Manrope] font-black text-sm ${metric.color}`}>
                    {val != null ? `${val} ${metric.unit}` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
