import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { AppDispatch, RootState } from "../../store";
import {
  resetPrescription,
  setClientId,
} from "../../store/slices/prescriptionSlice";
import { clientsApi } from "../../utils/api/clients.api";
import {
  PageWrapper,
  StepDot,
  StepsNav,
  WizardHeader,
  WizardSubtitle,
  WizardTitle,
} from "./Prescription.styles";
import { Step1Personal } from "./steps/Step1Personal";
import { Step2Sports } from "./steps/Step2Sports";
import { Step3Physical } from "./steps/Step3Physical";
import { Step4Exercises } from "./steps/Step4Exercises";
import { Step5Review } from "./steps/Step5Review";
import { Step6Plan } from "./steps/Step6Plan";

const STEPS = [
  "Dados Pessoais",
  "Anamnese",
  "Avaliação Física",
  "Exercícios",
  "Revisão",
  "Plano",
];
const STEP_COMPONENTS = [
  Step1Personal,
  Step2Sports,
  Step3Physical,
  Step4Exercises,
  Step5Review,
  Step6Plan,
];

export const PrescriptionPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentStep, clientId } = useSelector(
    (s: RootState) => s.prescription,
  );
  const [searchParams] = useSearchParams();

  // Lista de clientes para o selector
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    clientsApi
      .getAll()
      .then((data) => {
        const mapped = data
          .filter((u) => u.client)
          .map((u) => ({ id: u.client!.id, name: u.client!.name }));
        setClients(mapped);

        // Se veio por query param, pré-selecciona
        const qClientId = searchParams.get("clientId");
        if (qClientId) {
          setSelectedClientId(qClientId);
          dispatch(setClientId(qClientId));
        }
      })
      .finally(() => setLoadingClients(false));

    return () => {
      dispatch(resetPrescription());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClientSelect = (id: string) => {
    setSelectedClientId(id);
    dispatch(setClientId(id));
  };

  const StepComponent = STEP_COMPONENTS[currentStep];

  // Mostrar selector se não há cliente seleccionado
  if (!clientId) {
    return (
      <PageWrapper>
        <WizardHeader>
          <WizardTitle>Motor de Prescrição</WizardTitle>
          <WizardSubtitle>// seleciona o cliente para iniciar</WizardSubtitle>
        </WizardHeader>

        <ClientSelector>
          <SelectorLabel>Selecionar Cliente</SelectorLabel>
          {loadingClients ? (
            <LoadingMsg>A carregar clientes...</LoadingMsg>
          ) : clients.length === 0 ? (
            <EmptyMsg>
              Nenhum cliente registado. Cria primeiro um utilizador com role
              CLIENT.
            </EmptyMsg>
          ) : (
            <>
              <ClientList>
                {clients.map((c) => (
                  <ClientItem
                    key={c.id}
                    $selected={selectedClientId === c.id}
                    onClick={() => handleClientSelect(c.id)}
                  >
                    <ClientAvatar>{c.name[0].toUpperCase()}</ClientAvatar>
                    <ClientName>{c.name}</ClientName>
                    {selectedClientId === c.id && (
                      <SelectedMark>✓</SelectedMark>
                    )}
                  </ClientItem>
                ))}
              </ClientList>

              {selectedClientId && (
                <StartBtn
                  onClick={() => dispatch(setClientId(selectedClientId))}
                >
                  Iniciar Prescrição →
                </StartBtn>
              )}
            </>
          )}
        </ClientSelector>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <WizardHeader>
        <WizardTitle>Motor de Prescrição</WizardTitle>
        <WizardSubtitle>
          // {clients.find((c) => c.id === clientId)?.name ?? clientId} ·{" "}
          {STEPS[currentStep]} · passo {currentStep + 1}/{STEPS.length}
        </WizardSubtitle>
      </WizardHeader>

      <StepsNav>
        {STEPS.map((_, i) => (
          <StepDot
            key={i}
            $active={i === currentStep}
            $done={i < currentStep}
          />
        ))}
      </StepsNav>

      <StepComponent />
    </PageWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const ClientSelector = styled.div`
  max-width: 520px;
`;
const SelectorLabel = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 11px;
  color: #666677;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 16px;
`;
const LoadingMsg = styled.p`
  font-family: "DM Mono", monospace;
  font-size: 13px;
  color: #666677;
`;
const EmptyMsg = styled.p`
  font-family: "DM Mono", monospace;
  font-size: 13px;
  color: #ff8c5a;
  background: rgba(255, 107, 53, 0.06);
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 8px;
  padding: 16px 20px;
  line-height: 1.5;
`;
const ClientList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
`;
const ClientItem = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: ${({ $selected }) =>
    $selected ? "rgba(200,245,66,0.06)" : "#111118"};
  border: 1px solid ${({ $selected }) => ($selected ? "#c8f542" : "#2a2a35")};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: rgba(200, 245, 66, 0.4);
  }
`;
const ClientAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(200, 245, 66, 0.1);
  border: 1px solid rgba(200, 245, 66, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Syne", sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #c8f542;
  flex-shrink: 0;
`;
const ClientName = styled.div`
  font-family: "Syne", sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #e8e8f0;
  flex: 1;
`;
const SelectedMark = styled.div`
  font-size: 18px;
  color: #c8f542;
`;
const StartBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 6px;
  padding: 14px 28px;
  font-family: "Syne", sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background 0.2s;
  &:hover {
    background: #d4ff55;
  }
`;
