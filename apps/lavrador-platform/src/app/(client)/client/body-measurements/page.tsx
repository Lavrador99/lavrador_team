'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { assessmentsApi } from '../../../../lib/api/prescription.api';
import { AssessmentDto } from '@libs/types';

type MetricKey = 'peso' | 'bmi' | 'pctGordura' | 'cc' | 'fcRep';

const METRICS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: 'peso',       label: 'Peso',            unit: 'kg',  color: '#c8f542' },
  { key: 'bmi',        label: 'IMC',             unit: '',    color: '#42a5f5' },
  { key: 'pctGordura', label: '% Gordura',       unit: '%',   color: '#f5a442' },
  { key: 'cc',         label: 'Circ. Cintura',   unit: 'cm',  color: '#a855f7' },
  { key: 'fcRep',      label: 'FC Repouso',      unit: 'bpm', color: '#ff8c5a' },
];

function calcBMI(peso?: number, altura?: number): number | null {
  if (!peso || !altura) return null;
  const h = altura / 100;
  return Math.round((peso / (h * h)) * 10) / 10;
}

function bmiCategory(bmi: number | null): { label: string; color: string } {
  if (!bmi) return { label: '—', color: '#666677' };
  if (bmi < 18.5) return { label: 'Baixo peso', color: '#42a5f5' };
  if (bmi < 25)   return { label: 'Normal', color: '#c8f542' };
  if (bmi < 30)   return { label: 'Excesso', color: '#f5a442' };
  return { label: 'Obesidade', color: '#ff3b3b' };
}

export default function BodyMeasurementsPage() {
  const [selected, setSelected] = useState<MetricKey>('peso');
  const { data: assessments = [], isLoading } = useSWR<AssessmentDto[]>('my-assessments', assessmentsApi.getMy);

  // Extract measurements from assessments sorted oldest→newest
  const measurements = [...assessments]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      date: a.createdAt,
      peso: a.data.peso,
      bmi: calcBMI(a.data.peso, a.data.altura),
      pctGordura: a.data.pctGordura,
      cc: a.data.cc,
      fcRep: a.data.fcRep,
    }));

  if (isLoading) {
    return <div className="py-20 font-mono text-sm text-muted text-center">A carregar medições...</div>;
  }

  if (!measurements.length) {
    return (
      <div className="py-20 text-center">
        <div className="font-mono text-sm text-muted">Ainda não tens avaliações registadas.</div>
      </div>
    );
  }

  const latest = measurements[measurements.length - 1];
  const first = measurements[0];
  const metric = METRICS.find((m) => m.key === selected)!;
  const latestVal = latest[selected];
  const firstVal = first[selected];
  const delta = latestVal != null && firstVal != null ? Math.round((latestVal - firstVal) * 10) / 10 : null;
  const bmiInfo = bmiCategory(latest.bmi);

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-6">Medições corporais</h1>

      {/* Metric selector cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {METRICS.map((m) => {
          const val = latest[m.key];
          const isActive = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              className={`bg-panel border rounded-xl p-4 text-left transition-all ${
                isActive ? 'border-current' : 'border-border hover:border-muted'
              }`}
              style={isActive ? { borderColor: m.color } : {}}
            >
              <div className="font-syne font-black text-xl" style={{ color: m.color }}>
                {val != null ? `${val}${m.unit}` : '—'}
              </div>
              <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1">{m.label}</div>
              {m.key === 'bmi' && val != null && (
                <div className="font-mono text-[9px] mt-0.5" style={{ color: bmiInfo.color }}>{bmiInfo.label}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Delta */}
      {delta !== null && (
        <div className={`font-mono text-xs mb-6 ${delta > 0 ? 'text-orange-400' : delta < 0 ? 'text-accent' : 'text-muted'}`}>
          Variação total: {delta > 0 ? '+' : ''}{delta} {metric.unit}
        </div>
      )}

      {/* History table */}
      <h2 className="font-syne font-bold text-sm text-white mb-3">Histórico — {metric.label}</h2>
      <div className="flex flex-col gap-2">
        {[...measurements].reverse().map((m, i) => {
          const val = m[selected];
          return (
            <div key={i} className="flex items-center justify-between bg-panel border border-border rounded-xl px-4 py-3">
              <div className="font-mono text-xs text-muted">
                {new Date(m.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <div className="font-syne font-black text-sm" style={{ color: metric.color }}>
                {val != null ? `${val} ${metric.unit}` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
