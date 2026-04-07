import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

interface Props {
  seconds: number;
  onDone: () => void;
}

export const RestTimer: React.FC<Props> = ({ seconds, onDone }) => {
  const [remaining, setRemaining] = useState(seconds);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { doneRef.current(); return; }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Wrap>
      <Ring $pct={pct}>
        <RingInner>
          <TimeText>{mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}</TimeText>
          <TimeSub>descanso</TimeSub>
        </RingInner>
      </Ring>
      <SkipBtn onClick={onDone}>Saltar</SkipBtn>
    </Wrap>
  );
};

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.6}`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
`;

const Ring = styled.div<{ $pct: number }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    #c8f542 ${({ $pct }) => $pct}%,
    #1e1e28 ${({ $pct }) => $pct}%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 1s ease-in-out infinite;
`;

const RingInner = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #0d0d13;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const TimeText = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #c8f542;
`;

const TimeSub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #666677;
  letter-spacing: 2px;
`;

const SkipBtn = styled.button`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  background: transparent;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 6px 18px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;
