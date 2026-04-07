import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { MuscleMap } from "../../components/MuscleMap";
import { useExercises } from "../../hooks/useExercises";
import { RootState } from "../../store";
import { ExerciseFilters, exercisesApi } from "../../utils/api/exercises.api";
import {
  CardBody,
  CardGif,
  CardName,
  ClearBtn,
  ClinicalFlag,
  EmptyState,
  ExerciseCard,
  ExerciseGrid,
  FiltersBar,
  FilterSelect,
  LoadingGrid,
  PageHeader,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  ResultCount,
  SearchInput,
  Tag,
  TagRow,
} from "./ExercisesPage.styles";
import { ExerciseDto } from "@libs/types";

const PATTERN_LABELS: Record<string, string> = {
  DOMINANTE_JOELHO: "Dom. Joelho",
  DOMINANTE_ANCA: "Dom. Anca",
  EMPURRAR_HORIZONTAL: "Empurrar H.",
  EMPURRAR_VERTICAL: "Empurrar V.",
  PUXAR_HORIZONTAL: "Puxar H.",
  PUXAR_VERTICAL: "Puxar V.",
  CORE: "Core",
  LOCOMOCAO: "Locomoção",
};

const LEVEL_LABELS: Record<string, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIO: "Intermédio",
  AVANCADO: "Avançado",
};

const LEVEL_COLOR: Record<string, string> = {
  INICIANTE: "#42a5f5",
  INTERMEDIO: "#c8f542",
  AVANCADO: "#ff8c5a",
};

const EQUIPMENT_LABELS: Record<string, string> = {
  BARRA: "Barra", HALTERES: "Halteres", RACK: "Rack", MAQUINAS: "Máquinas",
  CABO: "Cabo", KETTLEBELL: "Kettlebell", PESO_CORPORAL: "Peso Corporal",
  BANCO: "Banco", CARDIO_EQ: "Cardio", SMITH: "Smith",
  RESISTANCE_BAND: "Elástico", PARALELAS: "Paralelas",
  BARRA_FIXA: "Barra Fixa", FOAM_ROLLER: "Foam Roller",
};

// youtube-nocookie.com bypasses the iframe sandbox restriction on localhost/unlisted origins
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}?rel=0&modestbranding=1`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube-nocookie.com/embed${u.pathname}?rel=0&modestbranding=1`;
    }
    return url; // direct video file
  } catch {
    return null;
  }
}

function isYouTube(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYouTubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    const v = u.hostname.includes('youtube.com')
      ? u.searchParams.get('v')
      : u.pathname.slice(1);
    return v ? `https://img.youtube.com/vi/${v}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

export const ExercisesPage: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const isAdmin = user?.role === 'ADMIN';
  const [searchInput, setSearchInput] = useState("");
  const [activeEx, setActiveEx] = useState<ExerciseDto | null>(null);
  const [editingVideoUrl, setEditingVideoUrl] = useState("");
  const [savingMedia, setSavingMedia] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [localExMap, setLocalExMap] = useState<Record<string, Partial<ExerciseDto>>>({});
  const [gifErrors, setGifErrors] = useState<Set<string>>(new Set());
  const [onlyWithDemo, setOnlyWithDemo] = useState(false);;

  const [filters, setFilters] = useState<ExerciseFilters>({
    pattern: undefined, level: undefined,
    equipment: undefined, muscle: undefined, search: undefined,
  });

  const { exercises: allExercises, loading } = useExercises(filters);
  const exercises = onlyWithDemo
    ? allExercises.filter((ex) => ex.videoUrl || ex.gifUrl)
    : allExercises;

  const clearFilters = () => {
    setFilters({ search: undefined, pattern: undefined, level: undefined, equipment: undefined });
    setSearchInput("");
    setOnlyWithDemo(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setFilters((prev) => ({ ...prev, search: val || undefined }));
  };

  const handleCardClick = (ex: ExerciseDto) => {
    const merged = { ...ex, ...localExMap[ex.id] };
    setActiveEx((prev) => (prev?.id === ex.id ? null : merged as ExerciseDto));
    setEditingVideoUrl((ex.videoUrl ?? localExMap[ex.id]?.videoUrl) ?? "");
  };

  const applyMediaUpdate = (updated: ExerciseDto) => {
    const patch = { videoUrl: updated.videoUrl, gifUrl: updated.gifUrl };
    setLocalExMap((m) => ({ ...m, [updated.id]: { ...m[updated.id], ...patch } }));
    setActiveEx((prev) => prev ? { ...prev, ...patch } : prev);
    // If a gif error existed and now we have a new gifUrl, clear the error
    if (updated.gifUrl) setGifErrors((s) => { const n = new Set(s); n.delete(updated.id); return n; });
  };

  const handleSaveVideoUrl = async () => {
    if (!activeEx) return;
    setSavingMedia(true);
    try {
      const updated = await exercisesApi.updateMedia(activeEx.id, {
        videoUrl: editingVideoUrl.trim() || null,
      });
      applyMediaUpdate(updated);
    } finally {
      setSavingMedia(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEx) return;
    setUploadPct(0);
    try {
      const updated = await exercisesApi.uploadFile(activeEx.id, file, setUploadPct);
      applyMediaUpdate(updated);
    } finally {
      setUploadPct(null);
      e.target.value = '';
    }
  };

  return (
    <>
      <PageWrapper>
        <PageHeader>
          <div>
            <PageTitle>Base de Exercícios</PageTitle>
            <PageSubtitle>// {exercises.length} exercícios · 8 padrões de movimento</PageSubtitle>
          </div>
        </PageHeader>

        <FiltersBar>
          <SearchInput
            placeholder="Pesquisar exercício..."
            value={searchInput}
            onChange={handleSearch}
          />
          <FilterSelect
            value={filters.pattern ?? ""}
            onChange={(e) => setFilters((p) => ({ ...p, pattern: e.target.value || undefined }))}
          >
            <option value="">Todos os padrões</option>
            {Object.entries(PATTERN_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filters.level ?? ""}
            onChange={(e) => setFilters((p) => ({ ...p, level: e.target.value || undefined }))}
          >
            <option value="">Todos os níveis</option>
            <option value="INICIANTE">Iniciante</option>
            <option value="INTERMEDIO">Intermédio</option>
            <option value="AVANCADO">Avançado</option>
          </FilterSelect>
          <FilterSelect
            value={filters.equipment ?? ""}
            onChange={(e) => setFilters((p) => ({ ...p, equipment: e.target.value || undefined }))}
          >
            <option value="">Todo o equipamento</option>
            {Object.entries(EQUIPMENT_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </FilterSelect>
          <DemoFilterBtn $active={onlyWithDemo} onClick={() => setOnlyWithDemo((v) => !v)}>
            {onlyWithDemo ? '▶ Com demo' : '▶ Com demo'}
          </DemoFilterBtn>
          <ClearBtn onClick={clearFilters}>Limpar filtros</ClearBtn>
          <ResultCount>{exercises.length} resultados</ResultCount>
        </FiltersBar>

        <ExerciseGrid>
          {loading && <LoadingGrid>A carregar exercícios...</LoadingGrid>}

          {!loading && exercises.length === 0 && (
            <EmptyState>Nenhum exercício encontrado com os filtros aplicados.</EmptyState>
          )}

          {!loading && exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              onClick={() => handleCardClick(ex)}
              $active={activeEx?.id === ex.id}
            >
              <CardGif $url={(!ex.videoUrl && ex.gifUrl && !gifErrors.has(ex.id)) ? ex.gifUrl : undefined}>
                {ex.videoUrl ? (
                  <VideoIndicator>▶</VideoIndicator>
                ) : (!ex.gifUrl || gifErrors.has(ex.id)) ? (
                  <GifPlaceholder>🏋️</GifPlaceholder>
                ) : null}
              </CardGif>
              <CardBody>
                <CardHeaderRow>
                  <CardName>{ex.name}</CardName>
                  <LevelDot $color={LEVEL_COLOR[ex.level]} title={LEVEL_LABELS[ex.level]} />
                </CardHeaderRow>
                <TagRow>
                  <Tag $variant="pattern">{PATTERN_LABELS[ex.pattern] ?? ex.pattern}</Tag>
                </TagRow>
                <TagRow>
                  {ex.primaryMuscles.map((m) => (
                    <Tag key={m} $variant="muscle">{m.replace(/_/g, ' ')}</Tag>
                  ))}
                  {ex.secondaryMuscles.slice(0, 2).map((m) => (
                    <Tag key={m}>{m.replace(/_/g, ' ')}</Tag>
                  ))}
                </TagRow>
                <TagRow>
                  {ex.equipment.slice(0, 3).map((eq) => (
                    <Tag key={eq} $variant="equip">{EQUIPMENT_LABELS[eq] ?? eq}</Tag>
                  ))}
                  {ex.equipment.length > 3 && (
                    <Tag>+{ex.equipment.length - 3}</Tag>
                  )}
                </TagRow>
                {ex.clinicalNotes && ex.clinicalNotes.length > 0 && (
                  <ClinicalFlag>
                    ⚠ {ex.clinicalNotes.map((n) => n.replace("evitar_", "Cuidado ")).join(" · ")}
                  </ClinicalFlag>
                )}
                <ExpandHint $active={activeEx?.id === ex.id}>
                  {activeEx?.id === ex.id ? "▲ fechar" : "▼ ver músculos"}
                </ExpandHint>
              </CardBody>
            </ExerciseCard>
          ))}
        </ExerciseGrid>
      </PageWrapper>

      {/* ── Muscle detail panel (fixed side) ─────────── */}
      {activeEx && (
        <DetailPanel>
          <PanelClose onClick={() => setActiveEx(null)}>✕</PanelClose>
          <PanelName>{activeEx.name}</PanelName>
          <PanelMeta>
            <Tag $variant="pattern">{PATTERN_LABELS[activeEx.pattern] ?? activeEx.pattern}</Tag>
            <Tag $variant="level">{LEVEL_LABELS[activeEx.level]}</Tag>
          </PanelMeta>

          {/* ── Media display: videoUrl > gifUrl > placeholder ── */}
          {activeEx.videoUrl ? (
            isYouTube(activeEx.videoUrl) ? (
              <YouTubeBox>
                <VideoEmbed
                  src={toEmbedUrl(activeEx.videoUrl) ?? ''}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeEx.name}
                />
                <YouTubeFallback
                  href={activeEx.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ↗ Abrir no YouTube
                </YouTubeFallback>
              </YouTubeBox>
            ) : (
              <VideoPlayer controls loop muted playsInline>
                <source src={activeEx.videoUrl} />
              </VideoPlayer>
            )
          ) : activeEx.gifUrl && !gifErrors.has(activeEx.id) ? (
            <GifImg
              src={activeEx.gifUrl}
              alt={activeEx.name}
              onError={() => setGifErrors((s) => new Set(s).add(activeEx.id))}
            />
          ) : (
            <NoGifBox>
              <span>🏋️</span>
              <NoGifText>Sem vídeo/GIF</NoGifText>
            </NoGifBox>
          )}

          {/* ── ADMIN: upload media ── */}
          {isAdmin && (
            <MediaEditBox>
              <MediaEditLabel>Demonstração (GIF ou vídeo)</MediaEditLabel>

              {/* File upload */}
              <UploadArea>
                <UploadLabel htmlFor={`upload-${activeEx.id}`}>
                  {uploadPct !== null ? (
                    <>
                      <UploadBar $pct={uploadPct} />
                      <span>{uploadPct}%</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon>↑</UploadIcon>
                      <span>Carregar GIF ou vídeo</span>
                      <UploadSub>GIF · MP4 · WebM · max 50 MB</UploadSub>
                    </>
                  )}
                </UploadLabel>
                <input
                  id={`upload-${activeEx.id}`}
                  type="file"
                  accept="image/gif,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploadPct !== null}
                />
              </UploadArea>

              {/* YouTube URL */}
              <MediaEditLabel style={{ marginTop: 8 }}>ou link YouTube</MediaEditLabel>
              <MediaEditRow>
                <MediaEditInput
                  placeholder="https://youtube.com/watch?v=..."
                  value={editingVideoUrl}
                  onChange={(e) => setEditingVideoUrl(e.target.value)}
                />
                <MediaSaveBtn onClick={handleSaveVideoUrl} disabled={savingMedia}>
                  {savingMedia ? '...' : 'Guardar'}
                </MediaSaveBtn>
              </MediaEditRow>

              {(activeEx.videoUrl || activeEx.gifUrl) && (
                <MediaClearBtn onClick={async () => {
                  const updated = await exercisesApi.updateMedia(activeEx.id, { videoUrl: null, gifUrl: null });
                  applyMediaUpdate(updated);
                  setEditingVideoUrl('');
                }}>
                  × Remover media
                </MediaClearBtn>
              )}
            </MediaEditBox>
          )}

          <MuscleMap
            primaryMuscles={activeEx.primaryMuscles}
            secondaryMuscles={activeEx.secondaryMuscles}
          />

          <MuscleGroups>
            <MuscleGroupBlock>
              <MuscleGroupLabel>Principal</MuscleGroupLabel>
              {activeEx.primaryMuscles.map((m) => (
                <MusclePill key={m} $primary>{m.replace(/_/g, ' ')}</MusclePill>
              ))}
            </MuscleGroupBlock>
            {activeEx.secondaryMuscles.length > 0 && (
              <MuscleGroupBlock>
                <MuscleGroupLabel>Secundário</MuscleGroupLabel>
                {activeEx.secondaryMuscles.map((m) => (
                  <MusclePill key={m}>{m.replace(/_/g, ' ')}</MusclePill>
                ))}
              </MuscleGroupBlock>
            )}
          </MuscleGroups>

          {activeEx.equipment.length > 0 && (
            <EquipRow>
              {activeEx.equipment.map((eq) => (
                <Tag key={eq} $variant="equip">{EQUIPMENT_LABELS[eq] ?? eq}</Tag>
              ))}
            </EquipRow>
          )}

          {activeEx.clinicalNotes && activeEx.clinicalNotes.length > 0 && (
            <ClinicalFlag style={{ marginTop: 12 }}>
              ⚠ {activeEx.clinicalNotes.map((n) => n.replace("evitar_", "Cuidado ")).join(" · ")}
            </ClinicalFlag>
          )}
        </DetailPanel>
      )}
    </>
  );
};

// ─── Extra styled components ──────────────────────────────────────────────────

const GifPlaceholder = styled.div`
  font-size: 32px;
  opacity: 0.3;
`;

const VideoIndicator = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(200, 245, 66, 0.15);
  border: 1px solid rgba(200, 245, 66, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #c8f542;
`;

const CardHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
`;

const LevelDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  margin-top: 4px;
`;

const ExpandHint = styled.div<{ $active?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: ${({ $active }) => ($active ? '#c8f542' : '#333342')};
  letter-spacing: 1px;
  margin-top: 10px;
  text-align: right;
  transition: color 0.2s;
`;

// ── Detail panel ────────────────────────────────────────────────

const DetailPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  height: 100vh;
  background: #0d0d13;
  border-left: 1px solid #1e1e28;
  overflow-y: auto;
  padding: 24px 20px 40px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideIn 0.2s ease;

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }

  @media (max-width: 600px) {
    width: 100vw;
  }
`;

const PanelClose = styled.button`
  align-self: flex-end;
  background: transparent;
  border: 1px solid #1e1e28;
  color: #555566;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover { border-color: #ff3b3b; color: #ff6b6b; }
`;

const PanelName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #e8e8f0;
  line-height: 1.3;
`;

const PanelMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const GifImg = styled.img`
  width: 100%;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid #1e1e28;
`;

const NoGifBox = styled.div`
  width: 100%;
  height: 120px;
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 28px;
`;

const NoGifText = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333342;
  letter-spacing: 1px;
`;

const MuscleGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MuscleGroupBlock = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const MuscleGroupLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #333342;
  letter-spacing: 2px;
  text-transform: uppercase;
  width: 100%;
`;

const MusclePill = styled.div<{ $primary?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${({ $primary }) => ($primary ? 'rgba(200,245,66,0.1)' : 'rgba(200,245,66,0.03)')};
  border: 1px solid ${({ $primary }) => ($primary ? 'rgba(200,245,66,0.3)' : '#1e1e28')};
  color: ${({ $primary }) => ($primary ? '#c8f542' : '#555566')};
`;

const EquipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const YouTubeBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const YouTubeFallback = styled.a`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #555566;
  text-align: right;
  letter-spacing: 1px;
  text-decoration: none;
  transition: color 0.15s;
  &:hover { color: #c8f542; }
`;

const VideoEmbed = styled.iframe`
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 10px;
  border: 1px solid #1e1e28;
`;

const VideoPlayer = styled.video`
  width: 100%;
  border-radius: 10px;
  border: 1px solid #1e1e28;
  background: #000;
`;

const MediaEditBox = styled.div`
  background: #0a0a0f;
  border: 1px solid #1e1e28;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MediaEditLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #444455;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const MediaEditRow = styled.div`
  display: flex;
  gap: 8px;
`;

const MediaEditInput = styled.input`
  flex: 1;
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 5px;
  padding: 7px 10px;
  color: #e8e8f0;
  font-size: 11px;
  font-family: 'DM Mono', monospace;
  outline: none;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #333342; }
`;

const MediaSaveBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 5px;
  padding: 7px 14px;
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #d4ff55; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const UploadArea = styled.div`
  border: 1px dashed #2a2a35;
  border-radius: 8px;
  transition: border-color 0.2s;
  &:hover { border-color: rgba(200,245,66,0.4); }
`;

const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 18px;
  cursor: pointer;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #555566;
  text-align: center;
  position: relative;
  overflow: hidden;
  &:hover { color: #c8f542; }
`;

const UploadIcon = styled.span`
  font-size: 20px;
  color: #333342;
`;

const UploadSub = styled.span`
  font-size: 9px;
  color: #333342;
  letter-spacing: 1px;
`;

const UploadBar = styled.div<{ $pct: number }>`
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: ${({ $pct }) => $pct}%;
  background: rgba(200,245,66,0.12);
  transition: width 0.2s;
`;

const MediaClearBtn = styled.button`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  letter-spacing: 1px;
  transition: color 0.15s;
  &:hover { color: #ff6b6b; }
`;

const DemoFilterBtn = styled.button<{ $active: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  ${({ $active }) =>
    $active
      ? `background: rgba(200,245,66,0.12); border: 1px solid rgba(200,245,66,0.4); color: #c8f542;`
      : `background: #18181f; border: 1px solid #2a2a35; color: #666677; &:hover { border-color: #c8f542; color: #c8f542; }`}
`;
