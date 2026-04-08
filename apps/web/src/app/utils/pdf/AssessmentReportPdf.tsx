import React from 'react';
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';

export interface AssessmentReportData {
  clientName: string;
  date: string;
  level: string;
  flags: string[];
  data: Record<string, any>;
}

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermédio',
  ADVANCED: 'Avançado',
};

const FLAG_LABEL: Record<string, string> = {
  HYPERTENSION: 'Hipertensão',
  DIABETES: 'Diabetes',
  JOINT_PAIN: 'Dor articular',
  OBESITY: 'Obesidade',
  OSTEOPOROSIS: 'Osteoporose',
  PREGNANCY: 'Gravidez',
  CARDIAC: 'Cardíaco',
  BACK_PAIN: 'Dor lombar',
};

const DATA_LABEL: Record<string, string> = {
  weight: 'Peso (kg)',
  height: 'Altura (cm)',
  bodyFat: 'Gordura corporal (%)',
  muscleMass: 'Massa muscular (kg)',
  bmi: 'IMC',
  restingHR: 'FC repouso (bpm)',
  bloodPressure: 'Tensão arterial',
  vo2max: 'VO2 max',
  grip: 'Força preensão (kg)',
  flexibility: 'Flexibilidade (cm)',
  pushUps: 'Flexões',
  sitUps: 'Abdominais',
  objective: 'Objectivo',
  notes: 'Notas',
};

const s = StyleSheet.create({
  page:       { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  header:     { marginBottom: 24, borderBottom: '2pt solid #c8f542', paddingBottom: 12 },
  brand:      { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 4 },
  title:      { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#111' },
  subtitle:   { fontSize: 10, color: '#666', marginTop: 4 },
  section:    { marginBottom: 18 },
  sectionLbl: { fontSize: 9, color: '#888', letterSpacing: 2, marginBottom: 8, borderBottom: '0.5pt solid #eee', paddingBottom: 4 },
  levelBadge: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111', marginBottom: 4 },
  row:        { flexDirection: 'row', paddingVertical: 5, borderBottom: '0.5pt solid #f4f4f4' },
  rowLabel:   { flex: 2, fontSize: 10, color: '#888' },
  rowValue:   { flex: 3, fontSize: 10, color: '#222' },
  flagRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  flag:       { fontSize: 9, backgroundColor: '#fff8f0', borderRadius: 3, padding: '3 8', color: '#cc6600' },
  noFlag:     { fontSize: 10, color: '#aaa' },
  footer:     { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerTxt:  { fontSize: 8, color: '#bbb' },
});

export const AssessmentReportPdf: React.FC<{ report: AssessmentReportData }> = ({ report }) => {
  const knownFields = Object.entries(report.data).filter(([k]) => DATA_LABEL[k]);
  const extraFields = Object.entries(report.data).filter(([k]) => !DATA_LABEL[k]);

  return (
    <Document title={`Avaliação — ${report.clientName}`} author="Lavrador Team">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>LAVRADOR TEAM</Text>
          <Text style={s.title}>Relatório de Avaliação</Text>
          <Text style={s.subtitle}>
            {report.clientName} · {new Date(report.date).toLocaleDateString('pt-PT', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </Text>
        </View>

        {/* Fitness level */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>NÍVEL DE CONDIÇÃO FÍSICA</Text>
          <Text style={s.levelBadge}>{LEVEL_LABEL[report.level] ?? report.level}</Text>
        </View>

        {/* Measurements */}
        {knownFields.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLbl}>DADOS BIOMÉTRICOS E TESTES</Text>
            {knownFields.map(([key, val]) => (
              <View key={key} style={s.row}>
                <Text style={s.rowLabel}>{DATA_LABEL[key]}</Text>
                <Text style={s.rowValue}>{String(val)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Clinical flags */}
        <View style={s.section}>
          <Text style={s.sectionLbl}>CONDICIONANTES CLÍNICAS</Text>
          {report.flags.length === 0 ? (
            <Text style={s.noFlag}>Sem condicionantes registadas.</Text>
          ) : (
            <View style={s.flagRow}>
              {report.flags.map((f) => (
                <Text key={f} style={s.flag}>⚠ {FLAG_LABEL[f] ?? f}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Extra fields */}
        {extraFields.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLbl}>INFORMAÇÃO ADICIONAL</Text>
            {extraFields.map(([key, val]) => (
              <View key={key} style={s.row}>
                <Text style={s.rowLabel}>{key}</Text>
                <Text style={s.rowValue}>{String(val)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>Lavrador Team — Relatório confidencial</Text>
          <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
