import { SessionDto, SessionStatus, SessionType } from "@libs/types";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { AppDispatch } from "../../../store";
import {
  createSession,
  removeSession,
  updateSession,
} from "../../../store/slices/scheduleSlice";

interface Props {
  session?: SessionDto | null;
  defaultDate?: string;
  clients: { id: string; name: string }[];
  onClose: () => void;
}

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "TRAINING", label: "Treino" },
  { value: "ASSESSMENT", label: "Avaliação" },
  { value: "FOLLOWUP", label: "Follow-up" },
];

const SESSION_STATUSES: { value: SessionStatus; label: string }[] = [
  { value: "SCHEDULED", label: "Agendada" },
  { value: "COMPLETED", label: "Concluída" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "NO_SHOW", label: "Falta" },
];

export const SessionModal: React.FC<Props> = ({
  session,
  defaultDate,
  clients,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = !!session;

  const [clientId, setClientId] = useState(session?.clientId ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    session?.scheduledAt
      ? new Date(session.scheduledAt).toISOString().slice(0, 16)
      : (defaultDate ?? new Date().toISOString().slice(0, 16)),
  );
  const [duration, setDuration] = useState(
    session?.duration?.toString() ?? "60",
  );
  const [type, setType] = useState(session?.type ?? "TRAINING");
  const [status, setStatus] = useState(session?.status ?? "SCHEDULED");
  const [notes, setNotes] = useState(session?.notes ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      if (isEdit) {
        await dispatch(
          updateSession({
            id: session!.id,
            body: {
              scheduledAt,
              duration: parseInt(duration),
              type: type as SessionType,
              status: status as SessionStatus,
              notes: notes || undefined,
            },
          }),
        );
      } else {
        await dispatch(
          createSession({
            clientId,
            scheduledAt,
            duration: parseInt(duration),
            type: type as any,
            notes: notes || undefined,
          }),
        );
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !window.confirm("Eliminar esta sessão?")) return;
    setLoading(true);
    await dispatch(removeSession(session.id));
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{isEdit ? "Editar Sessão" : "Nova Sessão"}</ModalTitle>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </ModalHeader>

        <Form>
          {!isEdit && (
            <Field>
              <Label>Cliente</Label>
              <Select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Selecionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field>
            <Label>Data & Hora</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </Field>

          <Grid2>
            <Field>
              <Label>Duração (min)</Label>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                {[30, 45, 60, 75, 90, 120].map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Tipo</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as SessionType)}
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </Grid2>

          {isEdit && (
            <Field>
              <Label>Estado</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as SessionStatus)}
              >
                {SESSION_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field>
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre a sessão..."
              rows={3}
            />
          </Field>
        </Form>

        <ModalFooter>
          {isEdit && (
            <DeleteBtn onClick={handleDelete} disabled={loading}>
              Eliminar
            </DeleteBtn>
          )}
          <BtnGroup>
            <CancelBtn onClick={onClose}>Cancelar</CancelBtn>
            <SaveBtn onClick={handleSave} disabled={loading || !clientId}>
              {loading ? "A guardar..." : isEdit ? "Guardar" : "Criar Sessão"}
            </SaveBtn>
          </BtnGroup>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
`;
const Modal = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
`;
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #2a2a35;
`;
const ModalTitle = styled.h2`
  font-family: "Syne", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #e8e8f0;
`;
const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #666677;
  font-size: 18px;
  cursor: pointer;
  &:hover {
    color: #e8e8f0;
  }
`;
const Form = styled.div`
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;
const Label = styled.label`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 2px;
  text-transform: uppercase;
`;
const Input = styled.input`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 10px 12px;
  color: #e8e8f0;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  &:focus {
    border-color: #c8f542;
  }
`;
const Select = styled.select`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 10px 12px;
  color: #e8e8f0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  &:focus {
    border-color: #c8f542;
  }
  option {
    background: #18181f;
  }
`;
const Textarea = styled.textarea`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 10px 12px;
  color: #e8e8f0;
  font-size: 13px;
  outline: none;
  resize: vertical;
  font-family: "DM Sans", sans-serif;
  &:focus {
    border-color: #c8f542;
  }
`;
const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #2a2a35;
`;
const BtnGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
`;
const SaveBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-family: "Syne", sans-serif;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: #d4ff55;
  }
`;
const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 13px;
  cursor: pointer;
  &:hover {
    border-color: #666677;
    color: #e8e8f0;
  }
`;
const DeleteBtn = styled.button`
  background: rgba(255, 59, 59, 0.1);
  border: 1px solid rgba(255, 59, 59, 0.3);
  color: #ff6b6b;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 13px;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
  }
  &:hover:not(:disabled) {
    background: rgba(255, 59, 59, 0.2);
  }
`;
