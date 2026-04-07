import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import styled, { keyframes } from 'styled-components';

interface Props {
  allowedRoles?: ('ADMIN' | 'CLIENT')[];
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user, accessToken, initializing } = useSelector((s: RootState) => s.auth);

  if (initializing) return <SplashScreen />;

  if (!accessToken || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const SplashScreen = () => (
  <Splash>
    <SplashMark>LT</SplashMark>
  </Splash>
);

const Splash = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SplashMark = styled.div`
  width: 48px;
  height: 48px;
  background: #c8f542;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 16px;
  color: #0a0a0f;
  animation: ${pulse} 1.2s ease-in-out infinite;
`;
