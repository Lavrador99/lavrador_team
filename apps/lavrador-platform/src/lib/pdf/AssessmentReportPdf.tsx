import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { AssessmentDto } from '@libs/types';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    padding: 40,
    fontSize: 9,
    color: '#1a1a1a',
  },
  header: { marginBottom: 20, borderBottom: '2pt solid #c8f542', paddingBottom: 12 },
  brand: { fontSize: 8, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0a0a0f', marginBottom: 2 },
  subtitle: { fontSize: 9, color: '#666' },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1.5,
    borderBottom: '1pt solid #e5e5e5', paddingBottom: 4, marginBottom: 8,
  },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { flex: 1, minWidth: 80, backgroundColor: '#f9f9f9', borderRadius: 5, padding: '5 8' },
  cellLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  cellValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0a0a0f' },
  cellUnit: { fontSize: 8, color: '#888', fontFamily: 'Helvetica' },

  badge: {
    alignSelf: 'flex-start', fontSize: 8, fontFamily: 'Helvetica-Bold',
    backgroundColor: '#c8f542', color: '#0a0a0f',
    padding: '3 7', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  badgeOrange: { backgroundColor: '#fed7aa', color: '#9a3412' },
  badgeRed: { backgroundColor: '#fecaca', color: '#991b1b' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  tag: { fontSize: 7, backgroundColor: '#f0f0f0', color: '#444', padding: '2 6', borderRadius: 3 },
  tagRed: { backgroundColor: '#fecaca', color: '#991b1b' },

  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#bbb' },

  noteBox: { backgroundColor: '#fffbeb', border: '1pt solid #fde68a', borderRadius: 5, padding: '6 10', marginTop: 8 },
  noteText: { fontSize: 8, color: '#92400e' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bmiLabel(peso?: number, altura?: number) {
  if (!peso || !altura) return null;
  const bmi = peso / Math.pow(altura / 100, 2);
  const val = Math.round(bmi * 10) / 10;
  if (bmi < 18.5) return { val, label: 'Baixo peso' };
  if (bmi < 25)   return { val, label: 'Normal' };
  if (bmi < 30)   return { val, label: 'Excesso de peso' };
  return             { val, label: 'Obesidade' };
}

const LEVEL_PT: Record<string, string> = {
  INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado',
};

// ─── Document ─────────────────────────────────────────────────────────────────

interface Props {
  assessment: AssessmentDto;
  clientName?: string;
}

export function AssessmentReportPdf({ assessment, clientName }: Props) {
  const d = assessment.data;
  const date = new Date(assessment.createdAt).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const bmi = bmiLabel(d.peso, d.altura);
  const hasFlags = assessment.flags.length > 0;
  const hasClinical = (d.sintomas?.length ?? 0) > 0 || (d.riscos?.length ?? 0) > 0 || d.pas || d.pad;

  return (
    <Document title={`Avaliação — ${clientName ?? 'Cliente'}`} author="Lavrador Team">
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.brand}>Lavrador Team · Relatório de Avaliação</Text>
          <Text style={S.title}>{clientName ?? d.nome ?? 'Cliente'}</Text>
          <Text style={S.subtitle}>Avaliação realizada em {date}</Text>
        </View>

        {/* Level + flags */}
        <View style={[S.section, { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }]}>
          <Text style={S.badge}>{LEVEL_PT[assessment.level] ?? assessment.level}</Text>
          {hasFlags && assessment.flags.map((f) => (
            <Text key={f} style={[S.badge, S.badgeOrange]}>{f.replace(/_/g, ' ')}</Text>
          ))}
        </View>

        {/* Personal data */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Dados Pessoais</Text>
          <View style={S.row}>
            {d.idade  ? <View style={S.cell}><Text style={S.cellLabel}>Idade</Text><Text style={S.cellValue}>{d.idade} <Text style={S.cellUnit}>anos</Text></Text></View> : null}
            {d.sexo   ? <View style={S.cell}><Text style={S.cellLabel}>Sexo</Text><Text style={S.cellValue}>{d.sexo === 'M' ? 'Masculino' : 'Feminino'}</Text></View> : null}
            {d.profissao ? <View style={S.cell}><Text style={S.cellLabel}>Profissão</Text><Text style={S.cellValue}>{d.profissao}</Text></View> : null}
            {d.objetivo ? <View style={S.cell}><Text style={S.cellLabel}>Objectivo</Text><Text style={S.cellValue}>{d.objetivo}</Text></View> : null}
          </View>
        </View>

        {/* Anthropometric */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Dados Antropométricos</Text>
          <View style={S.row}>
            {d.peso   ? <View style={S.cell}><Text style={S.cellLabel}>Peso</Text><Text style={S.cellValue}>{d.peso} <Text style={S.cellUnit}>kg</Text></Text></View> : null}
            {d.altura ? <View style={S.cell}><Text style={S.cellLabel}>Altura</Text><Text style={S.cellValue}>{d.altura} <Text style={S.cellUnit}>cm</Text></Text></View> : null}
            {bmi      ? <View style={S.cell}><Text style={S.cellLabel}>IMC</Text><Text style={S.cellValue}>{bmi.val} <Text style={S.cellUnit}>{bmi.label}</Text></Text></View> : null}
            {d.pctGordura ? <View style={S.cell}><Text style={S.cellLabel}>% Gordura</Text><Text style={S.cellValue}>{d.pctGordura} <Text style={S.cellUnit}>%</Text></Text></View> : null}
            {d.cc     ? <View style={S.cell}><Text style={S.cellLabel}>Circ. Cintura</Text><Text style={S.cellValue}>{d.cc} <Text style={S.cellUnit}>cm</Text></Text></View> : null}
            {d.fcRep  ? <View style={S.cell}><Text style={S.cellLabel}>FC Repouso</Text><Text style={S.cellValue}>{d.fcRep} <Text style={S.cellUnit}>bpm</Text></Text></View> : null}
          </View>
        </View>

        {/* Physical tests */}
        {(d.vo2max || d.pushup || d.rm1Squat || d.rm1Bench || d.mobOmbro || d.mobCF || d.sarVal) && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Testes Físicos</Text>
            <View style={S.row}>
              {d.vo2max   ? <View style={S.cell}><Text style={S.cellLabel}>VO₂max</Text><Text style={S.cellValue}>{d.vo2max} <Text style={S.cellUnit}>ml/kg/min</Text></Text></View> : null}
              {d.pushup   ? <View style={S.cell}><Text style={S.cellLabel}>Push-ups</Text><Text style={S.cellValue}>{d.pushup} <Text style={S.cellUnit}>rep</Text></Text></View> : null}
              {d.rm1Squat ? <View style={S.cell}><Text style={S.cellLabel}>1RM Squat</Text><Text style={S.cellValue}>{d.rm1Squat} <Text style={S.cellUnit}>kg</Text></Text></View> : null}
              {d.rm1Bench ? <View style={S.cell}><Text style={S.cellLabel}>1RM Bench</Text><Text style={S.cellValue}>{d.rm1Bench} <Text style={S.cellUnit}>kg</Text></Text></View> : null}
              {d.mobOmbro ? <View style={S.cell}><Text style={S.cellLabel}>Mob. Ombro</Text><Text style={S.cellValue}>{d.mobOmbro} <Text style={S.cellUnit}>cm</Text></Text></View> : null}
              {d.mobCF    ? <View style={S.cell}><Text style={S.cellLabel}>Mob. C/F</Text><Text style={S.cellValue}>{d.mobCF} <Text style={S.cellUnit}>cm</Text></Text></View> : null}
              {d.sarVal   ? <View style={S.cell}><Text style={S.cellLabel}>SAR</Text><Text style={S.cellValue}>{d.sarVal} <Text style={S.cellUnit}>cm</Text></Text></View> : null}
            </View>
          </View>
        )}

        {/* Training history */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Historial Desportivo</Text>
          <View style={S.row}>
            {d.pratica ? <View style={S.cell}><Text style={S.cellLabel}>Prática actual</Text><Text style={S.cellValue}>{d.pratica}</Text></View> : null}
            <View style={S.cell}><Text style={S.cellLabel}>Tempo de treino</Text><Text style={S.cellValue}>{d.tempoTreino} <Text style={S.cellUnit}>anos</Text></Text></View>
            <View style={S.cell}><Text style={S.cellLabel}>Dias/semana</Text><Text style={S.cellValue}>{d.diasSemana}</Text></View>
            <View style={S.cell}><Text style={S.cellLabel}>Duração/sessão</Text><Text style={S.cellValue}>{d.duracaoSessao} <Text style={S.cellUnit}>min</Text></Text></View>
          </View>
          {(d.lesoes?.length ?? 0) > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[S.cellLabel, { marginBottom: 4 }]}>Lesões / condicionantes</Text>
              <View style={S.tagRow}>
                {d.lesoes.map((l) => <Text key={l} style={[S.tag, S.tagRed]}>{l}</Text>)}
              </View>
            </View>
          )}
          {(d.equipamento?.length ?? 0) > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[S.cellLabel, { marginBottom: 4 }]}>Equipamento disponível</Text>
              <View style={S.tagRow}>
                {d.equipamento.map((e) => <Text key={e} style={S.tag}>{e}</Text>)}
              </View>
            </View>
          )}
        </View>

        {/* Clinical */}
        {hasClinical && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Dados Clínicos</Text>
            {(d.pas || d.pad) && (
              <View style={S.row}>
                {d.pas ? <View style={S.cell}><Text style={S.cellLabel}>P.A. Sistólica</Text><Text style={S.cellValue}>{d.pas} <Text style={S.cellUnit}>mmHg</Text></Text></View> : null}
                {d.pad ? <View style={S.cell}><Text style={S.cellLabel}>P.A. Diastólica</Text><Text style={S.cellValue}>{d.pad} <Text style={S.cellUnit}>mmHg</Text></Text></View> : null}
              </View>
            )}
            {(d.sintomas?.length ?? 0) > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[S.cellLabel, { marginBottom: 4 }]}>Sintomas</Text>
                <View style={S.tagRow}>
                  {d.sintomas.map((s) => <Text key={s} style={[S.tag, S.tagRed]}>{s}</Text>)}
                </View>
              </View>
            )}
            {(d.riscos?.length ?? 0) > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[S.cellLabel, { marginBottom: 4 }]}>Factores de risco</Text>
                <View style={S.tagRow}>
                  {d.riscos.map((r) => <Text key={r} style={[S.tag, S.tagRed]}>{r}</Text>)}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Warning if flags */}
        {hasFlags && (
          <View style={S.noteBox}>
            <Text style={S.noteText}>
              ⚠ Este cliente apresenta flags clínicas. Considerar adaptações na prescrição de exercício.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Lavrador Team · Relatório de Avaliação — {clientName ?? 'Cliente'}</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
