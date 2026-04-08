import React from 'react';
import styled, { keyframes, css } from 'styled-components';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MuscleMapProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  compact?: boolean;
}

type MuscleStatus = 'primary' | 'secondary' | 'inactive';

// ─── Tooltip labels (PT) ──────────────────────────────────────────────────────

const REGION_LABEL: Record<string, string> = {
  peit_upper:              'Peitoral Clavicular',
  peit_lower:              'Peitoral Esternal',
  shoulder_l:              'Deltóide Anterior (E)',
  shoulder_r:              'Deltóide Anterior (D)',
  shoulder_back_l:         'Deltóide Posterior (E)',
  shoulder_back_r:         'Deltóide Posterior (D)',
  bicep_l:                 'Bíceps (E)',
  bicep_r:                 'Bíceps (D)',
  tricep_l:                'Tríceps (E)',
  tricep_r:                'Tríceps (D)',
  forearm_l:               'Antebraço (E)',
  forearm_r:               'Antebraço (D)',
  forearm_back_l:          'Antebraço Post. (E)',
  forearm_back_r:          'Antebraço Post. (D)',
  abs:                     'Reto Abdominal',
  oblique_l:               'Oblíquos (E)',
  oblique_r:               'Oblíquos (D)',
  hip_l:                   'Iliopsoas (E)',
  hip_r:                   'Iliopsoas (D)',
  reto_femoral_l:          'Reto Femoral (E)',
  reto_femoral_r:          'Reto Femoral (D)',
  vasto_lateral_l:         'Vasto Lateral (E)',
  vasto_lateral_r:         'Vasto Lateral (D)',
  vasto_medial_l:          'Vasto Medial (E)',
  vasto_medial_r:          'Vasto Medial (D)',
  calf_front_l:            'Tibial Anterior (E)',
  calf_front_r:            'Tibial Anterior (D)',
  lat_l:                   'Grande Dorsal (E)',
  lat_r:                   'Grande Dorsal (D)',
  trap_upper:              'Trapézio Superior',
  trap_mid:                'Trapézio Médio',
  trap_lower:              'Trapézio Inferior',
  rhomboid:                'Rombóide',
  infraspinatus_l:         'Infraespinhoso (E)',
  infraspinatus_r:         'Infraespinhoso (D)',
  teres_major_l:           'Redondo Maior (E)',
  teres_major_r:           'Redondo Maior (D)',
  erector_l:               'Eretores Espinhais (E)',
  erector_r:               'Eretores Espinhais (D)',
  glute_med_l:             'Glúteo Médio (E)',
  glute_med_r:             'Glúteo Médio (D)',
  glute_l:                 'Glúteo Máximo (E)',
  glute_r:                 'Glúteo Máximo (D)',
  biceps_femoral_l:        'Bíceps Femoral (E)',
  biceps_femoral_r:        'Bíceps Femoral (D)',
  semitendinoso_l:         'Semitendinoso (E)',
  semitendinoso_r:         'Semitendinoso (D)',
  gastrocnemios_medial_l:  'Gastrocnémio Medial (E)',
  gastrocnemios_medial_r:  'Gastrocnémio Medial (D)',
  gastrocnemios_lateral_l: 'Gastrocnémio Lateral (E)',
  gastrocnemios_lateral_r: 'Gastrocnémio Lateral (D)',
  soleo_l:                 'Soleo (E)',
  soleo_r:                 'Soleo (D)',
};

// ─── Muscle string → SVG region IDs ──────────────────────────────────────────

const MUSCLE_TO_REGIONS: Record<string, string[]> = {
  // Chest
  peitoral:              ['peit_upper', 'peit_lower'],
  peitoral_superior:     ['peit_upper'],
  peitoral_inferior:     ['peit_lower'],
  peitoral_clavicular:   ['peit_upper'],
  peitoral_esternal:     ['peit_lower'],
  // Shoulders
  deltoides:             ['shoulder_l', 'shoulder_r', 'shoulder_back_l', 'shoulder_back_r'],
  deltoides_anterior:    ['shoulder_l', 'shoulder_r'],
  deltoides_lateral:     ['shoulder_l', 'shoulder_r', 'shoulder_back_l', 'shoulder_back_r'],
  deltoides_posterior:   ['shoulder_back_l', 'shoulder_back_r'],
  manguito_rotador:      ['shoulder_back_l', 'shoulder_back_r', 'infraspinatus_l', 'infraspinatus_r'],
  // Arms
  biceps:                ['bicep_l', 'bicep_r'],
  braquial:              ['bicep_l', 'bicep_r'],
  braquioradial:         ['forearm_l', 'forearm_r', 'forearm_back_l', 'forearm_back_r'],
  antebraco:             ['forearm_l', 'forearm_r', 'forearm_back_l', 'forearm_back_r'],
  triceps:               ['tricep_l', 'tricep_r'],
  triceps_longo:         ['tricep_l', 'tricep_r'],
  // Core
  reto_abdominal:        ['abs'],
  obliquos:              ['oblique_l', 'oblique_r'],
  obliquos_internos:     ['oblique_l', 'oblique_r'],
  core:                  ['abs', 'oblique_l', 'oblique_r', 'erector_l', 'erector_r'],
  transverso_abdominal:  ['abs', 'oblique_l', 'oblique_r'],
  // Hip flexors
  iliopsoas:             ['hip_l', 'hip_r'],
  psoas:                 ['hip_l', 'hip_r'],
  // Quads (sub-muscles)
  quadriceps:            ['reto_femoral_l', 'reto_femoral_r', 'vasto_lateral_l', 'vasto_lateral_r', 'vasto_medial_l', 'vasto_medial_r'],
  reto_femoral:          ['reto_femoral_l', 'reto_femoral_r'],
  vasto_lateral:         ['vasto_lateral_l', 'vasto_lateral_r'],
  vasto_medial:          ['vasto_medial_l', 'vasto_medial_r'],
  vasto_intermedio:      ['reto_femoral_l', 'reto_femoral_r'],
  adutores:              ['vasto_medial_l', 'vasto_medial_r'],
  // Tibial
  tibial_anterior:       ['calf_front_l', 'calf_front_r'],
  tibias:                ['calf_front_l', 'calf_front_r'],
  // Hamstrings (sub-muscles)
  isquiotibiais:         ['biceps_femoral_l', 'biceps_femoral_r', 'semitendinoso_l', 'semitendinoso_r'],
  biceps_femoral:        ['biceps_femoral_l', 'biceps_femoral_r'],
  semitendinoso:         ['semitendinoso_l', 'semitendinoso_r'],
  semimembranoso:        ['semitendinoso_l', 'semitendinoso_r'],
  // Glutes
  gluteos:               ['glute_l', 'glute_r', 'glute_med_l', 'glute_med_r'],
  gluteos_medios:        ['glute_med_l', 'glute_med_r'],
  abdutores:             ['glute_med_l', 'glute_med_r'],
  // Calves (sub-muscles)
  gastrocnemios:         ['gastrocnemios_medial_l', 'gastrocnemios_medial_r', 'gastrocnemios_lateral_l', 'gastrocnemios_lateral_r'],
  gastrocnemios_medial:  ['gastrocnemios_medial_l', 'gastrocnemios_medial_r'],
  gastrocnemios_lateral: ['gastrocnemios_lateral_l', 'gastrocnemios_lateral_r'],
  soleo:                 ['soleo_l', 'soleo_r'],
  // Back
  dorsal:                ['lat_l', 'lat_r'],
  trapezio:              ['trap_upper', 'trap_mid', 'trap_lower'],
  trapezio_superior:     ['trap_upper'],
  trapezio_medio:        ['trap_mid'],
  trapezio_inferior:     ['trap_lower'],
  romboides:             ['rhomboid'],
  infraespinhoso:        ['infraspinatus_l', 'infraspinatus_r'],
  redondo_maior:         ['teres_major_l', 'teres_major_r'],
  eretores_espinhais:    ['erector_l', 'erector_r'],
  quadrado_lombar:       ['erector_l', 'erector_r'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(id: string, primary: string[], secondary: string[]): MuscleStatus {
  const p = primary.flatMap((m) => MUSCLE_TO_REGIONS[m] ?? []);
  const s = secondary.flatMap((m) => MUSCLE_TO_REGIONS[m] ?? []);
  if (p.includes(id)) return 'primary';
  if (s.includes(id)) return 'secondary';
  return 'inactive';
}

const PRIMARY   = '#c8f542';
const SECONDARY = '#42a5f5';
const INACTIVE  = '#1a1a22';

const toFill    = (st: MuscleStatus) => st === 'primary' ? PRIMARY : st === 'secondary' ? SECONDARY : INACTIVE;
const toOpacity = (st: MuscleStatus) => st === 'inactive' ? 0.55 : 1;

// ─── Region helpers ───────────────────────────────────────────────────────────

interface ER { cx: number; cy: number; rx: number; ry: number; id: string; st: MuscleStatus; }
const ERegion: React.FC<ER> = ({ cx, cy, rx, ry, id, st }) => (
  <SE cx={cx} cy={cy} rx={rx} ry={ry} fill={toFill(st)} opacity={toOpacity(st)} $st={st}>
    <title>{REGION_LABEL[id] ?? id}</title>
  </SE>
);

interface PR { d: string; id: string; st: MuscleStatus; }
const PRegion: React.FC<PR> = ({ d, id, st }) => (
  <SP d={d} fill={toFill(st)} opacity={toOpacity(st)} $st={st}>
    <title>{REGION_LABEL[id] ?? id}</title>
  </SP>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const MuscleMap: React.FC<MuscleMapProps> = ({ primaryMuscles, secondaryMuscles, compact = false }) => {
  const s = (id: string) => getStatus(id, primaryMuscles, secondaryMuscles);
  const B = { fill: '#13131a', stroke: '#252535', strokeWidth: 0.8 } as const;

  return (
    <Wrap $compact={compact}>
      <ViewLabels>
        <ViewLabel>FRENTE</ViewLabel>
        <ViewLabel>COSTAS</ViewLabel>
      </ViewLabels>

      <SVGWrap>
        <svg viewBox="0 0 340 290" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>

          {/* ══════════════ FRONT VIEW ══════════════════════════════════════ */}

          {/* Body silhouette — front */}
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

          {/* ── Chest (split clavicular / sternal) */}
          <ERegion cx={80}  cy={56}  rx={20} ry={7}   id="peit_upper"  st={s('peit_upper')} />
          <ERegion cx={80}  cy={70}  rx={20} ry={10}  id="peit_lower"  st={s('peit_lower')} />

          {/* ── Shoulders (front) */}
          <ERegion cx={52}  cy={46}  rx={12} ry={8}   id="shoulder_l"  st={s('shoulder_l')} />
          <ERegion cx={108} cy={46}  rx={12} ry={8}   id="shoulder_r"  st={s('shoulder_r')} />

          {/* ── Biceps */}
          <ERegion cx={44}  cy={76}  rx={7}  ry={20}  id="bicep_l"     st={s('bicep_l')} />
          <ERegion cx={116} cy={76}  rx={7}  ry={20}  id="bicep_r"     st={s('bicep_r')} />

          {/* ── Forearms (front) */}
          <ERegion cx={41}  cy={122} rx={5}  ry={18}  id="forearm_l"   st={s('forearm_l')} />
          <ERegion cx={119} cy={122} rx={5}  ry={18}  id="forearm_r"   st={s('forearm_r')} />

          {/* ── Core */}
          <ERegion cx={80}  cy={100} rx={10} ry={18}  id="abs"         st={s('abs')} />
          <ERegion cx={65}  cy={100} rx={8}  ry={16}  id="oblique_l"   st={s('oblique_l')} />
          <ERegion cx={95}  cy={100} rx={8}  ry={16}  id="oblique_r"   st={s('oblique_r')} />

          {/* ── Hip flexors */}
          <ERegion cx={65}  cy={132} rx={9}  ry={8}   id="hip_l"       st={s('hip_l')} />
          <ERegion cx={95}  cy={132} rx={9}  ry={8}   id="hip_r"       st={s('hip_r')} />

          {/* ── Quads — 3 sub-muscles each leg */}
          {/* Left leg: lateral=outer (x<63), medial=inner (x>63 toward midline=80) */}
          <ERegion cx={56}  cy={169} rx={5}  ry={22}  id="vasto_lateral_l"  st={s('vasto_lateral_l')} />
          <ERegion cx={63}  cy={160} rx={4}  ry={25}  id="reto_femoral_l"   st={s('reto_femoral_l')} />
          <ERegion cx={70}  cy={191} rx={5}  ry={11}  id="vasto_medial_l"   st={s('vasto_medial_l')} />
          {/* Right leg */}
          <ERegion cx={104} cy={169} rx={5}  ry={22}  id="vasto_lateral_r"  st={s('vasto_lateral_r')} />
          <ERegion cx={97}  cy={160} rx={4}  ry={25}  id="reto_femoral_r"   st={s('reto_femoral_r')} />
          <ERegion cx={90}  cy={191} rx={5}  ry={11}  id="vasto_medial_r"   st={s('vasto_medial_r')} />

          {/* ── Tibial anterior (front shin) */}
          <ERegion cx={62}  cy={235} rx={5}  ry={20}  id="calf_front_l" st={s('calf_front_l')} />
          <ERegion cx={98}  cy={235} rx={5}  ry={20}  id="calf_front_r" st={s('calf_front_r')} />

          {/* ══ DIVIDER */}
          <line x1="170" y1="8" x2="170" y2="282" stroke="#1e1e28" strokeWidth="1" />

          {/* ══════════════ BACK VIEW (offset +180) ════════════════════════ */}

          {/* Body silhouette — back */}
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

          {/* ── Trapezius (3 sections) */}
          <ERegion cx={260} cy={40}  rx={15} ry={6}   id="trap_upper"   st={s('trap_upper')} />
          <ERegion cx={260} cy={52}  rx={23} ry={7}   id="trap_mid"     st={s('trap_mid')} />
          <ERegion cx={260} cy={67}  rx={18} ry={8}   id="trap_lower"   st={s('trap_lower')} />

          {/* ── Lats */}
          <PRegion d="M244,56 L260,62 L255,118 L222,112 Z" id="lat_l" st={s('lat_l')} />
          <PRegion d="M276,56 L260,62 L265,118 L298,112 Z" id="lat_r" st={s('lat_r')} />

          {/* ── Rhomboids */}
          <ERegion cx={260} cy={74}  rx={13} ry={11}  id="rhomboid"     st={s('rhomboid')} />

          {/* ── Infraspinatus + teres major (below shoulder, above lat) */}
          <ERegion cx={238} cy={62}  rx={9}  ry={8}   id="infraspinatus_l" st={s('infraspinatus_l')} />
          <ERegion cx={282} cy={62}  rx={9}  ry={8}   id="infraspinatus_r" st={s('infraspinatus_r')} />
          <ERegion cx={235} cy={77}  rx={6}  ry={6}   id="teres_major_l"   st={s('teres_major_l')} />
          <ERegion cx={285} cy={77}  rx={6}  ry={6}   id="teres_major_r"   st={s('teres_major_r')} />

          {/* ── Posterior delts */}
          <ERegion cx={232} cy={46}  rx={12} ry={8}   id="shoulder_back_l" st={s('shoulder_back_l')} />
          <ERegion cx={288} cy={46}  rx={12} ry={8}   id="shoulder_back_r" st={s('shoulder_back_r')} />

          {/* ── Triceps */}
          <ERegion cx={224} cy={76}  rx={7}  ry={20}  id="tricep_l"     st={s('tricep_l')} />
          <ERegion cx={296} cy={76}  rx={7}  ry={20}  id="tricep_r"     st={s('tricep_r')} />

          {/* ── Forearms (back) */}
          <ERegion cx={221} cy={122} rx={5}  ry={18}  id="forearm_back_l" st={s('forearm_back_l')} />
          <ERegion cx={299} cy={122} rx={5}  ry={18}  id="forearm_back_r" st={s('forearm_back_r')} />

          {/* ── Erectors */}
          <ERegion cx={254} cy={95}  rx={6}  ry={20}  id="erector_l"    st={s('erector_l')} />
          <ERegion cx={266} cy={95}  rx={6}  ry={20}  id="erector_r"    st={s('erector_r')} />

          {/* ── Gluteus medius (above gluteus maximus) */}
          <ERegion cx={247} cy={133} rx={13} ry={8}   id="glute_med_l"  st={s('glute_med_l')} />
          <ERegion cx={273} cy={133} rx={13} ry={8}   id="glute_med_r"  st={s('glute_med_r')} />

          {/* ── Gluteus maximus */}
          <ERegion cx={246} cy={151} rx={14} ry={15}  id="glute_l"      st={s('glute_l')} />
          <ERegion cx={274} cy={151} rx={14} ry={15}  id="glute_r"      st={s('glute_r')} />

          {/* ── Hamstrings — 2 sub-muscles each */}
          {/* Left: lateral=outer (x>243), medial=inner (x<243 toward midline=260) */}
          <ERegion cx={251} cy={181} rx={6}  ry={25}  id="biceps_femoral_l"  st={s('biceps_femoral_l')} />
          <ERegion cx={237} cy={183} rx={5}  ry={22}  id="semitendinoso_l"   st={s('semitendinoso_l')} />
          {/* Right */}
          <ERegion cx={269} cy={181} rx={6}  ry={25}  id="biceps_femoral_r"  st={s('biceps_femoral_r')} />
          <ERegion cx={283} cy={183} rx={5}  ry={22}  id="semitendinoso_r"   st={s('semitendinoso_r')} />

          {/* ── Gastrocnemius — medial + lateral heads */}
          <ERegion cx={237} cy={233} rx={5}  ry={17}  id="gastrocnemios_medial_l"  st={s('gastrocnemios_medial_l')} />
          <ERegion cx={247} cy={231} rx={4}  ry={14}  id="gastrocnemios_lateral_l" st={s('gastrocnemios_lateral_l')} />
          <ERegion cx={273} cy={233} rx={5}  ry={17}  id="gastrocnemios_medial_r"  st={s('gastrocnemios_medial_r')} />
          <ERegion cx={283} cy={231} rx={4}  ry={14}  id="gastrocnemios_lateral_r" st={s('gastrocnemios_lateral_r')} />

          {/* ── Soleo */}
          <ERegion cx={242} cy={256} rx={7}  ry={10}  id="soleo_l"      st={s('soleo_l')} />
          <ERegion cx={278} cy={256} rx={7}  ry={10}  id="soleo_r"      st={s('soleo_r')} />

        </svg>
      </SVGWrap>

      {/* ── Legend ── */}
      <Legend>
        <LegendItem>
          <LegendDot $color={PRIMARY} $glow />
          <LegendTxt>Principal</LegendTxt>
        </LegendItem>
        <LegendItem>
          <LegendDot $color={SECONDARY} />
          <LegendTxt>Secundário</LegendTxt>
        </LegendItem>
        <LegendItem>
          <LegendDot $color={INACTIVE} $border />
          <LegendTxt>Inativo</LegendTxt>
        </LegendItem>
      </Legend>

      {/* ── Muscle name pills ── */}
      {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
        <MuscleList>
          {primaryMuscles.map((m) => (
            <MusclePill key={m} $color={PRIMARY}>
              {MUSCLE_PT_NAME[m] ?? m.replace(/_/g, ' ')}
            </MusclePill>
          ))}
          {secondaryMuscles.map((m) => (
            <MusclePill key={m} $color={SECONDARY}>
              {MUSCLE_PT_NAME[m] ?? m.replace(/_/g, ' ')}
            </MusclePill>
          ))}
        </MuscleList>
      )}
    </Wrap>
  );
};

// ─── Portuguese names for muscle string keys ──────────────────────────────────

export const MUSCLE_PT_NAME: Record<string, string> = {
  peitoral:              'Peitoral',
  peitoral_superior:     'Peitoral Superior',
  peitoral_inferior:     'Peitoral Inferior',
  peitoral_clavicular:   'Peitoral Clavicular',
  peitoral_esternal:     'Peitoral Esternal',
  deltoides:             'Deltóide',
  deltoides_anterior:    'Deltóide Anterior',
  deltoides_lateral:     'Deltóide Lateral',
  deltoides_posterior:   'Deltóide Posterior',
  manguito_rotador:      'Manguito Rotador',
  biceps:                'Bíceps',
  braquial:              'Braquial',
  braquioradial:         'Braquiorradial',
  antebraco:             'Antebraço',
  triceps:               'Tríceps',
  triceps_longo:         'Tríceps Longo',
  reto_abdominal:        'Reto Abdominal',
  obliquos:              'Oblíquos',
  obliquos_internos:     'Oblíquos Internos',
  core:                  'Core',
  transverso_abdominal:  'Transverso Abdominal',
  iliopsoas:             'Iliopsoas',
  psoas:                 'Psoas',
  quadriceps:            'Quadricípete',
  reto_femoral:          'Reto Femoral',
  vasto_lateral:         'Vasto Lateral',
  vasto_medial:          'Vasto Medial',
  vasto_intermedio:      'Vasto Interméd.',
  adutores:              'Adutores',
  tibial_anterior:       'Tibial Anterior',
  tibias:                'Tibial Anterior',
  isquiotibiais:         'Isquiotibiais',
  biceps_femoral:        'Bíceps Femoral',
  semitendinoso:         'Semitendinoso',
  semimembranoso:        'Semimembranoso',
  gluteos:               'Glúteos',
  gluteos_medios:        'Glúteo Médio',
  abdutores:             'Abdutores',
  gastrocnemios:         'Gastrocnémio',
  gastrocnemios_medial:  'Gastrocnémio Medial',
  gastrocnemios_lateral: 'Gastrocnémio Lateral',
  soleo:                 'Soleo',
  dorsal:                'Grande Dorsal',
  trapezio:              'Trapézio',
  trapezio_superior:     'Trapézio Superior',
  trapezio_medio:        'Trapézio Médio',
  trapezio_inferior:     'Trapézio Inferior',
  romboides:             'Rombóide',
  infraespinhoso:        'Infraespinhoso',
  redondo_maior:         'Redondo Maior',
  eretores_espinhais:    'Eretores Espinhais',
  quadrado_lombar:       'Quadrado Lombar',
};

// ─── Animations ───────────────────────────────────────────────────────────────

const pulsePrimary = keyframes`
  0%, 100% { opacity: 1;   filter: drop-shadow(0 0 6px rgba(200,245,66,0.7)); }
  50%       { opacity: 0.7; filter: drop-shadow(0 0 2px rgba(200,245,66,0.3)); }
`;

const pulseSecondary = keyframes`
  0%, 100% { opacity: 1;   }
  50%       { opacity: 0.7; }
`;

// ─── Styled SVG elements ──────────────────────────────────────────────────────

const SE = styled.ellipse<{ $st: MuscleStatus }>`
  transition: fill 0.3s, opacity 0.3s;
  ${({ $st }) => $st === 'primary' && css`animation: ${pulsePrimary} 2s ease-in-out infinite;`}
  ${({ $st }) => $st === 'secondary' && css`animation: ${pulseSecondary} 2.5s ease-in-out infinite;`}
`;

const SP = styled.path<{ $st: MuscleStatus }>`
  transition: fill 0.3s, opacity 0.3s;
  ${({ $st }) => $st === 'primary' && css`animation: ${pulsePrimary} 2s ease-in-out infinite;`}
  ${({ $st }) => $st === 'secondary' && css`animation: ${pulseSecondary} 2.5s ease-in-out infinite;`}
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const Wrap = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? '6px' : '10px')};
  width: 100%;
`;

const ViewLabels = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
`;

const ViewLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #333342;
  letter-spacing: 2.5px;
  text-transform: uppercase;
`;

const SVGWrap = styled.div`
  width: 100%;
  aspect-ratio: 340 / 290;
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const LegendDot = styled.div<{ $color: string; $glow?: boolean; $border?: boolean }>`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: ${({ $border }) => ($border ? '1px solid #2a2a35' : 'none')};
  ${({ $glow, $color }) =>
    $glow &&
    css`box-shadow: 0 0 6px ${$color}88;`}
`;

const LegendTxt = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #444455;
  letter-spacing: 0.5px;
`;

const MuscleList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 0 2px;
`;

const MusclePill = styled.span<{ $color: string }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  padding: 3px 8px;
  border-radius: 3px;
  background: ${({ $color }) => $color}18;
  border: 1px solid ${({ $color }) => $color}33;
  color: ${({ $color }) => $color};
  letter-spacing: 0.3px;
`;
