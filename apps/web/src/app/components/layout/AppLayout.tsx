import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import styled from 'styled-components';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  clientOnly?: boolean;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',    label: 'Dashboard',      icon: '⬡' },
  { path: '/clients',      label: 'Clientes',        icon: '◎', adminOnly: true },
  { path: '/schedule',     label: 'Agenda',          icon: '◫' },
  { path: '/prescription', label: 'Prescrição',      icon: '⚡', adminOnly: true },
  { path: '/exercises',    label: 'Exercícios',      icon: '◈' },
  { path: '/my-plan',      label: 'O meu plano',     icon: '▦', clientOnly: true },
  { path: '/messages',     label: 'Mensagens',       icon: '◷' },
  { path: '/habits',       label: 'Hábitos',         icon: '◉', clientOnly: true },
  { path: '/invoices',     label: 'Facturação',      icon: '◈', adminOnly: true },
  { path: '/templates',    label: 'Templates',       icon: '◰', adminOnly: true },
];

export const AppLayout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false;
    if (item.clientOnly && user?.role !== 'CLIENT') return false;
    return true;
  });

  return (
    <Layout>
      <Sidebar $collapsed={collapsed}>
        <SidebarTop>
          <LogoArea>
            <LogoMark>LT</LogoMark>
            {!collapsed && <LogoText>{'Lavrador\nTeam'}</LogoText>}
          </LogoArea>
          <CollapseBtn onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </CollapseBtn>
        </SidebarTop>

        <Nav>
          {visibleItems.map((item) => (
            <StyledNavLink key={item.path} to={item.path} $collapsed={collapsed}>
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <NavIcon $active={isActive}>{item.icon}</NavIcon>
                  {!collapsed && <NavLabel $active={isActive}>{item.label}</NavLabel>}
                  {isActive && !collapsed && <ActiveDot />}
                </>
              )}
            </StyledNavLink>
          ))}

          {/* Novo Utilizador — link separado */}
          {user?.role === 'ADMIN' && (
            <NewUserLink to="/clients/new" $collapsed={collapsed}>
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <NavIcon $active={isActive}>＋</NavIcon>
                  {!collapsed && <NavLabel $active={isActive}>Novo Cliente</NavLabel>}
                </>
              )}
            </NewUserLink>
          )}
        </Nav>

        <SidebarBottom>
          <UserInfo $collapsed={collapsed}>
            <UserAvatar>{user?.email?.[0]?.toUpperCase() ?? 'U'}</UserAvatar>
            {!collapsed && (
              <UserDetails>
                <UserEmail>{user?.email}</UserEmail>
                <UserRole>{user?.role}</UserRole>
              </UserDetails>
            )}
          </UserInfo>
          <LogoutBtn onClick={handleLogout} $collapsed={collapsed}>
            {collapsed ? '⏻' : 'Sair'}
          </LogoutBtn>
        </SidebarBottom>
      </Sidebar>

      <Main><Outlet /></Main>
    </Layout>
  );
};

const Layout = styled.div`display:flex;min-height:100vh;background:#0a0a0f;`;
const Sidebar = styled.aside<{ $collapsed: boolean }>`width:${p=>p.$collapsed?'64px':'220px'};min-height:100vh;background:#0d0d13;border-right:1px solid #1e1e28;display:flex;flex-direction:column;transition:width .2s ease;flex-shrink:0;position:sticky;top:0;height:100vh;`;
const SidebarTop = styled.div`display:flex;align-items:center;justify-content:space-between;padding:20px 16px 16px;border-bottom:1px solid #1e1e28;`;
const LogoArea = styled.div`display:flex;align-items:center;gap:10px;overflow:hidden;`;
const LogoMark = styled.div`width:32px;height:32px;background:#c8f542;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:12px;color:#0a0a0f;flex-shrink:0;`;
const LogoText = styled.div`font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#e8e8f0;line-height:1.2;white-space:pre;`;
const CollapseBtn = styled.button`background:none;border:none;color:#444455;cursor:pointer;font-size:14px;padding:4px;flex-shrink:0;transition:color .15s;&:hover{color:#c8f542;}`;
const Nav = styled.nav`flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px;`;

const linkStyles = `
  display:flex;align-items:center;gap:10px;
  border-radius:8px;text-decoration:none;position:relative;transition:background .15s;
  &.active,&:hover{background:rgba(200,245,66,0.06);}
`;

const StyledNavLink = styled(NavLink)<{ $collapsed: boolean }>`
  ${linkStyles}
  padding:${p=>p.$collapsed?'10px 0':'10px 12px'};
  justify-content:${p=>p.$collapsed?'center':'flex-start'};
`;

const NewUserLink = styled(NavLink)<{ $collapsed: boolean }>`
  ${linkStyles}
  padding:${p=>p.$collapsed?'10px 0':'10px 12px'};
  justify-content:${p=>p.$collapsed?'center':'flex-start'};
  margin-top:8px;
  border:1px dashed #2a2a35;
  &:hover{border-color:rgba(200,245,66,0.3);}
  &.active{border-color:rgba(200,245,66,0.3);}
`;

const NavIcon = styled.span<{ $active: boolean }>`font-size:16px;color:${p=>p.$active?'#c8f542':'#444455'};flex-shrink:0;transition:color .15s;`;
const NavLabel = styled.span<{ $active: boolean }>`font-family:'DM Mono',monospace;font-size:12px;color:${p=>p.$active?'#c8f542':'#666677'};letter-spacing:1px;flex:1;transition:color .15s;`;
const ActiveDot = styled.div`width:4px;height:4px;border-radius:50%;background:#c8f542;flex-shrink:0;`;
const SidebarBottom = styled.div`padding:12px 8px;border-top:1px solid #1e1e28;display:flex;flex-direction:column;gap:8px;`;
const UserInfo = styled.div<{ $collapsed: boolean }>`display:flex;align-items:center;gap:10px;padding:8px;overflow:hidden;${p=>p.$collapsed?'justify-content:center;':''}`;
const UserAvatar = styled.div`width:28px;height:28px;border-radius:6px;background:rgba(200,245,66,0.1);border:1px solid rgba(200,245,66,0.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:12px;font-weight:800;color:#c8f542;flex-shrink:0;`;
const UserDetails = styled.div`overflow:hidden;flex:1;`;
const UserEmail = styled.div`font-family:'DM Mono',monospace;font-size:10px;color:#666677;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const UserRole = styled.div`font-family:'DM Mono',monospace;font-size:9px;color:#c8f542;letter-spacing:1px;`;
const LogoutBtn = styled.button<{ $collapsed: boolean }>`background:transparent;border:1px solid #1e1e28;color:#444455;padding:8px;border-radius:6px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;transition:all .15s;width:100%;text-align:center;&:hover{border-color:#ff3b3b;color:#ff6b6b;background:rgba(255,59,59,0.06);}`;
const Main = styled.main`flex:1;overflow-y:auto;color:#e8e8f0;`;
