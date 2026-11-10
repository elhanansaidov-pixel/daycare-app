import { useId, type ReactNode } from 'react';
import type { Child } from '../lib/types';
import { EYE_COLORS, HAIR_COLORS, SKINS, lookOf, type Animal, type HairStyle, type Look, type Print, type Toy } from '../lib/look';

export type AvatarState = 'idle' | 'sleep' | 'wave';
type AvatarChild = Pick<Child, 'color' | 'emoji' | 'gender' | 'look' | 'id'> & { name?: string };

/** Cartoon kid wearing an animal hood. Blinks, sleeps (Zzz) and waves. */
export default function Avatar({
  child,
  size = 48,
  ring = true,
  state = 'idle',
  look: lookOverride,
}: {
  child: AvatarChild;
  size?: number;
  ring?: boolean;
  state?: AvatarState;
  look?: Look;
}) {
  const look = lookOverride ?? lookOf(child);
  const uid = useId().replace(/:/g, '');
  const small = size < 40;
  const border = Math.max(2, Math.round(size / 26));
  // stable pseudo-random blink timing per child
  const seed = [...(child.id ?? 'x')].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const blinkDur = 4 + (seed % 30) / 10;
  const blinkDelay = (seed % 17) / 10;
  return (
    <div
      className={`shrink-0 rounded-full select-none ${small ? 'av-static' : ''}`}
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 ${border}px rgb(var(--card)), 0 0 0 ${border * 2}px ${child.color}` : undefined }}
      aria-hidden
    >
      <svg viewBox="0 0 120 120" width={size} height={size} style={{ ['--blink-dur' as string]: `${blinkDur}s`, ['--blink-delay' as string]: `${blinkDelay}s` }}>
        <defs>
          <clipPath id={`c${uid}`}>
            <circle cx="60" cy="60" r="60" />
          </clipPath>
          <clipPath id={`f${uid}`}>
            <ellipse cx="60" cy="68" rx={look.face === 'chubby' ? 31 : 29} ry="27.5" />
          </clipPath>
          <radialGradient id={`g${uid}`} cx="50%" cy="35%" r="70%">
            <stop offset="0" stopColor="#fff" stopOpacity=".9" />
            <stop offset="1" stopColor={child.color} stopOpacity=".55" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#c${uid})`}>
          <rect width="120" height="120" fill="rgb(var(--card))" />
          <rect width="120" height="120" fill={`url(#g${uid})`} />
          <Kid look={look} state={state} small={small} uid={uid} />
        </g>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------- drawing

const HOOD: Record<Animal, { main: string; dark: string; inner: string }> = {
  lion: { main: '#F6C356', dark: '#E39B35', inner: '#FBE2A6' },
  bunny: { main: '#F4EFF2', dark: '#DCD2D8', inner: '#F8C3D2' },
  butterfly: { main: '#BBA2EE', dark: '#9479D8', inner: '#F4B8E0' },
  bear: { main: '#A97953', dark: '#8A5E3D', inner: '#E2B790' },
  chick: { main: '#FFD84E', dark: '#F2B92A', inner: '#FFE99A' },
  whale: { main: '#5EAEEA', dark: '#3E8ACB', inner: '#BFE2FA' },
  fox: { main: '#F2893D', dark: '#D5692A', inner: '#FFF3E8' },
  panda: { main: '#F8F8F6', dark: '#2E2B2B', inner: '#5A5555' },
  frog: { main: '#7FCB6C', dark: '#5BAA4B', inner: '#CDEFC0' },
  unicorn: { main: '#F7EEF9', dark: '#E2CFEA', inner: '#F9C9DF' },
  koala: { main: '#AEB4BD', dark: '#8C939E', inner: '#EED9DE' },
  ladybug: { main: '#E8493F', dark: '#C7342B', inner: '#2E2B2B' },
};

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `#${((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

function Kid({ look, state, small, uid }: { look: Look; state: AvatarState; small: boolean; uid: string }) {
  const h = HOOD[look.animal];
  const skin = SKINS[look.skin] ?? SKINS[1];
  const skinDark = shade(skin, -38);
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[1];
  const eye = EYE_COLORS[look.eyeColor] ?? EYE_COLORS[0];
  const has = (x: Look['extras'][number]) => look.extras.includes(x);
  const sleep = state === 'sleep';
  const wave = state === 'wave';
  const chubby = look.face === 'chubby';
  const mouth = look.mouth ?? 'smile';

  return (
    <g className={sleep ? 'av-doze' : ''}>
      {/* back decorations (mane, wings) */}
      <Back animal={look.animal} h={h} />
      {/* body / onesie */}
      <ellipse cx="60" cy="124" rx="40" ry="24" fill={h.main} />
      <ellipse cx="60" cy="124" rx="40" ry="24" fill="none" stroke={h.dark} strokeWidth="2" opacity=".5" />
      {!small && look.print && look.print !== 'none' && <PrintPatch print={look.print} />}
      {/* hood */}
      <circle cx="60" cy="63" r="41" fill={h.main} />
      <Ears animal={look.animal} h={h} />
      <HoodDecor animal={look.animal} h={h} />
      {/* face */}
      <ellipse cx="60" cy="68" rx={chubby ? 31 : 29} ry="27.5" fill={skin} />

      {/* hair fringe, clipped to face */}
      <g clipPath={`url(#f${uid})`}>
        <Hair style={look.hair} color={hair} />
        <ellipse cx="60" cy="96" rx="22" ry="6" fill={skinDark} opacity=".12" />
      </g>
      {/* hood rim */}
      <ellipse cx="60" cy="68" rx={chubby ? 33 : 31} ry="29.5" fill="none" stroke={h.dark} strokeWidth="4" opacity=".55" />
      {look.hair === 'wild' && <WildCurls color={hair} small={small} />}
      {look.hair === 'flip' && <SideFlips color={hair} />}

      {/* cheeks */}
      <ellipse cx={chubby ? 40.5 : 41.5} cy="77.5" rx={chubby ? 7 : 5.5} ry={chubby ? 4.4 : 3.4} fill="#FF7B86" opacity={has('blush') ? 0.55 : 0.28} />
      <ellipse cx={chubby ? 79.5 : 78.5} cy="77.5" rx={chubby ? 7 : 5.5} ry={chubby ? 4.4 : 3.4} fill="#FF7B86" opacity={has('blush') ? 0.55 : 0.28} />
      {has('mole') && !small && <circle cx="73.5" cy="86" r="1.1" fill={shade(skin, -90)} opacity=".8" />}
      {has('freckles') && !small && (
        <g fill={skinDark} opacity=".55">
          <circle cx="40" cy="73" r=".9" />
          <circle cx="43.5" cy="74.5" r=".9" />
          <circle cx="41" cy="76.5" r=".9" />
          <circle cx="80" cy="73" r=".9" />
          <circle cx="76.5" cy="74.5" r=".9" />
          <circle cx="79" cy="76.5" r=".9" />
        </g>
      )}

      {/* eyes */}
      {sleep ? (
        <g fill="none" stroke="#3A2A24" strokeWidth="2.4" strokeLinecap="round">
          <path d="M43 68.5q5 4.5 10 0" />
          <path d="M67 68.5q5 4.5 10 0" />
        </g>
      ) : (
        <>
          <Eye cx={48} cy={67} color={eye} sparkle={look.eyes === 'sparkle'} happy={wave} lashes={has('lashes') && !small} side={-1} />
          <Eye cx={72} cy={67} color={eye} sparkle={look.eyes === 'sparkle'} happy={wave} lashes={has('lashes') && !small} side={1} />
        </>
      )}
      {/* brows */}
      {!small && (
        <g fill="none" stroke={look.hair === 'none' ? skinDark : hair} strokeWidth="1.8" strokeLinecap="round" opacity=".7">
          <path d={sleep ? 'M43.5 60.5q4.5-1.5 9 0' : 'M43.5 59q4.5-2.5 9 0'} />
          <path d={sleep ? 'M67.5 60.5q4.5-1.5 9 0' : 'M67.5 59q4.5-2.5 9 0'} />
        </g>
      )}
      {/* nose */}
      <ellipse cx="60" cy="74" rx="1.9" ry="1.3" fill={skinDark} opacity=".6" />

      {/* mouth */}
      {has('pacifier') && !wave ? (
        <g>
          <ellipse cx="60" cy="83" rx="7" ry="4.6" fill="#8ED3F0" stroke="#5DB4DA" strokeWidth="1.2" />
          <circle cx="60" cy="83" r="2.4" fill="#5DB4DA" />
        </g>
      ) : sleep ? (
        <ellipse cx="60" cy="82" rx="2.2" ry="2.6" fill="#B5545A" opacity=".85" />
      ) : wave ? (
        <g>
          <path d="M51.5 79.5q8.5 1.5 17 0q-1.5 9.5-8.5 9.5t-8.5-9.5z" fill="#9C3C45" />
          <path d="M55 85.6q5-3 10 0q-2 2.4-5 2.4t-5-2.4z" fill="#FF8F98" />
        </g>
      ) : mouth === 'cheeky' ? (
        <g>
          <path d="M53 80.5q7 3.8 14.5-1q-.6 4.6-7.3 5.2q-5.8.2-7.2-4.2z" fill="#E68A8E" />
          <path d="M53 80.5q7 3.8 14.5-1" fill="none" stroke="#9C3C45" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      ) : mouth === 'open' ? (
        <g>
          <path d="M53.5 79.5q6.5 2 13 0q-1 6.5-6.5 6.5t-6.5-6.5z" fill="#A9434C" />
          <path d="M56 83.8q4-1.8 8 0q-1.5 2.2-4 2.2t-4-2.2z" fill="#FF97A0" />
        </g>
      ) : mouth === 'grin' ? (
        <g>
          <path d="M51.5 79q8.5 2 17 0q-1.2 8.5-8.5 8.5t-8.5-8.5z" fill="#9C3C45" />
          <path d="M55.5 85.2q4.5-2 9 0q-1.8 2.3-4.5 2.3t-4.5-2.3z" fill="#FF8F98" />
          <rect x="56.6" y="84.3" width="2.8" height="2.6" rx=".9" fill="#fff" />
          <rect x="60.6" y="84.3" width="2.8" height="2.6" rx=".9" fill="#fff" />
        </g>
      ) : (
        <path d="M53.5 80q6.5 5.5 13 0" fill="none" stroke="#9C3C45" strokeWidth="2.3" strokeLinecap="round" />
      )}

      {/* accessories */}
      {has('glasses') && (
        <g fill="none" stroke="#3A2A24" strokeWidth="1.8">
          <circle cx="48" cy="67" r="7.2" fill="#fff" fillOpacity=".12" />
          <circle cx="72" cy="67" r="7.2" fill="#fff" fillOpacity=".12" />
          <path d="M55.2 66.5q4.8-2 9.6 0" />
        </g>
      )}
      {has('bow') && <Bow x={83} y={41} />}
      {!small && look.toy && look.toy !== 'none' && <ToyProp toy={look.toy} skin={skin} skinDark={skinDark} />}

      {/* waving hand */}
      {wave && !small && (
        <g transform="translate(94 84)">
          <g className="av-hand">
            <rect x="-7" y="6" width="14" height="16" rx="6" fill={h.main} stroke={h.dark} strokeWidth="1.2" />
            <path d="M-8.5 2a8.5 8.5 0 0 1 17 0v3a6 6 0 0 1-6 6h-5a6 6 0 0 1-6-6z" fill={skin} stroke={skinDark} strokeWidth="1.3" />
            <path d="M-5.5-3.5v-6a2.4 2.4 0 0 1 4.8 0v5M-.7-5v-7a2.4 2.4 0 0 1 4.8 0v7M4.1-4v-4.5a2.4 2.4 0 0 1 4.8 0v6" fill={skin} stroke={skinDark} strokeWidth="1.3" />
          </g>
        </g>
      )}

      {/* Zzz */}
      {sleep && !small && (
        <g fill="#5F6BD6" stroke="#fff" strokeWidth="2.2" paintOrder="stroke" fontWeight="800" fontFamily="Rubik, sans-serif">
          <text x="84" y="44" fontSize="15" className="av-z">z</text>
          <text x="92" y="31" fontSize="19" className="av-z" style={{ animationDelay: '.8s' }}>z</text>
          <text x="99" y="16" fontSize="23" className="av-z" style={{ animationDelay: '1.6s' }}>Z</text>
        </g>
      )}
    </g>
  );
}

function Eye({ cx, cy, color, sparkle, happy, lashes, side }: { cx: number; cy: number; color: string; sparkle: boolean; happy: boolean; lashes?: boolean; side: number }) {
  if (happy)
    return <path d={`M${cx - 5} ${cy + 2}q5-6.5 10 0`} fill="none" stroke="#3A2A24" strokeWidth="2.6" strokeLinecap="round" />;
  const r = sparkle ? 5.4 : 4.6;
  return (
    <g className="av-eye">
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.12} fill={color} />
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.12} fill="none" stroke="#1E1714" strokeOpacity=".35" strokeWidth="1" />
      <circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.36} fill="#fff" />
      {sparkle && <circle cx={cx + r * 0.38} cy={cy + r * 0.38} r={r * 0.17} fill="#fff" opacity=".9" />}
      {lashes && (
        <path
          d={`M${cx + side * r * 0.62} ${cy - r * 0.92}l${side * 1.3} -1.7M${cx + side * r * 0.92} ${cy - r * 0.55}l${side * 1.7} -1.2`}
          stroke="#2C221E"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function Bow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(18)`}>
      <path d="M0 0l-10-6.5q-2.5 6.5 0 13z" fill="#FF6F9A" />
      <path d="M0 0l10-6.5q2.5 6.5 0 13z" fill="#FF6F9A" />
      <circle r="3.2" fill="#E8457A" />
    </g>
  );
}

function Hair({ style, color }: { style: HairStyle; color: string }) {
  const hi = shade(color, 40);
  const paths: Record<HairStyle, ReactNode> = {
    none: null,
    baby: (
      <g fill="none" stroke={color} strokeLinecap="round">
        <path d="M33 58Q36 41 60 39Q84 41 87 58Q82 47 60 45Q38 47 33 58Z" fill={color} stroke="none" opacity=".92" />
        <path d="M50 46q4-5 9-4M58 44q5-4 10-1M44 49q3-4 7-4" strokeWidth="1.4" opacity=".8" />
        <path d="M60 41q1.5-5 5-6.5M56 41q-1-4.5 1.5-7" strokeWidth="1.3" />
      </g>
    ),
    flip: (
      <>
        <path d="M29 64Q27 37 60 36Q91 37 92 58Q84 46 66 47Q50 48 41 57Q35 62 29 64Z" fill={color} />
        <path d="M54 42q12-3 24 3" stroke={shade(color, 45)} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".55" />
      </>
    ),
    wild: (
      <g fill={color}>
        <path d="M30 58Q31 38 60 37Q89 38 90 58Z" />
        {[34, 43, 52, 61, 70, 79, 87].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 51 : 55} r="6.6" />
        ))}
        <circle cx="47" cy="59" r="4.6" />
        <circle cx="68" cy="58.5" r="4" />
      </g>
    ),
    short: (
      <>
        <path d="M28 64Q30 38 60 37Q90 38 92 64Q86 53 76 55Q70 49 61 54Q52 48 45 55Q35 52 28 64Z" fill={color} />
        <path d="M50 44q8-3 16 0" stroke={hi} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
      </>
    ),
    bangs: (
      <>
        <path d="M29 60Q31 37 60 37Q89 37 91 60L91 57Q85 55 80 57Q74 54 68 57Q62 54 56 57Q50 54 44 57Q38 54 29 60Z" fill={color} />
        <path d="M46 44q10-4 22 0" stroke={hi} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
      </>
    ),
    swoop: (
      <>
        <path d="M28 66Q27 37 62 37Q92 39 92 60Q80 49 64 50Q48 52 36 62Z" fill={color} />
        <path d="M56 43q12-2 22 4" stroke={hi} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
      </>
    ),
    curly: (
      <g fill={color}>
        <path d="M30 56Q32 38 60 37Q88 38 90 56Z" />
        {[32, 40, 48, 56, 64, 72, 80, 88].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 53 : 56} r="6.2" />
        ))}
        <g fill={hi} opacity=".35">
          <circle cx="46" cy="47" r="2" />
          <circle cx="62" cy="45" r="2" />
          <circle cx="76" cy="48" r="2" />
        </g>
      </g>
    ),
    tuft: (
      <>
        <path d="M44 46Q52 40 60 41Q70 39 76 46Q68 44 62 47Q54 44 44 46Z" fill={color} />
        <path d="M58 46q-1-9 8-9q-6 3-3 9z" fill={color} />
      </>
    ),
  };
  return <>{paths[style]}</>;
}

function Back({ animal, h }: { animal: Animal; h: (typeof HOOD)[Animal] }) {
  if (animal === 'lion')
    return (
      <g fill={h.dark}>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <circle key={i} cx={60 + Math.cos(a) * 41} cy={63 + Math.sin(a) * 41} r="11" />;
        })}
      </g>
    );
  if (animal === 'butterfly')
    return (
      <g>
        <ellipse cx="17" cy="48" rx="15" ry="20" fill="#F7A8D8" transform="rotate(-20 17 48)" />
        <ellipse cx="103" cy="48" rx="15" ry="20" fill="#F7A8D8" transform="rotate(20 103 48)" />
        <circle cx="16" cy="46" r="5" fill="#fff" opacity=".7" />
        <circle cx="104" cy="46" r="5" fill="#fff" opacity=".7" />
      </g>
    );
  return null;
}

function Ears({ animal, h }: { animal: Animal; h: (typeof HOOD)[Animal] }) {
  switch (animal) {
    case 'lion':
    case 'bear':
    case 'panda':
      return (
        <g>
          {[33, 87].map((x) => (
            <g key={x}>
              <circle cx={x} cy="29" r="11" fill={animal === 'panda' ? h.dark : h.main} />
              <circle cx={x} cy="29" r="6" fill={h.inner} />
            </g>
          ))}
        </g>
      );
    case 'koala':
      return (
        <g>
          {[22, 98].map((x) => (
            <g key={x}>
              <circle cx={x} cy="42" r="16" fill={h.main} />
              <circle cx={x} cy="42" r="9.5" fill={h.inner} />
            </g>
          ))}
        </g>
      );
    case 'bunny':
      return (
        <g>
          <g transform="rotate(-14 44 24)">
            <ellipse cx="44" cy="17" rx="9" ry="22" fill={h.main} />
            <ellipse cx="44" cy="19" rx="4.5" ry="16" fill={h.inner} />
          </g>
          <g transform="rotate(14 76 24)">
            <ellipse cx="76" cy="17" rx="9" ry="22" fill={h.main} />
            <ellipse cx="76" cy="19" rx="4.5" ry="16" fill={h.inner} />
          </g>
        </g>
      );
    case 'fox':
      return (
        <g>
          <path d="M26 40L30 8L52 26Z" fill={h.main} />
          <path d="M31 34L33 16L45 27Z" fill={h.inner} />
          <path d="M94 40L90 8L68 26Z" fill={h.main} />
          <path d="M89 34L87 16L75 27Z" fill={h.inner} />
        </g>
      );
    case 'frog':
      return (
        <g>
          {[40, 80].map((x) => (
            <g key={x}>
              <circle cx={x} cy="25" r="11" fill={h.main} />
              <circle cx={x} cy="25" r="7" fill="#fff" />
              <circle cx={x} cy="26" r="3.6" fill="#2B2B2B" />
              <circle cx={x - 1.2} cy="24.6" r="1.2" fill="#fff" />
            </g>
          ))}
        </g>
      );
    case 'unicorn':
      return (
        <g>
          <circle cx="36" cy="29" r="8" fill={h.main} />
          <circle cx="84" cy="29" r="8" fill={h.main} />
          <path d="M53 26L60 1L67 26Z" fill="#F6C94E" />
          <path d="M55 20L65 17M56.5 13L63.5 11" stroke="#E2A935" strokeWidth="1.6" />
        </g>
      );
    case 'butterfly':
    case 'ladybug':
      return (
        <g stroke={animal === 'ladybug' ? '#2E2B2B' : '#6B4FB8'} strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d="M48 26Q42 14 36 10" />
          <path d="M72 26Q78 14 84 10" />
          <circle cx="36" cy="10" r="3.2" fill={animal === 'ladybug' ? '#2E2B2B' : '#F7A8D8'} stroke="none" />
          <circle cx="84" cy="10" r="3.2" fill={animal === 'ladybug' ? '#2E2B2B' : '#F7A8D8'} stroke="none" />
        </g>
      );
    case 'chick':
      return (
        <g fill={h.dark}>
          <path d="M60 24q-4-12 2-16q-1 8 3 14z" />
          <path d="M60 24q-9-8-6-14q2 7 8 12z" />
          <path d="M61 24q8-9 12-6q-6 1-10 7z" />
        </g>
      );
    case 'whale':
      return (
        <g fill="none" stroke="#8FD0FA" strokeWidth="3" strokeLinecap="round">
          <path d="M60 23V10" />
          <path d="M60 12q-5-7-11-6" />
          <path d="M60 12q5-7 11-6" />
          <circle cx="47" cy="6" r="2.4" fill="#8FD0FA" stroke="none" />
          <circle cx="73" cy="6" r="2.4" fill="#8FD0FA" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

function HoodDecor({ animal, h }: { animal: Animal; h: (typeof HOOD)[Animal] }) {
  if (animal === 'ladybug')
    return (
      <g fill={h.inner}>
        <circle cx="30" cy="48" r="4.5" />
        <circle cx="90" cy="48" r="4.5" />
        <circle cx="26" cy="72" r="4" />
        <circle cx="94" cy="72" r="4" />
        <circle cx="60" cy="27" r="4" />
      </g>
    );
  if (animal === 'whale')
    return (
      <g fill="#fff" opacity=".35">
        <circle cx="34" cy="40" r="3" />
        <circle cx="86" cy="40" r="3" />
      </g>
    );
  if (animal === 'unicorn')
    return (
      <g>
        <path d="M88 34q10 10 8 28q-4-8-10-10q4-8 2-18z" fill="#B9A4F2" />
        <path d="M86 38q8 12 4 26q-3-6-8-8q4-8 4-18z" fill="#F9B6D2" />
      </g>
    );
  return null;
}

/** Big curls that spill out of the hood (drawn above the hood rim). */
function WildCurls({ color, small }: { color: string; small: boolean }) {
  const hi = shade(color, 45);
  const curls: [number, number, number][] = [
    [32, 46, 7.5], [40, 37, 8], [50, 32, 8], [61, 30, 8.5], [72, 32, 8], [81, 38, 7.5], [88, 47, 7],
    [29, 58, 6.5], [91, 58, 6.5],
  ];
  return (
    <g>
      {curls.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={color} />
      ))}
      {!small && (
        <g fill="none" stroke={hi} strokeWidth="1.6" strokeLinecap="round" opacity=".7">
          {curls.map(([x, y, r], i) => (
            <path key={i} d={`M${x - r * 0.45} ${y + r * 0.1}a${r * 0.42} ${r * 0.42} 0 1 1 ${r * 0.5} ${r * 0.35}`} />
          ))}
        </g>
      )}
      {/* springy side ringlets */}
      <path d="M27 66q-5 4 0 8q5 4 0 8" fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M93 66q5 4 0 8q-5 4 0 8" fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" />
    </g>
  );
}

/** Little print on the onesie chest. */
function PrintPatch({ print }: { print: Print }) {
  switch (print) {
    case 'helicopter':
      return (
        <g transform="translate(60 109)" fill="none" stroke="#3B4A5A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-9-6.5h18M0-6.5v2.5" />
          <path d="M-6 1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v0a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3z" fill="#fff" />
          <path d="M7 0h6.5l1.5-2.5M-5 4.5v2M3 4.5v2M-7.5 6.5h12" />
        </g>
      );
    case 'stripes':
      return (
        <g opacity=".85">
          {[103, 109, 115].map((y) => (
            <rect key={y} x="30" y={y} width="60" height="2.6" rx="1.3" fill="#B9A58C" />
          ))}
        </g>
      );
    case 'skate':
      return (
        <g transform="translate(60 109)">
          <rect x="-10" y="-3" width="20" height="5" rx="2.5" fill="#F09B7A" stroke="#3B4A5A" strokeWidth="1.1" />
          <circle cx="-6" cy="4" r="2" fill="#fff" stroke="#3B4A5A" strokeWidth="1.1" />
          <circle cx="6" cy="4" r="2" fill="#fff" stroke="#3B4A5A" strokeWidth="1.1" />
        </g>
      );
    case 'stars':
      return (
        <g fill="#FFD25E" stroke="#E8A93A" strokeWidth=".8">
          {[[48, 108], [60, 113], [72, 107]].map(([x, y]) => (
            <path key={x} transform={`translate(${x} ${y})`} d="M0-4l1.2 2.6 2.8.3-2.1 1.9.6 2.8L0 2.2l-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z" />
          ))}
        </g>
      );
    case 'hearts':
      return (
        <g fill="#FF7FA0">
          {[[49, 109], [60, 113], [71, 108]].map(([x, y]) => (
            <path key={x} transform={`translate(${x} ${y})`} d="M0 3s-4-2.5-4-5a2.2 2.2 0 0 1 4-1.2A2.2 2.2 0 0 1 4-2c0 2.5-4 5-4 5z" />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Side-swept hair whose ends flip out past the hood. */
function SideFlips({ color }: { color: string }) {
  return (
    <g fill={color}>
      <path d="M31 62q-7 8-5 17q3-6 8-7q-4-4-3-10z" />
      <path d="M89 62q7 8 5 17q-3-6-8-7q4-4 3-10z" />
    </g>
  );
}

/** A favourite toy held at the bottom of the frame. */
function ToyProp({ toy, skin, skinDark }: { toy: Toy; skin: string; skinDark: string }) {
  const hand = <ellipse cx="0" cy="6" rx="6.5" ry="5.5" fill={skin} stroke={skinDark} strokeWidth="1.1" />;
  switch (toy) {
    case 'teether':
      return (
        <g transform="translate(35 95) rotate(-12)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 7} cy={Math.sin((a * Math.PI) / 180) * 7} r="4.4" fill="none" stroke="#E2463E" strokeWidth="2.6" />
          ))}
          <circle r="5" fill="#3CC3C9" />
          <circle r="3.2" fill="#9B6BDB" />
          <g transform="translate(4 6)">{hand}</g>
        </g>
      );
    case 'book':
      return (
        <g transform="translate(35 96) rotate(-8)">
          <rect x="-11" y="-8" width="11" height="15" rx="2" fill="#7FD0F0" stroke="#2E2B2B" strokeWidth="1" />
          <rect x="0" y="-8" width="11" height="15" rx="2" fill="#F7A23A" stroke="#2E2B2B" strokeWidth="1" />
          <circle cx="5.5" cy="-.5" r="3.6" fill="#8CD06A" stroke="#4E9A3A" strokeWidth=".8" />
          <path d="M-9-2q2-3 5-2t4 2" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          <g transform="translate(-3 6)">{hand}</g>
        </g>
      );
    case 'rattle':
      return (
        <g transform="translate(34 97) rotate(-25)">
          <rect x="-1.6" y="-2" width="3.2" height="12" rx="1.6" fill="#FFC94D" />
          <circle cy="-6" r="6.5" fill="#FF8FB1" stroke="#E2648B" strokeWidth="1" />
          <circle cx="-2" cy="-8" r="1.6" fill="#fff" opacity=".8" />
          <g transform="translate(0 5)">{hand}</g>
        </g>
      );
    case 'teddy':
      return (
        <g transform="translate(34 96)">
          <circle cx="-5.5" cy="-8" r="3" fill="#B98559" />
          <circle cx="5.5" cy="-8" r="3" fill="#B98559" />
          <circle r="8" cy="-2" fill="#C99566" />
          <circle cx="-2.6" cy="-3" r="1.1" fill="#2E2B2B" />
          <circle cx="2.6" cy="-3" r="1.1" fill="#2E2B2B" />
          <ellipse cy="1" rx="3" ry="2.2" fill="#EBCBA6" />
          <g transform="translate(2 8)">{hand}</g>
        </g>
      );
    default:
      return null;
  }
}
