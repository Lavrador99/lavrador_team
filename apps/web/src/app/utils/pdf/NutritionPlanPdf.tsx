import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface MealPlanPdfData {
  clientName: string;
  planName: string;
  days: {
    dayOfWeek: number;
    meals: {
      name: string;
      kcal: number;
      items: { foodName: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }[];
    }[];
  }[];
}

const s = StyleSheet.create({
  page:       { padding: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' },
  header:     { marginBottom: 20, borderBottom: '2pt solid #c8f542', paddingBottom: 12 },
  brand:      { fontSize: 10, color: '#888', letterSpacing: 2, marginBottom: 4 },
  title:      { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#111' },
  subtitle:   { fontSize: 10, color: '#666', marginTop: 4 },
  dayCard:    { marginBottom: 14, border: '1pt solid #e5e5e5', borderRadius: 4, overflow: 'hidden' },
  dayHead:    { backgroundColor: '#f8f8f8', padding: '7 12', flexDirection: 'row', justifyContent: 'space-between' },
  dayName:    { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111' },
  dayKcal:    { fontSize: 10, color: '#888' },
  mealBlock:  { padding: '6 12', borderBottom: '0.5pt solid #f0f0f0' },
  mealName:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#333', marginBottom: 4 },
  itemRow:    { flexDirection: 'row', paddingVertical: 3 },
  itemName:   { flex: 3, fontSize: 9, color: '#555' },
  itemCell:   { flex: 1, fontSize: 9, color: '#888', textAlign: 'center' },
  macroRow:   { flexDirection: 'row', gap: 8, marginTop: 4 },
  macroChip:  { fontSize: 8, color: '#888', backgroundColor: '#f5f5f5', padding: '2 6', borderRadius: 3 },
  footer:     { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#bbb' },
});

export const NutritionPlanPdf: React.FC<{ data: MealPlanPdfData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <Text style={s.brand}>LAVRADOR TEAM · NUTRIÇÃO</Text>
        <Text style={s.title}>{data.planName}</Text>
        <Text style={s.subtitle}>
          {data.clientName} · {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {data.days.map((day) => {
        const dayKcal = day.meals.reduce((s, m) => s + m.kcal, 0);
        return (
          <View key={day.dayOfWeek} style={s.dayCard}>
            <View style={s.dayHead}>
              <Text style={s.dayName}>{DAY_LABELS[day.dayOfWeek]}</Text>
              <Text style={s.dayKcal}>{Math.round(dayKcal)} kcal total</Text>
            </View>
            {day.meals.map((meal, mi) => (
              <View key={mi} style={s.mealBlock}>
                <Text style={s.mealName}>{meal.name} · {Math.round(meal.kcal)} kcal</Text>
                {meal.items.map((item, ii) => (
                  <View key={ii} style={s.itemRow}>
                    <Text style={s.itemName}>{item.foodName}</Text>
                    <Text style={s.itemCell}>{item.grams}g</Text>
                    <Text style={s.itemCell}>{Math.round(item.kcal)} kcal</Text>
                    <Text style={s.itemCell}>P {item.protein.toFixed(1)}g</Text>
                    <Text style={s.itemCell}>C {item.carbs.toFixed(1)}g</Text>
                    <Text style={s.itemCell}>G {item.fat.toFixed(1)}g</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      })}

      <View style={s.footer} fixed>
        <Text style={s.footerText}>Lavrador Team · lavradorteam.pt</Text>
        <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  </Document>
);
