import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';
import { WorkoutDto } from '@libs/types';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 9,
    color: '#1a1a1a',
  },
  // Header
  header: { marginBottom: 24, borderBottom: '2pt solid #c8f542', paddingBottom: 12 },
  brand: { fontSize: 8, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0a0a0f', marginBottom: 2 },
  subtitle: { fontSize: 9, color: '#666' },
  // Meta row
  meta: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  metaBox: { backgroundColor: '#f5f5f5', borderRadius: 6, padding: '6 10', flex: 1 },
  metaLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0a0a0f' },
  // Workout card
  workoutCard: { marginBottom: 16, borderRadius: 8, border: '1pt solid #e5e5e5', overflow: 'hidden' },
  workoutHeader: { backgroundColor: '#0a0a0f', padding: '8 12', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  workoutDay: { fontSize: 8, color: '#c8f542', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  workoutDuration: { fontSize: 8, color: '#c8f542' },
  // Block
  blockWrap: { paddingHorizontal: 12, paddingVertical: 8, borderBottom: '1pt solid #f0f0f0' },
  blockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  blockBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#0a0a0f', backgroundColor: '#c8f542', padding: '2 5', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  blockLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#333' },
  blockMeta: { fontSize: 8, color: '#888' },
  // Exercise table
  tableHeader: { flexDirection: 'row', paddingBottom: 4, borderBottom: '1pt solid #e5e5e5', marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5pt solid #f5f5f5' },
  colExercise: { flex: 1, fontSize: 8 },
  colSets: { width: 28, fontSize: 8, textAlign: 'center' },
  colReps: { width: 36, fontSize: 8, textAlign: 'center' },
  colLoad: { width: 40, fontSize: 8, textAlign: 'center' },
  colRest: { width: 36, fontSize: 8, textAlign: 'center' },
  headerText: { fontFamily: 'Helvetica-Bold', color: '#888', fontSize: 7, textTransform: 'uppercase' },
  exName: { fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  exNotes: { color: '#888', fontSize: 7, marginTop: 1 },
  // Footer
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#bbb' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<string, string> = {
  WARMUP: 'Aquecimento', SEQUENTIAL: 'Sequencial', SUPERSET: 'Superset',
  CIRCUIT: 'Circuito', TABATA: 'Tabata', CARDIO: 'Cardio', FLEXIBILITY: 'Flexibilidade',
};

// ─── Document ─────────────────────────────────────────────────────────────────

interface Props {
  workouts: WorkoutDto[];
  clientName?: string;
}

export function WorkoutPlanPdf({ workouts, clientName }: Props) {
  const today = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalExercises = workouts.reduce((a, w) => a + w.blocks.reduce((b, bl) => b + bl.exercises.length, 0), 0);
  const totalDuration = workouts.reduce((a, w) => a + (w.durationEstimatedMin ?? 0), 0);

  return (
    <Document title={`Plano de treino${clientName ? ` — ${clientName}` : ''}`} author="Lavrador Team">
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.brand}>Lavrador Team · Plano de Treino</Text>
          <Text style={S.title}>{clientName ? `${clientName}` : 'Plano de Treino'}</Text>
          <Text style={S.subtitle}>Gerado em {today}</Text>
        </View>

        {/* Meta */}
        <View style={S.meta}>
          {[
            { label: 'Sessões', value: String(workouts.length) },
            { label: 'Exercícios', value: String(totalExercises) },
            { label: 'Duração total', value: `~${totalDuration} min` },
          ].map(({ label, value }) => (
            <View key={label} style={S.metaBox}>
              <Text style={S.metaLabel}>{label}</Text>
              <Text style={S.metaValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Workouts */}
        {workouts.map((workout) => (
          <View key={workout.id} style={S.workoutCard}>
            {/* Workout header */}
            <View style={S.workoutHeader}>
              <View>
                <Text style={S.workoutDay}>{workout.dayLabel ?? `Sessão ${workout.order + 1}`}</Text>
                <Text style={S.workoutTitle}>{workout.name}</Text>
              </View>
              <Text style={S.workoutDuration}>{workout.durationEstimatedMin} min</Text>
            </View>

            {/* Blocks */}
            {workout.blocks.map((block, bi) => (
              <View key={block.id ?? bi} style={S.blockWrap}>
                <View style={S.blockHeader}>
                  <Text style={S.blockBadge}>{BLOCK_LABELS[block.type] ?? block.type}</Text>
                  {block.label && <Text style={S.blockLabel}>{block.label}</Text>}
                  {block.restBetweenSets ? (
                    <Text style={S.blockMeta}>Descanso: {block.restBetweenSets}s</Text>
                  ) : null}
                </View>

                {/* Cardio special info */}
                {block.type === 'CARDIO' && (
                  <Text style={S.blockMeta}>
                    {[
                      block.cardioMethod && `Método: ${block.cardioMethod.replace(/_/g, ' ')}`,
                      block.cardioDurationMin && `Duração: ${block.cardioDurationMin} min`,
                      block.cardioZoneLow && block.cardioZoneHigh && `FC: ${block.cardioZoneLow}–${block.cardioZoneHigh} bpm`,
                    ].filter(Boolean).join('  ·  ')}
                  </Text>
                )}

                {/* Tabata special info */}
                {block.type === 'TABATA' && block.tabata && (
                  <Text style={S.blockMeta}>
                    {`Trabalho: ${block.tabata.workSeconds}s  ·  Descanso: ${block.tabata.restSeconds}s  ·  Rounds: ${block.tabata.rounds}`}
                  </Text>
                )}

                {/* Exercise table */}
                {block.exercises.length > 0 && (
                  <View>
                    <View style={S.tableHeader}>
                      <Text style={[S.colExercise, S.headerText]}>Exercício</Text>
                      <Text style={[S.colSets,     S.headerText]}>Séries</Text>
                      <Text style={[S.colReps,     S.headerText]}>Reps</Text>
                      <Text style={[S.colLoad,     S.headerText]}>Carga</Text>
                      <Text style={[S.colRest,     S.headerText]}>Desc.</Text>
                    </View>
                    {block.exercises.map((ex, ei) => (
                      <View key={ex.id ?? ei} style={S.tableRow}>
                        <View style={S.colExercise}>
                          <Text style={S.exName}>{ex.exerciseName}</Text>
                          {ex.notes ? <Text style={S.exNotes}>{ex.notes}</Text> : null}
                        </View>
                        <Text style={S.colSets}>{ex.sets ?? '—'}</Text>
                        <Text style={S.colReps}>{ex.reps ?? '—'}</Text>
                        <Text style={S.colLoad}>{ex.load ? `${ex.load} kg` : '—'}</Text>
                        <Text style={S.colRest}>{ex.restAfterSet ? `${ex.restAfterSet}s` : '—'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Lavrador Team — Plataforma de treino personalizado</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
