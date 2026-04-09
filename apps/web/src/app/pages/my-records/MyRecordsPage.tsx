import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PersonalRecordDto, RECORD_TYPE_LABEL, RECORD_TYPE_UNIT } from '@libs/types';
import { personalRecordsApi } from '../../utils/api/personal-records.api';

export const MyRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PersonalRecordDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    personalRecordsApi.getMyBest()
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  // Group records by exercise name
  const grouped = records.reduce<Record<string, PersonalRecordDto[]>>((acc, r) => {
    if (!acc[r.exerciseName]) acc[r.exerciseName] = [];
    acc[r.exerciseName].push(r);
    return acc;
  }, {});

  const exerciseNames = Object.keys(grouped).sort();

  return (
    <Page>
      <Header>
        <div>
          <Title>Records Pessoais</Title>
          <Sub>// {records.length} record{records.length !== 1 ? 's' : ''}</Sub>
        </div>
      </Header>

      {loading ? (
        <Loading>A carregar records...</Loading>
      ) : records.length === 0 ? (
        <Empty>
          Ainda não tens records registados.<br />
          Completa treinos para auto-detectar os teus records!
        </Empty>
      ) : (
        <List>
          {exerciseNames.map((name) => {
            const recs = grouped[name];
            const exerciseId = encodeURIComponent(name);
            return (
              <ExerciseCard key={name}>
                <CardTop>
                  <ExName>{name}</ExName>
                  <HistoryBtn
                    onClick={() => navigate(`/exercise-history/${exerciseId}`)}
                    title="Ver evolução"
                  >
                    📈 Evolução
                  </HistoryBtn>
                </CardTop>
                <RecordRow>
                  {recs.map((r) => (
                    <RecordPill key={r.id}>
                      <PillType>{RECORD_TYPE_LABEL[r.type]}</PillType>
                      <PillValue>
                        {r.value} <PillUnit>{RECORD_TYPE_UNIT[r.type]}</PillUnit>
                      </PillValue>
                      <PillDate>
                        {new Date(r.recordedAt).toLocaleDateString('pt-PT', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </PillDate>
                      {r.notes && <PillNote title={r.notes}>ⓘ</PillNote>}
                    </RecordPill>
                  ))}
                </RecordRow>
              </ExerciseCard>
            );
          })}
        </List>
      )}
    </Page>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 32px 24px;
  max-width: 720px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 28px;
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;

const Sub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444455;
  margin-top: 4px;
`;

const Loading = styled.div`
  font-family: 'DM Mono', monospace;
  color: #444455;
  padding: 60px;
  text-align: center;
`;

const Empty = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #444455;
  text-align: center;
  padding: 60px 20px;
  line-height: 1.8;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ExerciseCard = styled.div`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 14px;
  padding: 18px 20px;
  transition: border-color 0.15s;
  &:hover { border-color: #2a2a35; }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const ExName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #e8e8f0;
`;

const HistoryBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;

const RecordRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const RecordPill = styled.div`
  background: #0d0d13;
  border: 1px solid #2a2a35;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 130px;
`;

const PillType = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #444455;
  text-transform: uppercase;
`;

const PillValue = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #c8f542;
`;

const PillUnit = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #888899;
  font-weight: 400;
`;

const PillDate = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333342;
`;

const PillNote = styled.span`
  font-size: 10px;
  color: #42a5f5;
  cursor: help;
`;
