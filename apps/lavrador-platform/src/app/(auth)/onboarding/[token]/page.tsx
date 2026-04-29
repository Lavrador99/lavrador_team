'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

// ── Styled components ─────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100svh;
  background: #0a0a0f;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.25rem 4rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: #111118;
  border: 1px solid #1a1a24;
  border-radius: 20px;
  padding: 2rem;
  margin-top: 1rem;
`;

const Logo = styled.div`
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  color: #c8f542;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  font-size: 0.8rem;
  color: #666;
  font-family: 'DM Mono', monospace;
  margin-bottom: 2rem;
`;

const StepTitle = styled.h2`
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
  margin-bottom: 0.25rem;
`;

const StepHint = styled.p`
  font-size: 0.78rem;
  color: #888;
  font-family: 'DM Mono', monospace;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  margin-bottom: 0.35rem;
  margin-top: 1rem;
  font-family: 'DM Mono', monospace;
`;

const Input = styled.input`
  width: 100%;
  background: #0a0a0f;
  border: 1px solid #1a1a24;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: white;
  font-family: 'DM Mono', monospace;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #444; }
`;

const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
`;

const CheckBox = styled.input`
  accent-color: #c8f542;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  flex-shrink: 0;
`;

const CheckLabel = styled.span`
  font-size: 0.83rem;
  color: #ccc;
  font-family: 'DM Mono', monospace;
  line-height: 1.4;
`;

const Btn = styled.button<{ $secondary?: boolean }>`
  width: 100%;
  padding: 0.9rem;
  border-radius: 14px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: opacity 0.2s, transform 0.15s;
  &:active { transform: scale(0.98); }
  ${({ $secondary }) => $secondary
    ? 'background: #1a1a24; color: #888;'
    : 'background: #c8f542; color: #000;'}
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ProgressBar = styled.div<{ $pct: number }>`
  width: 100%;
  height: 3px;
  background: #1a1a24;
  border-radius: 99px;
  margin-bottom: 1.5rem;
  overflow: hidden;
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $pct }) => $pct}%;
    background: #c8f542;
    border-radius: 99px;
    transition: width 0.4s ease;
  }
`;

const ErrMsg = styled.p`
  color: #ff6b6b;
  font-size: 0.78rem;
  font-family: 'DM Mono', monospace;
  margin-top: 0.75rem;
  text-align: center;
`;

const SuccessBox = styled.div`
  text-align: center;
  padding: 2rem 0;
`;

const BigEmoji = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

// ── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  hasHeartCondition: boolean;
  hasChestPain: boolean;
  hasDizziness: boolean;
  hasJointProblem: boolean;
  hasHighBloodPressure: boolean;
  otherHealthConditions: string;
  primaryGoal: string;
  currentActivityLevel: string;
  trainingFrequencyPerWeek: number;
  consentSigned: boolean;
  consentSignatureName: string;
}

const defaultForm: FormState = {
  name: '', email: '', phone: '', birthDate: '',
  hasHeartCondition: false, hasChestPain: false, hasDizziness: false,
  hasJointProblem: false, hasHighBloodPressure: false, otherHealthConditions: '',
  primaryGoal: '', currentActivityLevel: 'MODERATE', trainingFrequencyPerWeek: 3,
  consentSigned: false, consentSignatureName: '',
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API}/api/onboarding/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('invalid');
        return r.json();
      })
      .then((data) => {
        if (data.clientName) setForm((f) => ({ ...f, name: data.clientName ?? '' }));
        if (data.clientEmail) setForm((f) => ({ ...f, email: data.clientEmail ?? '' }));
        setTokenValid(true);
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  }

  function validateStep1() {
    if (!form.name.trim()) return 'Nome é obrigatório';
    if (!form.email.trim() || !form.email.includes('@')) return 'Email inválido';
    return null;
  }

  function validateStep3() {
    if (!form.consentSigned) return 'Deves aceitar os termos';
    if (!form.consentSignatureName.trim()) return 'Assina com o teu nome completo';
    if (!form.primaryGoal.trim()) return 'Indica o teu objetivo principal';
    return null;
  }

  async function submit() {
    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/onboarding/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, trainingFrequencyPerWeek: Number(form.trainingFrequencyPerWeek) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erro ao submeter');
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === false) {
    return (
      <Page>
        <Card>
          <SuccessBox>
            <BigEmoji>🔗</BigEmoji>
            <StepTitle>Link inválido ou expirado</StepTitle>
            <StepHint>Pede ao teu personal trainer um novo link de onboarding.</StepHint>
          </SuccessBox>
        </Card>
      </Page>
    );
  }

  if (done) {
    return (
      <Page>
        <Card>
          <SuccessBox>
            <BigEmoji>🎉</BigEmoji>
            <StepTitle>Tudo pronto, {form.name.split(' ')[0]}!</StepTitle>
            <StepHint>O teu personal trainer já foi notificado. Vais receber as tuas credenciais de acesso em breve.</StepHint>
          </SuccessBox>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Logo>LAVRADOR TEAM</Logo>
      <Subtitle>Intake do cliente · Passo {step} de 3</Subtitle>

      <Card>
        <ProgressBar $pct={(step / 3) * 100} />

        {/* ── Step 1: Dados pessoais ── */}
        {step === 1 && (
          <>
            <StepTitle>Dados pessoais</StepTitle>
            <StepHint>Informação básica para o teu perfil</StepHint>

            <Label>Nome completo *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="João Silva" />

            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="joao@email.com" />

            <Label>Telemóvel</Label>
            <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+351 912 345 678" />

            <Label>Data de nascimento</Label>
            <Input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />

            {error && <ErrMsg>{error}</ErrMsg>}
            <Btn onClick={() => { const e = validateStep1(); if (e) setError(e); else setStep(2); }}>
              Continuar →
            </Btn>
          </>
        )}

        {/* ── Step 2: Saúde (PAR-Q) ── */}
        {step === 2 && (
          <>
            <StepTitle>Questionário de saúde</StepTitle>
            <StepHint>PAR-Q — Prontidão para a atividade física</StepHint>

            {([
              ['hasHeartCondition', 'Tens alguma condição cardíaca diagnosticada?'],
              ['hasChestPain', 'Sentes dores no peito durante atividade física?'],
              ['hasDizziness', 'Tens tonturas ou perdas de equilíbrio?'],
              ['hasJointProblem', 'Tens problemas ósseos ou articulares (joelho, anca, coluna)?'],
              ['hasHighBloodPressure', 'Tens pressão arterial alta (hipertensão)?'],
            ] as [keyof FormState, string][]).map(([key, label]) => (
              <CheckRow key={key}>
                <CheckBox
                  type="checkbox"
                  checked={form[key] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                />
                <CheckLabel>{label}</CheckLabel>
              </CheckRow>
            ))}

            <Label>Outras condições de saúde relevantes</Label>
            <Input
              value={form.otherHealthConditions}
              onChange={(e) => set('otherHealthConditions', e.target.value)}
              placeholder="Cirurgias recentes, lesões, medicação..."
            />

            <Btn $secondary onClick={() => setStep(1)}>← Voltar</Btn>
            <Btn onClick={() => setStep(3)}>Continuar →</Btn>
          </>
        )}

        {/* ── Step 3: Objetivos + Consentimento ── */}
        {step === 3 && (
          <>
            <StepTitle>Objetivos e consentimento</StepTitle>
            <StepHint>Último passo — define os teus objetivos e assina</StepHint>

            <Label>Objetivo principal *</Label>
            <Input
              value={form.primaryGoal}
              onChange={(e) => set('primaryGoal', e.target.value)}
              placeholder="Ex: Perder peso, ganhar massa muscular, melhorar condição..."
            />

            <Label>Nível de atividade atual</Label>
            <select
              value={form.currentActivityLevel}
              onChange={(e) => set('currentActivityLevel', e.target.value)}
              style={{ width: '100%', background: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: 12, padding: '0.75rem 1rem', color: 'white', fontFamily: 'DM Mono, monospace', fontSize: '0.875rem', outline: 'none' }}
            >
              <option value="SEDENTARY">Sedentário (sem exercício regular)</option>
              <option value="LIGHT">Leve (1-2 vezes/semana)</option>
              <option value="MODERATE">Moderado (3-4 vezes/semana)</option>
              <option value="ACTIVE">Ativo (5+ vezes/semana)</option>
            </select>

            <Label>Quantas vezes por semana queres treinar?</Label>
            <Input
              type="number"
              min={1} max={7}
              value={form.trainingFrequencyPerWeek}
              onChange={(e) => set('trainingFrequencyPerWeek', parseInt(e.target.value) || 3)}
            />

            <div style={{ background: '#0a0a0f', border: '1px solid #1a1a24', borderRadius: 12, padding: '1rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'DM Mono, monospace', lineHeight: 1.6, margin: 0 }}>
                Declaro que as informações fornecidas são verdadeiras e que estou apto/a para iniciar um programa de treino. Autorizo o meu personal trainer a utilizar estes dados para fins de prescrição e acompanhamento. Compreendo que devo consultar um médico em caso de dúvidas sobre a minha aptidão física.
              </p>
            </div>

            <CheckRow>
              <CheckBox
                type="checkbox"
                checked={form.consentSigned}
                onChange={(e) => set('consentSigned', e.target.checked)}
              />
              <CheckLabel>Li e aceito os termos acima</CheckLabel>
            </CheckRow>

            <Label>Assinatura digital (escreve o teu nome completo) *</Label>
            <Input
              value={form.consentSignatureName}
              onChange={(e) => set('consentSignatureName', e.target.value)}
              placeholder="Nome completo"
              style={{ fontStyle: 'italic' }}
            />

            {error && <ErrMsg>{error}</ErrMsg>}
            <Btn $secondary onClick={() => setStep(2)}>← Voltar</Btn>
            <Btn onClick={submit} disabled={loading}>
              {loading ? 'A enviar...' : '✓ Confirmar e enviar'}
            </Btn>
          </>
        )}
      </Card>
    </Page>
  );
}
