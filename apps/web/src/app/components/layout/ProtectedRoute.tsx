import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface Props {
  allowedRoles?: ('ADMIN' | 'CLIENT')[];
}

export const ProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
  const { user, accessToken } = useSelector((s: RootState) => s.auth);

  if (!accessToken || !user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
