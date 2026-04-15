'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { assessmentsApi } from '../../../../lib/api/prescription.api';
import { AssessmentDto } from '@libs/types';

type MetricKey = 'peso' | 'bmi' | 'pctGordura' | 'cc' | 'fcRep';

const METRICS: { key: MetricKey; label: string; unit: string; color: string; icon: string }[] = [
  { key: 'peso',       label: 'Peso',          unit: 'kg',  color: 'text-[#84d4d3]',  icon: 'monitor_weight' },
  { key: 'bmi',        label: 'IMC',           unit: '',    color: 'text-blue-400',    icon: 'calculate' },
  { key: 'pctGordura', label: '% Gordura',     unit: '%',   color: 'text-orange-400',  icon: 'water_drop' },
  { key: 'cc',         label: 'Circ. Cintura', unit: 'cm',  color: 'text-purple-400',  icon: 'straighten' },
  { key: 'fcRep',      label: 'FC Repouso',    unit: 'bpm', color: 'text-rose-400',    icon: 'favorite' },
];

function calcBMI(peso?: number, altura?: number): number | null {
  if (!peso || !altura) return null;
  const h = altura / 100;
  return Math.round((peso / (h * h)) * 10) / 10;
}

function bmiLabel(bmi: number | null): { label: string; color: string } {
  if (!bmi) return { label: '—', color: 'text-zinc-500' };
  if (bmi < 18.5) return { label: 'Baixo peso', color: 'text-blue-400' };
  if (bmi < 25)   return { label: 'Normal',     color: 'text-[#84d4d3]' };
  if (bmi < 30)   return { label: 'Excesso',    color: 'text-orange-400' };
  return             { label: 'Obesidade',    color: 'text-red-400' };
}

export default function BodyMeasurementsPage() {
  const [selected, setSelected] = useState<MetricKey>('peso');
  const { data: assessments = [], isLoading } = useSWR<AssessmentDto[]>('my-assessments', assessmentsApi.getMy);

  const measurements = [...assessments]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      date: a.createdAt,
      peso:       a.data.peso,
      bmi:        calcBMI(a.data.peso, a.data.altura),
      pctGordura: a.data.pctGordura,
      cc:         a.data.cc,
      fcRep:      a.data.fcRep,
    }));

  if (isLoading) return <div className="py-20 text-sm text-zinc-500 text-center">A carregar medições...</div>;

  if (!measurements.length) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-4xl text-zinc-700 mb-3 block">straighten</span>
        <div className="text-sm text-zinc-500">Ainda não tens avaliações registadas.</div>
      </div>
    );
  }

  const latest = measurements[measurements.length - 1];
  const first  = measurements[0];
  const metric = METRICS.find((m) => m.key === selected)!;
  const latestVal = latest[selected];
  const firstVal  = first[selected];
  const delta = latestVal != null && firstVal != null
    ? Math.round((latestVal - firstVal) * 10) / 10
    : null;
  const bmiInfo = bmiLabel(latest.bmi);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Evolução</div>
        <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">Medições corporais</h1>
        <p className="text-xs text-zinc-500 mt-1">{measurements.length} avaliação{measurements.length !== 1 ? 'ões' : ''}</p>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {METRICS.slice(0, 2).map((m) => {
          const val = latest[m.key];
          const isActive = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              className={`rounded-2xl p-4 text-left transition-all border ${
                isActive ? 'bg-zinc-800 border-[#84d4d3]/30' : 'bg-zinc-900 border-zinc-800/60'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${m.color} mb-2 block`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
              <div className={`font-[Manrope] font-black text-2xl ${m.color}`}>
                {val != null ? val : '—'}<span className="text-sm ml-1 opacity-60">{m.unit}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{m.label}</div>
              {m.key === 'bmi' && <div className={`text-xs mt-0.5 ${bmiInfo.color}`}>{bmiInfo.label}</div>}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {METRICS.slice(2).map((m) => {
          const val = latest[m.key];
          const isActive = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              className={`rounded-2xl p-4 text-left transition-all border ${
                isActive ? 'bg-zinc-800 border-[#84d4d3]/30' : 'bg-zinc-900 border-zinc-800/60'
              }`}
            >
              <span className={`material-symbols-outlined text-base ${m.color} mb-1.5 block`} style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
              <div className={`font-[Manrope] font-black text-xl ${m.color}`}>
                {val != null ? val : '—'}<span className="text-xs ml-1 opacity-60">{m.unit}</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{m.label}</div>
            </button>
          );
        })}
      </div>

      {/* ── Delta ─────────────────────────────────────────────────────────────── */}
      {delta !== null && (
        <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800/60 mb-5">
          <span className={`material-symbols-outlined text-base ${delta > 0 ? 'text-orange-400' : delta < 0 ? 'text-[#84d4d3]' : 'text-zinc-500'}`}>
            {delta > 0 ? 'trending_up' : delta < 0 ? 'trending_down' : 'trending_flat'}
          </span>
          <span className="text-xs text-zinc-400">Variação total em <strong className="text-white">{metric.label}</strong>:</span>
          <span className={`font-[Manrope] font-black text-sm ml-auto ${delta > 0 ? 'text-orange-400' : delta < 0 ? 'text-[#84d4d3]' : 'text-zinc-400'}`}>
            {delta > 0 ? '+' : ''}{delta} {metric.unit}
          </span>
        </div>
      )}

      {/* ── History ───────────────────────────────────────────────────────────── */}
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-3">Histórico — {metric.label}</div>
      <div className="flex flex-col gap-2">
        {[...measurements].reverse().map((m, i) => {
          const val = m[selected];
          return (
            <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800/60">
              <div className="text-xs text-zinc-500">
                {new Date(m.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <div className={`font-[Manrope] font-black text-sm ${metric.color}`}>
                {val != null ? `${val} ${metric.unit}` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
