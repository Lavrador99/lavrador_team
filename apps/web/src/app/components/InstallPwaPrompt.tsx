import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaPrompt: React.FC = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-prompt-dismissed') === '1',
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', '1');
  };

  return (
    <Banner>
      <BannerIcon>LT</BannerIcon>
      <BannerText>
        <BannerTitle>Instalar app</BannerTitle>
        <BannerSub>Acesso rápido no telemóvel, sem browser</BannerSub>
      </BannerText>
      <BannerActions>
        <InstallBtn onClick={handleInstall}>Instalar</InstallBtn>
        <DismissBtn onClick={handleDismiss}>✕</DismissBtn>
      </BannerActions>
    </Banner>
  );
};

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

const Banner = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #111118;
  border: 1px solid rgba(200, 245, 66, 0.25);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  animation: ${slideUp} 0.3s ease;
  max-width: calc(100vw - 40px);
  width: 380px;
`;

const BannerIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #c8f542;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 14px;
  color: #0a0a0f;
  flex-shrink: 0;
`;

const BannerText = styled.div`
  flex: 1;
  min-width: 0;
`;

const BannerTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e8e8f0;
`;

const BannerSub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  margin-top: 2px;
  letter-spacing: 0.5px;
`;

const BannerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const InstallBtn = styled.button`
  background: #c8f542;
  color: #0a0a0f;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #d4ff55; }
`;

const DismissBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #444455;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover { border-color: #666677; color: #e8e8f0; }
`;
