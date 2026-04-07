import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';
import { WorkoutDto } from '@libs/types';

const BLOCK_LABEL: Record<string, string> = {
  WARMUP: 'Aquecimento', SEQUENTIAL: 'Sequencial', SUPERSET: 'Superset',
  CIRCUIT: 'Circuito', TABATA: 'Tabata', CARDIO: 'Cardio', FLEXIBILITY: 'Flexibilidade',
};

const s = StyleSheet.create({
  page:         { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  header:       { marginBottom: 24, borderBottom: '2pt solid #c8f542', paddingBottom: 12 },
  brand:        { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 4 },
  title:        { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#111' },
  subtitle:     { fontSize: 10, color: '#666', marginTop: 4 },
  workoutCard:  { marginBottom: 16, border: '1pt solid #e5e5e5', borderRadius: 4, overflow: 'hidden' },
  workoutHead:  { backgroundColor: '#f8f8f8', padding: '8 12', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutName:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111' },
  workoutMeta:  { fontSize: 9, color: '#888' },
  blockSection: { padding: '6 12' },
  blockLabel:   { fontSize: 8, color: '#888', letterSpacing: 1.5, marginBottom: 4, marginTop: 6 },
  row:          { flexDirection: 'row', paddingVertical: 5, borderBottom: '0.5pt solid #f0f0f0' },
  exName:       { flex: 3, fontSize: 10, color: '#222' },
  exCell:       { flex: 1, fontSize: 10, color: '#555', textAlign: 'center' },
  exHead:       { flex: 1, fontSize: 8, color: '#aaa', textAlign: 'center', letterSpacing: 1 },
  exHeadName:   { flex: 3, fontSize: 8, color: '#aaa', letterSpacing: 1 },
  footer:       { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:   { fontSize: 8, color: '#bbb' },
});

interface Props {
  workouts: WorkoutDto[];
  clientName: string;
  planName?: string;
}

export const WorkoutPlanPdf: React.FC<Props> = ({ workouts, clientName, planName }) => (
  <Document>
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <Text style={s.brand}>LAVRADOR TEAM · PERSONAL TRAINING</Text>
        <Text style={s.title}>{planName ?? 'Plano de Treino'}</Text>
        <Text style={s.subtitle}>
          {clientName} · {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {workouts.map((workout) => (
        <View key={workout.id} style={s.workoutCard}>
          <View style={s.workoutHead}>
            <Text style={s.workoutName}>{workout.name}</Text>
            <Text style={s.workoutMeta}>⏱ {workout.durationEstimatedMin} min</Text>
          </View>

          {workout.blocks.map((block) => (
            <View key={block.id} style={s.blockSection}>
              <Text style={s.blockLabel}>{BLOCK_LABEL[block.type] ?? block.type}</Text>

              {/* Header row */}
              <View style={[s.row, { borderBottom: '0.5pt solid #e0e0e0' }]}>
                <Text style={s.exHeadName}>EXERCÍCIO</Text>
                <Text style={s.exHead}>SÉR.</Text>
                <Text style={s.exHead}>REPS</Text>
                <Text style={s.exHead}>CARGA</Text>
                <Text style={s.exHead}>DESC.</Text>
              </View>

              {block.exercises.map((ex) => (
                <View key={ex.id} style={s.row}>
                  <Text style={s.exName}>{ex.exerciseName}</Text>
                  <Text style={s.exCell}>{ex.sets}×</Text>
                  <Text style={s.exCell}>{ex.reps}</Text>
                  <Text style={s.exCell}>
                    {ex.load ? `${ex.load} kg` : ex.percentRM ? `${ex.percentRM}%RM` : '—'}
                  </Text>
                  <Text style={s.exCell}>
                    {ex.restAfterSet ? `${ex.restAfterSet}s` : block.restBetweenSets ? `${block.restBetweenSets}s` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}

      <View style={s.footer} fixed>
        <Text style={s.footerText}>Lavrador Team · lavradorteam.pt</Text>
        <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>
);
