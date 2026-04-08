import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useClientStats } from "../../hooks/useStats";
import { clientsApi } from "../../utils/api/clients.api";
import { programsApi } from "../../utils/api/prescription.api";
import { progressPhotosApi, ProgressPhoto } from "../../utils/api/progress-photos.api";
import { habitsApi, HabitDto } from "../../utils/api/habits.api";
import { invoicesApi, InvoiceDto } from "../../utils/api/invoices.api";
import { pdf } from '@react-pdf/renderer';
import { AssessmentReportPdf, AssessmentReportData } from '../../utils/pdf/AssessmentReportPdf';
import { ClientProgressTab } from "./components/ClientProgressTab";

const INV_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Em atraso', CANCELLED: 'Cancelado',
};
const INV_STATUS_COLOR: Record<string, string> = {
  PENDING: '#42a5f5', PAID: '#c8f542', OVERDUE: '#ff3b3b', CANCELLED: '#666677',
};

const SESSION_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Agendada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta",
};
const SESSION_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: "#42a5f5",
  COMPLETED: "#c8f542",
  CANCELLED: "#ff3b3b",
  NO_SHOW: "#ff8c5a",
};
const SESSION_TYPE_LABEL: Record<string, string> = {
  TRAINING: "Treino",
  ASSESSMENT: "Avaliação",
  FOLLOWUP: "Follow-up",
};
const PROGRAM_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#c8f542",
  ARCHIVED: "#666677",
};

export const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "programs" | "sessions" | "assessments" | "progress" | "fotos" | "habitos" | "pagamentos"
  >("overview");
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const { stats: clientStats } = useClientStats(clientId ?? "");

  // Fotos de progresso
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoAngle, setPhotoAngle] = useState('Frontal');
  const [photoNotes, setPhotoNotes] = useState('');
  const [lightbox, setLightbox] = useState<ProgressPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab !== 'fotos' || !clientId) return;
    setLoadingPhotos(true);
    progressPhotosApi.getByClient(clientId)
      .then(setPhotos)
      .finally(() => setLoadingPhotos(false));
  }, [activeTab, clientId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clientId) return;
    setUploadingPhoto(true);
    try {
      const photo = await progressPhotosApi.upload(clientId, file, {
        angle: photoAngle,
        notes: photoNotes || undefined,
        takenAt: new Date().toISOString(),
      });
      setPhotos(prev => [photo, ...prev]);
      setPhotoNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Eliminar esta foto?')) return;
    await progressPhotosApi.delete(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Hábitos do cliente
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('');
  const [savingHabit, setSavingHabit] = useState(false);

  useEffect(() => {
    if (activeTab !== 'habitos' || !clientId) return;
    setLoadingHabits(true);
    habitsApi.getByClient(clientId)
      .then(setHabits)
      .finally(() => setLoadingHabits(false));
  }, [activeTab, clientId]);

  const handleCreateHabit = async () => {
    if (!newHabitName.trim() || !clientId) return;
    setSavingHabit(true);
    try {
      const habit = await habitsApi.createForClient(clientId, {
        name: newHabitName.trim(),
        icon: newHabitIcon.trim() || undefined,
      });
      setHabits(prev => [...prev, habit]);
      setNewHabitName('');
      setNewHabitIcon('');
    } finally {
      setSavingHabit(false);
    }
  };

  const handleToggleHabit = async (habit: HabitDto) => {
    const updated = await habitsApi.update(habit.id, { isActive: !habit.isActive });
    setHabits(prev => prev.map(h => h.id === habit.id ? updated : h));
  };

  const handleDeleteHabit = async (id: string) => {
    if (!window.confirm('Eliminar este hábito?')) return;
    await habitsApi.delete(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Pagamentos
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invAmount, setInvAmount] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invDue, setInvDue] = useState('');
  const [savingInvoice, setSavingInvoice] = useState(false);

  useEffect(() => {
    if (activeTab !== 'pagamentos' || !clientId) return;
    setLoadingInvoices(true);
    invoicesApi.getAll(clientId)
      .then(setInvoices)
      .finally(() => setLoadingInvoices(false));
  }, [activeTab, clientId]);

  const handleCreateInvoice = async () => {
    if (!invAmount || !invDesc || !invDue || !clientId) return;
    setSavingInvoice(true);
    try {
      const inv = await invoicesApi.create({
        clientId,
        amount: parseFloat(invAmount),
        description: invDesc,
        dueDate: invDue,
      });
      setInvoices(prev => [inv, ...prev]);
      setShowInvoiceForm(false);
      setInvAmount(''); setInvDesc(''); setInvDue('');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    const updated = await invoicesApi.update(id, { status: 'PAID' });
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Eliminar esta factura?')) return;
    await invoicesApi.delete(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  useEffect(() => {
    if (!clientId) return;
    clientsApi
      .getDetail(clientId)
      .then(setClient)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading)
    return (
      <Page>
        <LoadingMsg>A carregar perfil do cliente...</LoadingMsg>
      </Page>
    );
  if (!client)
    return (
      <Page>
        <LoadingMsg>Cliente não encontrado.</LoadingMsg>
      </Page>
    );

  const handleDeleteProgram = async (programId: string) => {
    if (!window.confirm("Eliminar este plano permanentemente? Esta acção não pode ser desfeita.")) return;
    setDeletingProgramId(programId);
    try {
      await programsApi.delete(programId);
      setClient((prev: any) => ({
        ...prev,
        programs: prev.programs.filter((p: any) => p.id !== programId),
      }));
    } finally {
      setDeletingProgramId(null);
    }
  };

  const upcomingSessions = (client.sessions ?? []).filter(
    (s: any) =>
      s.status === "SCHEDULED" && new Date(s.scheduledAt) >= new Date(),
  );

  return (
    <Page>
      <BackBtn onClick={() => navigate("/clients")}>← Clientes</BackBtn>

      <ProfileHeader>
        <Avatar>{client.name[0].toUpperCase()}</Avatar>
        <ProfileInfo>
          <ClientName>{client.name}</ClientName>
          <ClientMeta>
            {client.user?.email} · {client.phone ?? "sem telefone"}
          </ClientMeta>
          {client.birthDate && (
            <ClientMeta>
              {getAge(client.birthDate)} anos ·{" "}
              {new Date(client.birthDate).toLocaleDateString("pt-PT")}
            </ClientMeta>
          )}
        </ProfileInfo>
        <HeaderActions>
          <ActionBtn
            $primary
            onClick={() => navigate(`/prescription?clientId=${clientId}`)}
          >
            + Nova Prescrição
          </ActionBtn>
          <ActionBtn onClick={() => navigate(`/schedule?clientId=${clientId}`)}>
            + Marcar Sessão
          </ActionBtn>
        </HeaderActions>
      </ProfileHeader>

      <StatRow>
        <StatCard>
          <StatVal $color="#c8f542">
            {client.programs?.filter((p: any) => p.status === "ACTIVE")
              .length ?? 0}
          </StatVal>
          <StatLabel>Planos ativos</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color="#42a5f5">{upcomingSessions.length}</StatVal>
          <StatLabel>Próximas sessões</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color="#ff8c5a">{client.assessments?.length ?? 0}</StatVal>
          <StatLabel>Avaliações</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal>
            {client.sessions?.filter((s: any) => s.status === "COMPLETED")
              .length ?? 0}
          </StatVal>
          <StatLabel>Sessões concluídas</StatLabel>
        </StatCard>
      </StatRow>

      <Tabs>
        {(
          [
            "overview",
            "programs",
            "sessions",
            "assessments",
            "progress",
            "fotos",
            "habitos",
            "pagamentos",
          ] as const
        ).map((tab) => (
          <Tab
            key={tab}
            $active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </Tab>
        ))}
      </Tabs>

      {activeTab === "overview" && (
        <TabContent>
          {upcomingSessions.length > 0 && (
            <Section>
              <SectionTitle>Próximas sessões</SectionTitle>
              {upcomingSessions.slice(0, 3).map((s: any) => (
                <SessionRow key={s.id}>
                  <SessionDot $color={SESSION_STATUS_COLOR[s.status]} />
                  <SessionInfo>
                    <SessionDate>{formatDate(s.scheduledAt)}</SessionDate>
                    <SessionMeta>
                      {SESSION_TYPE_LABEL[s.type]} · {s.duration} min
                    </SessionMeta>
                  </SessionInfo>
                  <StatusBadge $color={SESSION_STATUS_COLOR[s.status]}>
                    {SESSION_STATUS_LABEL[s.status]}
                  </StatusBadge>
                </SessionRow>
              ))}
            </Section>
          )}
          {client.programs?.[0] && (
            <Section>
              <SectionTitle>Plano ativo</SectionTitle>
              <ProgramCard>
                <ProgramName>{client.programs[0].name}</ProgramName>
                <ProgramMeta>
                  <StatusBadge
                    $color={PROGRAM_STATUS_COLOR[client.programs[0].status]}
                  >
                    {client.programs[0].status}
                  </StatusBadge>
                  <span style={{ color: "#666677", fontSize: 12 }}>
                    {new Date(client.programs[0].createdAt).toLocaleDateString(
                      "pt-PT",
                    )}
                  </span>
                </ProgramMeta>
              </ProgramCard>
            </Section>
          )}
          {client.notes && (
            <Section>
              <SectionTitle>Notas</SectionTitle>
              <NotesBox>{client.notes}</NotesBox>
            </Section>
          )}
        </TabContent>
      )}

      {activeTab === "programs" && (
        <TabContent>
          {(client.programs ?? []).length === 0 ? (
            <Empty>
              Sem planos de treino.{" "}
              <BtnLink
                onClick={() => navigate(`/prescription?clientId=${clientId}`)}
              >
                Criar prescrição
              </BtnLink>
            </Empty>
          ) : (
            (client.programs ?? []).map((p: any) => (
              <ProgramCard key={p.id} style={{ marginBottom: 12 }}>
                <ProgramName>{p.name}</ProgramName>
                <ProgramMeta>
                  <StatusBadge $color={PROGRAM_STATUS_COLOR[p.status]}>
                    {p.status}
                  </StatusBadge>
                  <span style={{ color: "#666677", fontSize: 12 }}>
                    {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                  </span>
                  <span
                    style={{
                      color: "#42a5f5",
                      fontSize: 11,
                      fontFamily: "DM Mono",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      navigate(
                        `/workouts?programId=${p.id}&clientId=${clientId}`,
                      )
                    }
                  >
                    📋 Treinos detalhados →
                  </span>
                </ProgramMeta>
                <ProgramExercises>
                  {p.exerciseSelections?.slice(0, 5).map((sel: any) => (
                    <ExTag key={sel.id} $preferred={sel.type === "PREFERRED"}>
                      {sel.type === "PREFERRED" ? "✓" : "★"}{" "}
                      {sel.exercise?.name}
                    </ExTag>
                  ))}
                </ProgramExercises>
                <ProgramActions>
                  {p.status === "ACTIVE" && (
                    <SmallBtn onClick={() => programsApi.archive(p.id).then(() =>
                      setClient((prev: any) => ({
                        ...prev,
                        programs: prev.programs.map((pr: any) =>
                          pr.id === p.id ? { ...pr, status: "ARCHIVED" } : pr
                        ),
                      }))
                    )}>
                      Arquivar
                    </SmallBtn>
                  )}
                  <SmallBtn
                    $danger
                    disabled={deletingProgramId === p.id}
                    onClick={() => handleDeleteProgram(p.id)}
                  >
                    {deletingProgramId === p.id ? "A eliminar..." : "Eliminar"}
                  </SmallBtn>
                </ProgramActions>
              </ProgramCard>
            ))
          )}
        </TabContent>
      )}

      {activeTab === "sessions" && (
        <TabContent>
          {(client.sessions ?? []).length === 0 ? (
            <Empty>Sem sessões registadas.</Empty>
          ) : (
            (client.sessions ?? []).map((s: any) => (
              <SessionRow
                key={s.id}
                style={{
                  marginBottom: 8,
                  padding: "12px 16px",
                  background: "#111118",
                  borderRadius: 8,
                  border: "1px solid #2a2a35",
                }}
              >
                <SessionDot $color={SESSION_STATUS_COLOR[s.status]} />
                <SessionInfo>
                  <SessionDate>{formatDate(s.scheduledAt)}</SessionDate>
                  <SessionMeta>
                    {SESSION_TYPE_LABEL[s.type]} · {s.duration} min{" "}
                    {s.notes ? `· "${s.notes}"` : ""}
                  </SessionMeta>
                </SessionInfo>
                <StatusBadge $color={SESSION_STATUS_COLOR[s.status]}>
                  {SESSION_STATUS_LABEL[s.status]}
                </StatusBadge>
              </SessionRow>
            ))
          )}
        </TabContent>
      )}

      {activeTab === "assessments" && (
        <TabContent>
          {(client.assessments ?? []).length === 0 ? (
            <Empty>Sem avaliações registadas.</Empty>
          ) : (
            (client.assessments ?? []).map((a: any) => (
              <AssessmentCard key={a.id}>
                <AssessmentDate>
                  {new Date(a.createdAt).toLocaleDateString("pt-PT")}
                </AssessmentDate>
                <LevelBadge $level={a.level}>{a.level}</LevelBadge>
                {a.flags?.length > 0 && (
                  <FlagsRow>
                    {a.flags.map((f: string) => (
                      <FlagTag key={f}>⚠ {f}</FlagTag>
                    ))}
                  </FlagsRow>
                )}
                <SmallBtn
                  style={{ marginLeft: 'auto' }}
                  onClick={async () => {
                    const report: AssessmentReportData = {
                      clientName: client.name,
                      date: a.createdAt,
                      level: a.level,
                      flags: a.flags ?? [],
                      data: a.data ?? {},
                    };
                    const blob = await pdf(<AssessmentReportPdf report={report} />).toBlob();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `avaliacao-${client.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  ↓ PDF
                </SmallBtn>
              </AssessmentCard>
            ))
          )}
        </TabContent>
      )}

      {activeTab === "progress" && (
        <TabContent>
          {clientStats ? (
            <ClientProgressTab stats={clientStats} clientId={clientId ?? ''} />
          ) : (
            <Empty>A carregar estatísticas de progresso...</Empty>
          )}
        </TabContent>
      )}

      {activeTab === "fotos" && (
        <TabContent>
          <Section>
            <SectionTitle>Adicionar foto</SectionTitle>
            <PhotoUploadRow>
              <PhotoSelect
                value={photoAngle}
                onChange={e => setPhotoAngle(e.target.value)}
              >
                <option>Frontal</option>
                <option>Lateral Esq.</option>
                <option>Lateral Dir.</option>
                <option>Costas</option>
              </PhotoSelect>
              <PhotoNotesInput
                placeholder="Notas opcionais..."
                value={photoNotes}
                onChange={e => setPhotoNotes(e.target.value)}
              />
              <UploadBtn
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingPhoto ? 'A enviar...' : '+ Foto'}
              </UploadBtn>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
            </PhotoUploadRow>
          </Section>

          {loadingPhotos ? (
            <Empty>A carregar fotos...</Empty>
          ) : photos.length === 0 ? (
            <Empty>Sem fotos de progresso registadas.</Empty>
          ) : (
            <PhotoGrid>
              {photos.map(photo => (
                <PhotoCard key={photo.id}>
                  <PhotoImg
                    src={`/api${photo.url}`}
                    alt={photo.angle ?? 'Foto'}
                    onClick={() => setLightbox(photo)}
                  />
                  <PhotoMeta>
                    <PhotoAngle>{photo.angle ?? '—'}</PhotoAngle>
                    <PhotoDate>
                      {new Date(photo.takenAt).toLocaleDateString('pt-PT')}
                    </PhotoDate>
                    {photo.notes && <PhotoNoteText>{photo.notes}</PhotoNoteText>}
                  </PhotoMeta>
                  <PhotoDeleteBtn onClick={() => handleDeletePhoto(photo.id)}>✕</PhotoDeleteBtn>
                </PhotoCard>
              ))}
            </PhotoGrid>
          )}

          {lightbox && (
            <LightboxOverlay onClick={() => setLightbox(null)}>
              <LightboxImg src={`/api${lightbox.url}`} alt={lightbox.angle ?? ''} onClick={e => e.stopPropagation()} />
              <LightboxClose onClick={() => setLightbox(null)}>✕</LightboxClose>
            </LightboxOverlay>
          )}
        </TabContent>
      )}

      {activeTab === "pagamentos" && (
        <TabContent>
          <Section>
            <SectionTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Facturas</span>
              <SmallBtn onClick={() => setShowInvoiceForm(!showInvoiceForm)}>
                {showInvoiceForm ? 'Cancelar' : '+ Nova factura'}
              </SmallBtn>
            </SectionTitle>
            {showInvoiceForm && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <PhotoNotesInput
                  type="number"
                  placeholder="Valor (€)"
                  value={invAmount}
                  onChange={e => setInvAmount(e.target.value)}
                  style={{ maxWidth: 110 }}
                />
                <PhotoNotesInput
                  placeholder="Descrição"
                  value={invDesc}
                  onChange={e => setInvDesc(e.target.value)}
                />
                <PhotoNotesInput
                  type="date"
                  value={invDue}
                  onChange={e => setInvDue(e.target.value)}
                  style={{ maxWidth: 150 }}
                />
                <UploadBtn
                  disabled={savingInvoice || !invAmount || !invDesc || !invDue}
                  onClick={handleCreateInvoice}
                >
                  {savingInvoice ? '...' : 'Criar'}
                </UploadBtn>
              </div>
            )}
          </Section>

          {loadingInvoices ? (
            <Empty>A carregar facturas...</Empty>
          ) : invoices.length === 0 ? (
            <Empty>Sem facturas para este cliente.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invoices.map(inv => (
                <InvRow key={inv.id}>
                  <InvDesc>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#e8e8f0', fontWeight: 600 }}>{inv.description}</div>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#666677', marginTop: 2 }}>
                      Vence: {new Date(inv.dueDate).toLocaleDateString('pt-PT')}
                      {inv.paidAt && ` · Pago: ${new Date(inv.paidAt).toLocaleDateString('pt-PT')}`}
                    </div>
                  </InvDesc>
                  <InvAmount>{inv.amount.toFixed(2)} {inv.currency}</InvAmount>
                  <StatusBadge $color={INV_STATUS_COLOR[inv.status]}>{INV_STATUS_LABEL[inv.status]}</StatusBadge>
                  <ProgramActions style={{ margin: 0, padding: 0, border: 'none', flexShrink: 0 }}>
                    {inv.status === 'PENDING' && (
                      <SmallBtn onClick={() => handleMarkPaid(inv.id)}>Pago</SmallBtn>
                    )}
                    <SmallBtn $danger onClick={() => handleDeleteInvoice(inv.id)}>✕</SmallBtn>
                  </ProgramActions>
                </InvRow>
              ))}
            </div>
          )}
        </TabContent>
      )}

      {activeTab === "habitos" && (
        <TabContent>
          <Section>
            <SectionTitle>Adicionar hábito</SectionTitle>
            <PhotoUploadRow>
              <PhotoNotesInput
                placeholder="Emoji (ex: 💧)"
                value={newHabitIcon}
                onChange={e => setNewHabitIcon(e.target.value)}
                style={{ maxWidth: 80 }}
              />
              <PhotoNotesInput
                placeholder="Nome do hábito (ex: Beber 2L de água)"
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateHabit()}
              />
              <UploadBtn disabled={savingHabit || !newHabitName.trim()} onClick={handleCreateHabit}>
                {savingHabit ? 'A guardar...' : '+ Adicionar'}
              </UploadBtn>
            </PhotoUploadRow>
          </Section>

          {loadingHabits ? (
            <Empty>A carregar hábitos...</Empty>
          ) : habits.length === 0 ? (
            <Empty>Sem hábitos definidos para este cliente.</Empty>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {habits.map(habit => (
                <HabitAdminRow key={habit.id} $inactive={!habit.isActive}>
                  <span style={{ fontSize: 20 }}>{habit.icon ?? '●'}</span>
                  <HabitAdminName $inactive={!habit.isActive}>{habit.name}</HabitAdminName>
                  <HabitAdminActions>
                    <SmallBtn onClick={() => handleToggleHabit(habit)}>
                      {habit.isActive ? 'Desactivar' : 'Activar'}
                    </SmallBtn>
                    <SmallBtn $danger onClick={() => handleDeleteHabit(habit.id)}>Eliminar</SmallBtn>
                  </HabitAdminActions>
                </HabitAdminRow>
              ))}
            </div>
          )}
        </TabContent>
      )}
    </Page>
  );
};

const TAB_LABELS = {
  overview: "Visão geral",
  programs: "Planos",
  sessions: "Sessões",
  assessments: "Avaliações",
  progress: "Progresso",
  fotos: "Fotos",
  habitos: "Hábitos",
  pagamentos: "Pagamentos",
};

function getAge(d: string) {
  return Math.floor(
    (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 40px 32px;
  max-width: 960px;
`;
const LoadingMsg = styled.p`
  font-family: "DM Mono", monospace;
  color: #666677;
  font-size: 13px;
  padding: 48px 0;
`;
const BackBtn = styled.button`
  background: none;
  border: none;
  color: #666677;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 24px;
  font-family: "DM Mono", monospace;
  padding: 0;
  &:hover {
    color: #c8f542;
  }
`;
const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;
const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background: rgba(200, 245, 66, 0.1);
  border: 1px solid rgba(200, 245, 66, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Syne", sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #c8f542;
  flex-shrink: 0;
`;
const ProfileInfo = styled.div`
  flex: 1;
`;
const ClientName = styled.h1`
  font-family: "Syne", sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #e8e8f0;
`;
const ClientMeta = styled.p`
  font-family: "DM Mono", monospace;
  font-size: 11px;
  color: #666677;
  margin-top: 3px;
`;
const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;
const ActionBtn = styled.button<{ $primary?: boolean }>`
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-family: "Syne", sans-serif;
  font-weight: 700;
  transition: all 0.2s;
  ${({ $primary }) =>
    $primary
      ? "background: #c8f542; color: #0a0a0f; border: none; &:hover { background: #d4ff55; }"
      : "background: transparent; border: 1px solid #2a2a35; color: #666677; &:hover { border-color: #c8f542; color: #c8f542; }"}
`;
const StatRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;
const StatCard = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 14px 18px;
  flex: 1;
  min-width: 100px;
`;
const StatVal = styled.div<{ $color?: string }>`
  font-family: "Syne", sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: ${({ $color }) => $color ?? "#e8e8f0"};
`;
const StatLabel = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 1px;
  margin-top: 2px;
`;
const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid #2a2a35;
  padding-bottom: 0;
`;
const Tab = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ $active }) => ($active ? "#c8f542" : "transparent")};
  color: ${({ $active }) => ($active ? "#c8f542" : "#666677")};
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
  font-family: "DM Mono", monospace;
  transition: all 0.2s;
  &:hover {
    color: #e8e8f0;
  }
`;
const TabContent = styled.div``;
const Section = styled.div`
  margin-bottom: 24px;
`;
const SectionTitle = styled.h3`
  font-family: "Syne", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 12px;
`;
const SessionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const SessionDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;
const SessionInfo = styled.div`
  flex: 1;
`;
const SessionDate = styled.div`
  font-size: 13px;
  color: #e8e8f0;
`;
const SessionMeta = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 11px;
  color: #666677;
  margin-top: 2px;
`;
const StatusBadge = styled.span<{ $color: string }>`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 3px;
  background: ${({ $color }) => $color}22;
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => $color}44;
`;
const ProgramCard = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 16px;
`;
const ProgramName = styled.div`
  font-family: "Syne", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 8px;
`;
const ProgramMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;
const ProgramExercises = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;
const ExTag = styled.span<{ $preferred?: boolean }>`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 3px;
  background: ${({ $preferred }) =>
    $preferred ? "rgba(200,245,66,0.06)" : "rgba(66,165,245,0.06)"};
  border: 1px solid
    ${({ $preferred }) =>
      $preferred ? "rgba(200,245,66,0.15)" : "rgba(66,165,245,0.15)"};
  color: ${({ $preferred }) => ($preferred ? "#c8f542" : "#42a5f5")};
`;
const NotesBox = styled.div`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 14px;
  font-size: 13px;
  color: #c0c0cc;
  line-height: 1.6;
`;
const AssessmentCard = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;
const AssessmentDate = styled.span`
  font-family: "DM Mono", monospace;
  font-size: 12px;
  color: #e8e8f0;
`;
const LevelBadge = styled.span<{ $level: string }>`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 3px;
  background: rgba(200, 245, 66, 0.08);
  border: 1px solid rgba(200, 245, 66, 0.2);
  color: #c8f542;
`;
const FlagsRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;
const FlagTag = styled.span`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 3px;
  background: rgba(255, 107, 53, 0.08);
  border: 1px solid rgba(255, 107, 53, 0.2);
  color: #ff8c5a;
`;
const Empty = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 13px;
  color: #666677;
  padding: 32px 0;
`;
const BtnLink = styled.span`
  color: #c8f542;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
const ProgramActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #1e1e28;
`;
// ─── Progress Photos ──────────────────────────────────────────────────────────
const PhotoUploadRow = styled.div`display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;`;
const PhotoSelect = styled.select`background:#111118;border:1px solid #2a2a35;color:#e8e8f0;font-family:'DM Mono',monospace;font-size:12px;padding:8px 12px;border-radius:6px;`;
const PhotoNotesInput = styled.input`background:#111118;border:1px solid #2a2a35;color:#e8e8f0;font-family:'DM Mono',monospace;font-size:12px;padding:8px 12px;border-radius:6px;flex:1;min-width:160px;&::placeholder{color:#444455;}&:focus{outline:none;border-color:#c8f542;}`;
const UploadBtn = styled.button`background:#c8f542;color:#0a0a0f;border:none;padding:8px 16px;border-radius:6px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;&:disabled{opacity:.5;cursor:not-allowed;}&:hover:not(:disabled){background:#d4ff55;}`;
const PhotoGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;`;
const PhotoCard = styled.div`position:relative;background:#111118;border:1px solid #2a2a35;border-radius:8px;overflow:hidden;&:hover>button{opacity:1;}`;
const PhotoImg = styled.img`width:100%;aspect-ratio:3/4;object-fit:cover;cursor:zoom-in;display:block;`;
const PhotoMeta = styled.div`padding:8px 10px;`;
const PhotoAngle = styled.div`font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#e8e8f0;`;
const PhotoDate = styled.div`font-family:'DM Mono',monospace;font-size:10px;color:#666677;margin-top:2px;`;
const PhotoNoteText = styled.div`font-family:'DM Mono',monospace;font-size:10px;color:#888899;margin-top:4px;font-style:italic;`;
const PhotoDeleteBtn = styled.button`position:absolute;top:6px;right:6px;background:rgba(0,0,0,.7);border:none;color:#ff6b6b;width:24px;height:24px;border-radius:4px;cursor:pointer;font-size:12px;opacity:0;transition:opacity .15s;&:hover{background:rgba(255,59,59,.3);}`;
const LightboxOverlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;`;
const LightboxImg = styled.img`max-width:90vw;max-height:90vh;object-fit:contain;border-radius:6px;`;
const LightboxClose = styled.button`position:absolute;top:20px;right:24px;background:none;border:none;color:#e8e8f0;font-size:24px;cursor:pointer;&:hover{color:#c8f542;}`;

// ─── Habits Admin ─────────────────────────────────────────────────────────────
const InvRow = styled.div`display:flex;align-items:center;gap:12px;background:#111118;border:1px solid #1e1e28;border-radius:8px;padding:12px 16px;flex-wrap:wrap;`;
const InvDesc = styled.div`flex:1;min-width:200px;`;
const InvAmount = styled.div`font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#e8e8f0;flex-shrink:0;`;

const HabitAdminRow = styled.div<{ $inactive: boolean }>`display:flex;align-items:center;gap:14px;background:#111118;border:1px solid ${p=>p.$inactive?'#1e1e28':'#2a2a35'};border-radius:10px;padding:12px 16px;opacity:${p=>p.$inactive?.5:1};transition:all .2s;`;
const HabitAdminName = styled.div<{ $inactive: boolean }>`flex:1;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:${p=>p.$inactive?'#444455':'#e8e8f0'};text-decoration:${p=>p.$inactive?'line-through':'none'};`;
const HabitAdminActions = styled.div`display:flex;gap:8px;flex-shrink:0;`;

const SmallBtn = styled.button<{ $danger?: boolean }>`
  font-family: "DM Mono", monospace;
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  ${({ $danger }) =>
    $danger
      ? `background: transparent; border: 1px solid rgba(255,59,59,0.3); color: #ff6b6b;
         &:hover:not(:disabled) { background: rgba(255,59,59,0.08); border-color: #ff3b3b; }
         &:disabled { opacity: 0.4; cursor: not-allowed; }`
      : `background: transparent; border: 1px solid #2a2a35; color: #666677;
         &:hover { border-color: #c8f542; color: #c8f542; }`}
`;
