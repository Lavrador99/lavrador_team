import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../utils/api/workouts.api';
import styled from 'styled-components';

export const NewUserPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'ADMIN'>('CLIENT');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.createUser({
        email, password, role, name,
        birthDate: birthDate || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
      });
      setSuccess(`Utilizador "${name}" criado com sucesso.`);
      setTimeout(() => navigate('/clients'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao criar utilizador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <BackBtn onClick={() => navigate('/clients')}>← Clientes</BackBtn>
      <Header>
        <Title>Novo Utilizador</Title>
        <Subtitle>// criar conta + perfil de cliente</Subtitle>
      </Header>

      <FormCard>
        <form onSubmit={handleSubmit}>
          <Section>
            <SectionLabel>Conta</SectionLabel>
            <Grid2>
              <Field>
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" required />
              </Field>
              <Field>
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} />
              </Field>
              <Field>
                <Label>Role</Label>
                <Select value={role} onChange={(e) => setRole(e.target.value as 'CLIENT' | 'ADMIN')}>
                  <option value="CLIENT">Cliente</option>
                  <option value="ADMIN">Admin / Treinador</option>
                </Select>
              </Field>
            </Grid2>
          </Section>

          {role === 'CLIENT' && (
            <Section>
              <SectionLabel>Perfil do Cliente</SectionLabel>
              <Grid2>
                <Field>
                  <Label>Nome completo *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sara Costa" required />
                </Field>
                <Field>
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </Field>
                <Field>
                  <Label>Telefone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 912 345 678" />
                </Field>
              </Grid2>
              <Field style={{ marginTop: 12 }}>
                <Label>Notas clínicas / observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lesões, patologias, medicação relevante..." rows={3} />
              </Field>
            </Section>
          )}

          {role === 'ADMIN' && (
            <Section>
              <SectionLabel>Identificação</SectionLabel>
              <Field>
                <Label>Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do treinador" required />
              </Field>
            </Section>
          )}

          {error && <ErrorMsg>{error}</ErrorMsg>}
          {success && <SuccessMsg>✓ {success}</SuccessMsg>}

          <BtnRow>
            <CancelBtn type="button" onClick={() => navigate('/clients')}>Cancelar</CancelBtn>
            <SubmitBtn type="submit" disabled={loading}>
              {loading ? 'A criar...' : 'Criar Utilizador'}
            </SubmitBtn>
          </BtnRow>
        </form>
      </FormCard>
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Page = styled.div`padding: 40px 32px; max-width: 700px;`;
const BackBtn = styled.button`background:none; border:none; color:#666677; font-size:13px; cursor:pointer; margin-bottom:24px; font-family:'DM Mono',monospace; padding:0; &:hover{color:#c8f542;}`;
const Header = styled.div`margin-bottom:28px;`;
const Title = styled.h1`font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#e8e8f0;`;
const Subtitle = styled.p`font-family:'DM Mono',monospace; font-size:11px; color:#666677; margin-top:6px;`;
const FormCard = styled.div`background:#111118; border:1px solid #2a2a35; border-radius:12px; padding:32px;`;
const Section = styled.div`margin-bottom:28px;`;
const SectionLabel = styled.div`font-family:'DM Mono',monospace; font-size:10px; color:#666677; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #2a2a35;`;
const Grid2 = styled.div`display:grid; grid-template-columns:1fr 1fr; gap:14px; @media(max-width:600px){grid-template-columns:1fr;}`;
const Field = styled.div`display:flex; flex-direction:column; gap:6px;`;
const Label = styled.label`font-family:'DM Mono',monospace; font-size:10px; color:#666677; letter-spacing:1px; text-transform:uppercase;`;
const Input = styled.input`background:#18181f; border:1px solid #2a2a35; border-radius:6px; padding:11px 14px; color:#e8e8f0; font-size:13px; outline:none; transition:border-color .2s; &:focus{border-color:#c8f542;} &::placeholder{color:#444455;}`;
const Select = styled.select`background:#18181f; border:1px solid #2a2a35; border-radius:6px; padding:11px 14px; color:#e8e8f0; font-size:13px; outline:none; cursor:pointer; &:focus{border-color:#c8f542;} option{background:#18181f;}`;
const Textarea = styled.textarea`background:#18181f; border:1px solid #2a2a35; border-radius:6px; padding:11px 14px; color:#e8e8f0; font-size:13px; outline:none; resize:vertical; font-family:'DM Sans',sans-serif; width:100%; &:focus{border-color:#c8f542;}`;
const ErrorMsg = styled.p`font-size:13px; color:#ff6b6b; padding:10px 14px; background:rgba(255,59,59,0.08); border:1px solid rgba(255,59,59,0.2); border-radius:6px; margin-bottom:16px;`;
const SuccessMsg = styled.p`font-size:13px; color:#c8f542; padding:10px 14px; background:rgba(200,245,66,0.06); border:1px solid rgba(200,245,66,0.2); border-radius:6px; margin-bottom:16px;`;
const BtnRow = styled.div`display:flex; gap:12px; margin-top:24px;`;
const SubmitBtn = styled.button`background:#c8f542; color:#0a0a0f; border:none; border-radius:6px; padding:13px 28px; font-family:'Syne',sans-serif; font-weight:700; font-size:14px; cursor:pointer; transition:background .2s; &:hover:not(:disabled){background:#d4ff55;} &:disabled{opacity:.4;cursor:not-allowed;}`;
const CancelBtn = styled.button`background:transparent; border:1px solid #2a2a35; color:#666677; padding:13px 20px; border-radius:6px; font-size:13px; cursor:pointer; &:hover{border-color:#666677;color:#e8e8f0;}`;
