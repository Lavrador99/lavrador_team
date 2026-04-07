import React from 'react';
import styled, { keyframes, css } from 'styled-components';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MuscleMapProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  compact?: boolean;
}

type MuscleStatus = 'primary' | 'secondary' | 'inactive';

// ─── Muscle → SVG region mapping ──────────────────────────────────────────────

const MUSCLE_TO_REGIONS: Record<string, string[]> = {
  peitoral:             ['chest'],
  peitoral_superior:    ['chest'],
  peitoral_inferior:    ['chest'],
  deltoides:            ['shoulder_l', 'shoulder_r', 'shoulder_back_l', 'shoulder_back_r'],
  deltoides_anterior:   ['shoulder_l', 'shoulder_r'],
  deltoides_lateral:    ['shoulder_l', 'shoulder_r', 'shoulder_back_l', 'shoulder_back_r'],
  deltoides_posterior:  ['shoulder_back_l', 'shoulder_back_r'],
  manguito_rotador:     ['shoulder_back_l', 'shoulder_back_r'],
  biceps:               ['bicep_l', 'bicep_r'],
  braquial:             ['bicep_l', 'bicep_r'],
  braquioradial:        ['forearm_l', 'forearm_r', 'forearm_back_l', 'forearm_back_r'],
  antebraco:            ['forearm_l', 'forearm_r', 'forearm_back_l', 'forearm_back_r'],
  triceps:              ['tricep_l', 'tricep_r'],
  triceps_longo:        ['tricep_l', 'tricep_r'],
  reto_abdominal:       ['abs'],
  obliquos:             ['oblique_l', 'oblique_r'],
  core:                 ['abs', 'oblique_l', 'oblique_r', 'erector_l', 'erector_r'],
  transverso_abdominal: ['abs', 'oblique_l', 'oblique_r'],
  iliopsoas:            ['hip_l', 'hip_r'],
  quadriceps:           ['quad_l', 'quad_r'],
  adutores:             ['quad_l', 'quad_r'],
  isquiotibiais:        ['hamstring_l', 'hamstring_r'],
  gluteos:              ['glute_l', 'glute_r'],
  gluteos_medios:       ['glute_l', 'glute_r'],
  abdutores:            ['glute_l', 'glute_r'],
  gastrocnemios:        ['calf_l', 'calf_r', 'calf_front_l', 'calf_front_r'],
  soleo:                ['calf_l', 'calf_r'],
  dorsal:               ['lat_l', 'lat_r'],
  trapezio:             ['trap'],
  romboides:            ['rhomboid'],
  eretores_espinhais:   ['erector_l', 'erector_r'],
  quadrado_lombar:      ['erector_l', 'erector_r'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(
  id: string,
  primary: string[],
  secondary: string[],
): MuscleStatus {
  const p = primary.flatMap((m) => MUSCLE_TO_REGIONS[m] ?? []);
  const s = secondary.flatMap((m) => MUSCLE_TO_REGIONS[m] ?? []);
  if (p.includes(id)) return 'primary';
  if (s.includes(id)) return 'secondary';
  return 'inactive';
}

const FILL: Record<MuscleStatus, string> = {
  primary:  '#c8f542',
  secondary:'rgba(200,245,66,0.35)',
  inactive: '#1e1e28',
};
const OPACITY: Record<MuscleStatus, number> = {
  primary: 1, secondary: 1, inactive: 0.55,
};

// ─── Region components ────────────────────────────────────────────────────────

interface EllipseRegionProps {
  cx: number; cy: number; rx: number; ry: number;
  status: MuscleStatus;
}
const EllipseRegion: React.FC<EllipseRegionProps> = ({ cx, cy, rx, ry, status }) => (
  <StyledEllipse
    cx={cx} cy={cy} rx={rx} ry={ry}
    $status={status}
    fill={FILL[status]}
    opacity={OPACITY[status]}
  />
);

interface PathRegionProps { d: string; status: MuscleStatus; }
const PathRegion: React.FC<PathRegionProps> = ({ d, status }) => (
  <StyledPath
    d={d}
    $status={status}
    fill={FILL[status]}
    opacity={OPACITY[status]}
  />
);

// ─── Main component ───────────────────────────────────────────────────────────

export const MuscleMap: React.FC<MuscleMapProps> = ({
  primaryMuscles,
  secondaryMuscles,
  compact = false,
}) => {
  const s = (id: string) => getStatus(id, primaryMuscles, secondaryMuscles);

  // body outline props
  const B = { fill: '#13131a', stroke: '#252535', strokeWidth: 0.8 } as const;

  return (
    <Wrap $compact={compact}>
      <Labels>
        <LabelText>FRENTE</LabelText>
        <LabelText>COSTAS</LabelText>
      </Labels>

      <SVGWrap>
        <svg viewBox="0 0 340 290" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

          {/* ══ FRONT VIEW ══════════════════════════════════════════════ */}

          {/* Body silhouette */}
          <ellipse cx="80"  cy="18"  rx="14" ry="16" {...B} />
          <rect    x="73"   y="32"   width="14" height="10" rx="3" {...B} />
          <ellipse cx="52"  cy="46"  rx="14" ry="9"  {...B} />
          <ellipse cx="108" cy="46"  rx="14" ry="9"  {...B} />
          <path    d="M56,38 L104,38 L107,120 L53,120 Z" {...B} />
          <ellipse cx="44"  cy="76"  rx="9"  ry="28" {...B} />
          <ellipse cx="116" cy="76"  rx="9"  ry="28" {...B} />
          <ellipse cx="41"  cy="122" rx="7"  ry="22" {...B} />
          <ellipse cx="119" cy="122" rx="7"  ry="22" {...B} />
          <ellipse cx="41"  cy="147" rx="6"  ry="7"  {...B} />
          <ellipse cx="119" cy="147" rx="6"  ry="7"  {...B} />
          <path    d="M52,118 L108,118 L112,138 L48,138 Z" {...B} />
          <ellipse cx="63"  cy="173" rx="14" ry="33" {...B} />
          <ellipse cx="97"  cy="173" rx="14" ry="33" {...B} />
          <ellipse cx="62"  cy="238" rx="11" ry="27" {...B} />
          <ellipse cx="98"  cy="238" rx="11" ry="27" {...B} />
          <ellipse cx="62"  cy="268" rx="13" ry="7"  {...B} />
          <ellipse cx="98"  cy="268" rx="13" ry="7"  {...B} />

          {/* Muscle regions — front */}
          <EllipseRegion cx={80}  cy={64}  rx={22} ry={16}    status={s('chest')} />
          <EllipseRegion cx={52}  cy={46}  rx={12} ry={8}     status={s('shoulder_l')} />
          <EllipseRegion cx={108} cy={46}  rx={12} ry={8}     status={s('shoulder_r')} />
          <EllipseRegion cx={44}  cy={76}  rx={7}  ry={20}    status={s('bicep_l')} />
          <EllipseRegion cx={116} cy={76}  rx={7}  ry={20}    status={s('bicep_r')} />
          <EllipseRegion cx={41}  cy={122} rx={5}  ry={18}    status={s('forearm_l')} />
          <EllipseRegion cx={119} cy={122} rx={5}  ry={18}    status={s('forearm_r')} />
          <EllipseRegion cx={80}  cy={100} rx={10} ry={18}    status={s('abs')} />
          <EllipseRegion cx={65}  cy={100} rx={8}  ry={16}    status={s('oblique_l')} />
          <EllipseRegion cx={95}  cy={100} rx={8}  ry={16}    status={s('oblique_r')} />
          <EllipseRegion cx={65}  cy={132} rx={9}  ry={8}     status={s('hip_l')} />
          <EllipseRegion cx={95}  cy={132} rx={9}  ry={8}     status={s('hip_r')} />
          <EllipseRegion cx={63}  cy={173} rx={12} ry={30}    status={s('quad_l')} />
          <EllipseRegion cx={97}  cy={173} rx={12} ry={30}    status={s('quad_r')} />
          <EllipseRegion cx={62}  cy={238} rx={9}  ry={22}    status={s('calf_front_l')} />
          <EllipseRegion cx={98}  cy={238} rx={9}  ry={22}    status={s('calf_front_r')} />

          {/* ══ DIVIDER ══════════════════════════════════════════════════ */}
          <line x1="170" y1="8" x2="170" y2="282" stroke="#1e1e28" strokeWidth="1" />

          {/* ══ BACK VIEW (offset +180) ══════════════════════════════════ */}

          {/* Body silhouette */}
          <ellipse cx="260" cy="18"  rx="14" ry="16" {...B} />
          <rect    x="253" y="32"   width="14" height="10" rx="3" {...B} />
          <ellipse cx="232" cy="46"  rx="14" ry="9"  {...B} />
          <ellipse cx="288" cy="46"  rx="14" ry="9"  {...B} />
          <path    d="M236,38 L284,38 L287,120 L233,120 Z" {...B} />
          <ellipse cx="224" cy="76"  rx="9"  ry="28" {...B} />
          <ellipse cx="296" cy="76"  rx="9"  ry="28" {...B} />
          <ellipse cx="221" cy="122" rx="7"  ry="22" {...B} />
          <ellipse cx="299" cy="122" rx="7"  ry="22" {...B} />
          <ellipse cx="221" cy="147" rx="6"  ry="7"  {...B} />
          <ellipse cx="299" cy="147" rx="6"  ry="7"  {...B} />
          <path    d="M232,118 L288,118 L292,138 L228,138 Z" {...B} />
          <ellipse cx="243" cy="173" rx="14" ry="33" {...B} />
          <ellipse cx="277" cy="173" rx="14" ry="33" {...B} />
          <ellipse cx="242" cy="238" rx="11" ry="27" {...B} />
          <ellipse cx="278" cy="238" rx="11" ry="27" {...B} />
          <ellipse cx="242" cy="268" rx="13" ry="7"  {...B} />
          <ellipse cx="278" cy="268" rx="13" ry="7"  {...B} />

          {/* Muscle regions — back */}
          <EllipseRegion cx={260} cy={50}  rx={28} ry={10}  status={s('trap')} />
          <PathRegion    d="M244,54 L260,60 L255,118 L222,112 Z" status={s('lat_l')} />
          <PathRegion    d="M276,54 L260,60 L265,118 L298,112 Z" status={s('lat_r')} />
          <EllipseRegion cx={260} cy={72}  rx={14} ry={12}  status={s('rhomboid')} />
          <EllipseRegion cx={232} cy={46}  rx={12} ry={8}   status={s('shoulder_back_l')} />
          <EllipseRegion cx={288} cy={46}  rx={12} ry={8}   status={s('shoulder_back_r')} />
          <EllipseRegion cx={224} cy={76}  rx={7}  ry={20}  status={s('tricep_l')} />
          <EllipseRegion cx={296} cy={76}  rx={7}  ry={20}  status={s('tricep_r')} />
          <EllipseRegion cx={221} cy={122} rx={5}  ry={18}  status={s('forearm_back_l')} />
          <EllipseRegion cx={299} cy={122} rx={5}  ry={18}  status={s('forearm_back_r')} />
          <EllipseRegion cx={254} cy={95}  rx={6}  ry={20}  status={s('erector_l')} />
          <EllipseRegion cx={266} cy={95}  rx={6}  ry={20}  status={s('erector_r')} />
          <EllipseRegion cx={246} cy={148} rx={15} ry={17}  status={s('glute_l')} />
          <EllipseRegion cx={274} cy={148} rx={15} ry={17}  status={s('glute_r')} />
          <EllipseRegion cx={243} cy={182} rx={12} ry={28}  status={s('hamstring_l')} />
          <EllipseRegion cx={277} cy={182} rx={12} ry={28}  status={s('hamstring_r')} />
          <EllipseRegion cx={242} cy={238} rx={9}  ry={20}  status={s('calf_l')} />
          <EllipseRegion cx={278} cy={238} rx={9}  ry={20}  status={s('calf_r')} />
          <EllipseRegion cx={242} cy={258} rx={7}  ry={10}  status={s('soleo_l')} />
          <EllipseRegion cx={278} cy={258} rx={7}  ry={10}  status={s('soleo_r')} />
        </svg>
      </SVGWrap>

      <Legend>
        <LegendItem><LegendDot $primary /> <LegendTxt>Principal</LegendTxt></LegendItem>
        <LegendItem><LegendDot />           <LegendTxt>Secundário</LegendTxt></LegendItem>
        <LegendItem><LegendDot $inactive /> <LegendTxt>Inativo</LegendTxt></LegendItem>
      </Legend>
    </Wrap>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
`;

// ─── Styled SVG elements ──────────────────────────────────────────────────────

const StyledEllipse = styled.ellipse<{ $status: MuscleStatus }>`
  transition: fill 0.3s, opacity 0.3s;
  ${({ $status }) =>
    $status === 'primary' &&
    css`
      animation: ${pulse} 2.2s ease-in-out infinite;
      filter: drop-shadow(0 0 5px rgba(200, 245, 66, 0.55));
    `}
`;

const StyledPath = styled.path<{ $status: MuscleStatus }>`
  transition: fill 0.3s, opacity 0.3s;
  ${({ $status }) =>
    $status === 'primary' &&
    css`
      animation: ${pulse} 2.2s ease-in-out infinite;
      filter: drop-shadow(0 0 5px rgba(200, 245, 66, 0.55));
    `}
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const Wrap = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const Labels = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
`;

const LabelText = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #333342;
  letter-spacing: 2.5px;
`;

const SVGWrap = styled.div`
  width: 100%;
  aspect-ratio: 340 / 290;
`;

const Legend = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled.div<{ $primary?: boolean; $inactive?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $primary, $inactive }) =>
    $primary ? '#c8f542' : $inactive ? '#1e1e28' : 'rgba(200,245,66,0.35)'};
  border: ${({ $inactive }) => ($inactive ? '1px solid #2a2a35' : 'none')};
`;

const LegendTxt = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #333342;
  letter-spacing: 1px;
`;
