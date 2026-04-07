import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useExercises } from "../../hooks/useExercises";
import { RootState } from "../../store";
import { ExerciseFilters } from "../../utils/api/exercises.api";
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

const EQUIPMENT_LABELS: Record<string, string> = {
  BARRA: "Barra",
  HALTERES: "Halteres",
  RACK: "Rack",
  MAQUINAS: "Máquinas",
  CABO: "Cabo",
  KETTLEBELL: "Kettlebell",
  PESO_CORPORAL: "Peso Corporal",
  BANCO: "Banco",
  CARDIO_EQ: "Cardio",
  SMITH: "Smith",
  RESISTANCE_BAND: "Elástico",
  PARALELAS: "Paralelas",
  BARRA_FIXA: "Barra Fixa",
  FOAM_ROLLER: "Foam Roller",
};

export const ExercisesPage: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [searchInput, setSearchInput] = useState("");

  const [filters, setFilters] = useState<ExerciseFilters>({
    pattern: undefined,
    level: undefined,
    equipment: undefined,
    muscle: undefined,
    search: undefined,
  });

  const { exercises, loading, error } = useExercises(filters);

  const clearFilters = () => {
    setFilters({
      search: undefined,
      pattern: undefined,
      level: undefined,
      equipment: undefined,
    });
    setSearchInput("");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setFilters((prev) => ({ ...prev, search: val || undefined }));
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <PageTitle>Base de Exercícios</PageTitle>
          <PageSubtitle>
            // {exercises.length} exercícios · 8 padrões de movimento
          </PageSubtitle>
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
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              pattern: e.target.value || undefined,
            }))
          }
        >
          <option value="">Todos os padrões</option>
          {Object.entries(PATTERN_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.level ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              level: e.target.value || undefined,
            }))
          }
        >
          <option value="">Todos os níveis</option>
          <option value="INICIANTE">Iniciante</option>
          <option value="INTERMEDIO">Intermédio</option>
          <option value="AVANCADO">Avançado</option>
        </FilterSelect>

        <FilterSelect
          value={filters.equipment ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              equipment: e.target.value || undefined,
            }))
          }
        >
          <option value="">Todo o equipamento</option>
          {Object.entries(EQUIPMENT_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </FilterSelect>

        <ClearBtn onClick={clearFilters}>Limpar filtros</ClearBtn>

        <ResultCount>{exercises.length} resultados</ResultCount>
      </FiltersBar>

      <ExerciseGrid>
        {loading && <LoadingGrid>A carregar exercícios...</LoadingGrid>}

        {!loading && exercises.length === 0 && (
          <EmptyState>
            Nenhum exercício encontrado com os filtros aplicados.
          </EmptyState>
        )}

        {!loading &&
          exercises.map((ex) => (
            <ExerciseCard key={ex.id}>
              <CardGif $url={ex.gifUrl ?? undefined}>
                {!ex.gifUrl && "🏋️"}
              </CardGif>
              <CardBody>
                <CardName>{ex.name}</CardName>
                <TagRow>
                  <Tag $variant="pattern">
                    {PATTERN_LABELS[ex.pattern] ?? ex.pattern}
                  </Tag>
                  <Tag $variant="level">
                    {LEVEL_LABELS[ex.level] ?? ex.level}
                  </Tag>
                </TagRow>
                <TagRow>
                  {ex.primaryMuscles.map((m) => (
                    <Tag key={m} $variant="muscle">
                      {m}
                    </Tag>
                  ))}
                  {ex.secondaryMuscles.slice(0, 2).map((m) => (
                    <Tag key={m}>{m}</Tag>
                  ))}
                </TagRow>
                <TagRow>
                  {ex.equipment.map((eq) => (
                    <Tag key={eq} $variant="equip">
                      {EQUIPMENT_LABELS[eq] ?? eq}
                    </Tag>
                  ))}
                </TagRow>
                {ex.clinicalNotes && ex.clinicalNotes.length > 0 && (
                  <ClinicalFlag>
                    ⚠{" "}
                    {ex.clinicalNotes
                      .map((n) => n.replace("evitar_", "Cuidado "))
                      .join(" · ")}
                  </ClinicalFlag>
                )}
              </CardBody>
            </ExerciseCard>
          ))}
      </ExerciseGrid>
    </PageWrapper>
  );
};
