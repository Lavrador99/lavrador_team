import styled from 'styled-components';

export const Container = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const Card = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 12px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
`;

export const Logo = styled.div`
  width: 48px;
  height: 48px;
  background: #c8f542;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 16px;
  color: #0a0a0f;
  margin-bottom: 20px;
`;

export const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #e8e8f0;
  margin-bottom: 4px;
`;

export const Subtitle = styled.p`
  font-size: 13px;
  color: #666677;
  margin-bottom: 32px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 12px;
  color: #666677;
  font-family: 'DM Mono', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const Input = styled.input`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 12px 14px;
  color: #e8e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #c8f542;
  }

  &::placeholder {
    color: #444455;
  }
`;

export const Button = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 6px;
  padding: 14px;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #d4ff55;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ErrorMsg = styled.p`
  font-size: 13px;
  color: #ff6b6b;
  padding: 10px 14px;
  background: rgba(255, 59, 59, 0.08);
  border: 1px solid rgba(255, 59, 59, 0.2);
  border-radius: 6px;
`;
