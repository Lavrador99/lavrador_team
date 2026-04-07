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
  StepBody,
  StepCircle,
  StepItem,
  StepLabel,
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
  { label: "Pessoal", short: "01" },
  { label: "Anamnese", short: "02" },
  { label: "Físico", short: "03" },
  { label: "Exercícios", short: "04" },
  { label: "Revisão", short: "05" },
  { label: "Plano", short: "06" },
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
  const activeClient = clients.find((c) => c.id === clientId);

  if (!clientId) {
    return (
      <PageWrapper>
        <WizardHeader>
          <WizardTitle>Motor de Prescrição</WizardTitle>
          <WizardSubtitle>// seleciona o cliente para iniciar</WizardSubtitle>
        </WizardHeader>

        <ClientSelector>
          <SelectorLabel>Com quem vais trabalhar?</SelectorLabel>
          {loadingClients ? (
            <LoadingMsg>A carregar clientes...</LoadingMsg>
          ) : clients.length === 0 ? (
            <EmptyMsg>
              Nenhum cliente registado. Cria primeiro um utilizador com role CLIENT.
            </EmptyMsg>
          ) : (
            <>
              <ClientGrid>
                {clients.map((c) => (
                  <ClientCard
                    key={c.id}
                    $selected={selectedClientId === c.id}
                    onClick={() => handleClientSelect(c.id)}
                  >
                    <ClientAvatar $selected={selectedClientId === c.id}>
                      {c.name[0].toUpperCase()}
                    </ClientAvatar>
                    <ClientName>{c.name}</ClientName>
                    {selectedClientId === c.id && (
                      <SelectedCheck>✓</SelectedCheck>
                    )}
                  </ClientCard>
                ))}
              </ClientGrid>

              {selectedClientId && (
                <StartBtn onClick={() => dispatch(setClientId(selectedClientId))}>
                  Iniciar prescrição →
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
        {activeClient && (
          <WizardSubtitle>// {activeClient.name}</WizardSubtitle>
        )}
      </WizardHeader>

      <StepsNav>
        {STEPS.map((step, i) => (
          <StepItem key={i} $active={i === currentStep} $done={i < currentStep}>
            <StepCircle $active={i === currentStep} $done={i < currentStep}>
              {i < currentStep ? "✓" : i + 1}
            </StepCircle>
            <StepLabel $active={i === currentStep} $done={i < currentStep}>
              {step.label}
            </StepLabel>
          </StepItem>
        ))}
      </StepsNav>

      <StepBody key={currentStep}>
        <StepComponent />
      </StepBody>
    </PageWrapper>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const ClientSelector = styled.div`
  max-width: 560px;
`;

const SelectorLabel = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 24px;
`;

const LoadingMsg = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #444455;
`;

const EmptyMsg = styled.p`
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: #ff8c5a;
  background: rgba(255, 107, 53, 0.06);
  border: 1px solid rgba(255, 107, 53, 0.18);
  border-radius: 10px;
  padding: 18px 22px;
  line-height: 1.5;
`;

const ClientGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 28px;
`;

const ClientCard = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: ${({ $selected }) =>
    $selected ? "rgba(200,245,66,0.05)" : "#111118"};
  border: 1.5px solid ${({ $selected }) => ($selected ? "#c8f542" : "#1e1e28")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s;
  &:hover {
    border-color: rgba(200, 245, 66, 0.5);
  }
`;

const ClientAvatar = styled.div<{ $selected?: boolean }>`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: ${({ $selected }) =>
    $selected ? "rgba(200,245,66,0.12)" : "rgba(200,245,66,0.06)"};
  border: 1px solid rgba(200, 245, 66, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 800;
  color: #c8f542;
  flex-shrink: 0;
`;

const ClientName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e8e8f0;
  flex: 1;
`;

const SelectedCheck = styled.div`
  font-size: 16px;
  color: #c8f542;
`;

const StartBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 8px;
  padding: 15px 32px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s;
  &:hover {
    background: #d4ff55;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(200,245,66,0.2);
  }
`;
