import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDashboardStats } from "../../hooks/useStats";
import { RootState } from "../../store";
import { AttendanceGauge } from "./components/AttendanceGauge";
import { ClientDashboard } from "./components/ClientDashboard";
import { RecentActivity } from "./components/RecentActivity";
import { SessionsBarChart } from "./components/SessionsBarChart";
import { SessionsPieChart } from "./components/SessionsPieChart";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const isAdmin = user?.role === "ADMIN";
  const { stats, loading } = useDashboardStats();

  return (
    <Page>
      <Greeting>
        <Title>
          Bom dia{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
        </Title>
        <Subtitle>
          //{" "}
          {new Date().toLocaleDateString("pt-PT", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </Subtitle>
      </Greeting>

      {isAdmin && (
        <>
          {/* ── KPI row ── */}
          <StatGrid>
            {[
              {
                label: "Clientes",
                val: stats?.totalClients,
                color: "#c8f542",
                action: () => navigate("/clients"),
              },
              {
                label: "Planos ativos",
                val: stats?.activePrograms,
                color: "#42a5f5",
                action: () => navigate("/clients"),
              },
              {
                label: "Sessões esta semana",
                val: stats?.sessionsThisWeek,
                color: "#ff8c5a",
                action: () => navigate("/schedule"),
              },
              {
                label: "Novos este mês",
                val: stats?.newClientsThisMonth,
                color: "#a855f7",
                action: () => navigate("/clients"),
              },
            ].map(({ label, val, color, action }) => (
              <StatCard key={label} $color={color} onClick={action}>
                <StatNum $color={color}>{loading ? "—" : (val ?? 0)}</StatNum>
                <StatLabel>{label}</StatLabel>
              </StatCard>
            ))}
          </StatGrid>

          {/* ── Charts row ── */}
          <ChartsRow>
            <ChartBig>
              <SessionsBarChart
                data={stats?.sessionsByWeek ?? []}
                title="Sessões por semana (últimas 8)"
              />
            </ChartBig>
            <ChartSmall>
              <AttendanceGauge rate={stats?.attendanceRate ?? 0} />
            </ChartSmall>
          </ChartsRow>

          <ChartsRow>
            <ChartMed>
              <SessionsPieChart
                data={stats?.sessionsByType ?? []}
                title="Distribuição por tipo"
              />
            </ChartMed>
            <ChartMed>
              <RecentActivity items={stats?.recentActivity ?? []} />
            </ChartMed>
          </ChartsRow>

          {/* ── Quick actions ── */}
          <SectionTitle>Ações rápidas</SectionTitle>
          <ActionGrid>
            {[
              { icon: "⚡", label: "Nova Prescrição", path: "/prescription" },
              { icon: "◫", label: "Marcar Sessão", path: "/schedule" },
              { icon: "◎", label: "Ver Clientes", path: "/clients" },
              { icon: "◈", label: "Exercícios", path: "/exercises" },
            ].map(({ icon, label, path }) => (
              <ActionCard key={label} onClick={() => navigate(path)}>
                <ActionIcon>{icon}</ActionIcon>
                <ActionLabel>{label}</ActionLabel>
              </ActionCard>
            ))}
          </ActionGrid>
        </>
      )}

      {!isAdmin && <ClientDashboard />}
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 40px 32px;
  max-width: 1100px;
`;
const Greeting = styled.div`
  margin-bottom: 32px;
`;
const Title = styled.h1`
  font-family: "Syne", sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;
const Subtitle = styled.p`
  font-family: "DM Mono", monospace;
  font-size: 11px;
  color: #666677;
  margin-top: 6px;
  text-transform: capitalize;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
const StatCard = styled.div<{ $color: string }>`
  background: #111118;
  border: 1px solid #1e1e28;
  border-top: 2px solid ${({ $color }) => $color};
  border-radius: 10px;
  padding: 18px 20px;
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover {
    border-color: ${({ $color }) => $color};
  }
`;
const StatNum = styled.div<{ $color: string }>`
  font-family: "Syne", sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;
const StatLabel = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 1px;
  margin-top: 4px;
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  margin-bottom: 14px;
  align-items: start;
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;
const ChartBig = styled.div`
  min-width: 0;
`;
const ChartSmall = styled.div`
  width: 190px;
  @media (max-width: 800px) {
    width: 100%;
  }
`;
const ChartMed = styled.div`
  flex: 1;
  min-width: 0;
`;

const SectionTitle = styled.h2`
  font-family: "Syne", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e8e8f0;
  margin: 20px 0 14px;
`;
const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
const ActionCard = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: rgba(200, 245, 66, 0.3);
    background: rgba(200, 245, 66, 0.04);
  }
`;
const ActionIcon = styled.div`
  font-size: 22px;
  margin-bottom: 8px;
  color: #c8f542;
`;
const ActionLabel = styled.div`
  font-family: "DM Mono", monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 1px;
`;
