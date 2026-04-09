'use client';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { PersonalRecordDto, RECORD_TYPE_LABEL, RECORD_TYPE_UNIT } from '@libs/types';
import { personalRecordsApi } from '../../../../lib/api/personal-records.api';

export default function MyRecordsPage() {
  const router = useRouter();
  const { data: records = [], isLoading } = useSWR<PersonalRecordDto[]>(
    'my-best-records',
    personalRecordsApi.getMyBest,
  );

  // Group by exercise name
  const grouped = new Map<string, PersonalRecordDto[]>();
  for (const r of records) {
    const list = grouped.get(r.exerciseName) ?? [];
    list.push(r);
    grouped.set(r.exerciseName, list);
  }

  if (isLoading) {
    return <div className="py-20 font-mono text-sm text-muted text-center">A carregar records...</div>;
  }

  if (!records.length) {
    return (
      <div className="py-20 text-center">
        <div className="font-mono text-sm text-muted">Ainda não tens records registados.</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-6">Os meus records</h1>

      <div className="flex flex-col gap-4">
        {Array.from(grouped.entries()).map(([exerciseName, recs]) => (
          <div key={exerciseName} className="bg-panel border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans font-semibold text-sm text-white">{exerciseName}</span>
              <button
                onClick={() => router.push(`/client/exercise-history/${encodeURIComponent(exerciseName)}`)}
                className="font-mono text-[10px] text-accent hover:underline"
              >
                📈 Evolução
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recs.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#0d0d13] border border-border rounded-lg px-3 py-2"
                >
                  <div className="font-syne font-black text-accent text-base">
                    {r.value} <span className="text-xs">{RECORD_TYPE_UNIT[r.type]}</span>
                  </div>
                  <div className="font-mono text-[9px] text-muted mt-0.5">{RECORD_TYPE_LABEL[r.type]}</div>
                  <div className="font-mono text-[9px] text-faint mt-0.5">
                    {new Date(r.recordedAt).toLocaleDateString('pt-PT')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
