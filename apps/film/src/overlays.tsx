import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';

const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';
const DISPLAY = '"Avenir Next Condensed", "Arial Narrow", "Helvetica Neue", sans-serif';

const col = {
  cyan: '#4FC3F7',
  cyanHot: '#00E5FF',
  green: '#35E59A',
  red: '#FF4D6D',
  ink: '#D8E6F5',
  muted: '#7B93AE',
};

const fade = (frame: number, a: number, b: number, c: number, d: number) =>
  interpolate(frame, [a, b, c, d], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/* ── Test-Zeile ── */
const Row: React.FC<{ label: string; state: 'pending' | 'ok' | 'fail' | 'fixed' }> = ({ label, state }) => {
  const mark = state === 'fail' ? '✗' : state === 'pending' ? '·' : '✓';
  const color =
    state === 'fail' ? col.red : state === 'pending' ? col.muted : col.green;
  return (
    <div
      style={{
        display: 'flex',
        gap: 22,
        alignItems: 'baseline',
        margin: '20px 0',
        opacity: state === 'pending' ? 0.35 : 1,
        fontSize: 30,
      }}
    >
      <span style={{ color, width: 34, textAlign: 'center', fontWeight: 700 }}>{mark}</span>
      <span style={{ color: state === 'fail' ? col.red : col.ink }}>{label}</span>
    </div>
  );
};

/* ── Gates-Konsole ── */
export const GatesConsole: React.FC = () => {
  const frame = useCurrentFrame();
  const op = fade(frame, 150, 168, 448, 470);
  if (op <= 0) return null;

  const r1: 'pending' | 'ok' = frame >= 195 ? 'ok' : 'pending';
  const r2: 'pending' | 'ok' = frame >= 222 ? 'ok' : 'pending';
  const r3: 'pending' | 'ok' = frame >= 249 ? 'ok' : 'pending';
  const failed = frame >= 276 && frame < 415;
  const fixed = frame >= 415;
  const r4: 'pending' | 'fail' | 'fixed' = fixed ? 'fixed' : failed ? 'fail' : 'pending';

  const border = failed ? col.red : fixed ? col.green : 'rgba(79,195,247,.55)';
  const status = failed ? 'GESTOPPT' : fixed ? '312 / 312 ✓' : 'läuft…';
  const statusColor = failed ? col.red : fixed ? col.green : col.muted;
  const foot = failed
    ? 'ROT STOPPT ALLES.'
    : fixed
      ? 'ALLES GRÜN. NEUE LEHRE → ARCHIV.'
      : '…';

  const fixOp = fade(frame, 320, 335, 392, 408);
  const shake = failed && frame < 288 ? Math.sin(frame * 2.6) * 3 : 0;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: op }}>
      {failed && (
        <AbsoluteFill style={{ background: 'rgba(255,77,109,.07)' }} />
      )}
      <div
        style={{
          transform: `translateX(${shake}px)`,
          width: 760,
          borderRadius: 14,
          border: `2px solid ${border}`,
          background: 'rgba(18,41,63,.72)',
          boxShadow: `0 0 60px ${failed ? 'rgba(255,77,109,.28)' : fixed ? 'rgba(53,229,154,.25)' : 'rgba(79,195,247,.15)'}`,
          padding: '34px 44px',
          fontFamily: MONO,
          backdropFilter: 'blur(6px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            letterSpacing: '.14em',
            fontSize: 26,
            color: col.cyan,
            marginBottom: 14,
          }}
        >
          <span>PRÜFUNG · 312 TESTS</span>
          <span style={{ color: statusColor }}>{status}</span>
        </div>
        <Row label="Anmeldung funktioniert" state={r1} />
        <Row label="Daten werden gespeichert" state={r2} />
        <Row label="Nur Befugte sehen Kundendaten" state={r3} />
        <Row label={fixed ? 'Bezahlung funktioniert' : 'Bezahlung: FEHLER'} state={r4} />
        <div style={{ marginTop: 22, fontSize: 21, letterSpacing: '.16em', color: statusColor }}>{foot}</div>
      </div>

      {/* Fix-Agent Fenster */}
      <div
        style={{
          position: 'absolute',
          right: 150,
          top: 250,
          width: 360,
          opacity: fixOp,
          transform: `scale(${0.7 + fixOp * 0.3})`,
          borderRadius: 12,
          border: '1.5px solid rgba(79,195,247,.6)',
          background: 'rgba(18,41,63,.8)',
          padding: '22px 26px',
          fontFamily: MONO,
          boxShadow: '0 0 40px rgba(79,195,247,.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, letterSpacing: '.12em', color: col.cyan }}>
          <span>AGENT · LOGIK</span>
          <span style={{ color: frame >= 378 ? col.green : col.muted }}>
            {frame >= 378 ? '✓ Repariert' : 'repariert…'}
          </span>
        </div>
        {[0.65, 0.4, 0.8].map((w, i) => (
          <div
            key={i}
            style={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(79,195,247,.4)',
              marginTop: 14,
              width: `${interpolate(frame, [335 + i * 14, 360 + i * 14], [12, w * 100], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}%`,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ── LIVE-Label unter dem Puls ── */
export const LiveLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const op = fade(frame, 596, 615, 636, 652);
  if (op <= 0) return null;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: op }}>
      <div
        style={{
          marginTop: 430,
          fontFamily: MONO,
          fontSize: 34,
          letterSpacing: '.5em',
          color: col.green,
          textShadow: '0 0 24px rgba(53,229,154,.8)',
        }}
      >
        LIVE
      </div>
    </AbsoluteFill>
  );
};

/* ── Schluss: Claim + Titelkarte ── */
export const EndCards: React.FC = () => {
  const frame = useCurrentFrame();
  const claimOp = fade(frame, 652, 668, 696, 710);
  const titleOp = fade(frame, 706, 720, 742, 750);
  const blackIn = interpolate(frame, [648, 660], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (frame < 646) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: '#070E19', opacity: blackIn }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: claimOp, textAlign: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 52, color: col.muted, letterSpacing: '.03em' }}>
          Ein Chat gibt dir Text.
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 62, color: col.ink, letterSpacing: '.03em', marginTop: 18 }}>
          Cody liefert das fertige Werkstück. <span style={{ color: col.cyanHot }}>Geprüft.</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: titleOp, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: 120,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: col.ink,
          }}
        >
          Inside <span style={{ color: col.cyanHot }}>Cody</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: '.4em', color: col.muted, marginTop: 26 }}>
          CODY · SOL · SWARM · CHERUB · GATES · DU
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ── Vignette für Kino-Look ── */
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.42) 100%)',
      pointerEvents: 'none',
    }}
  />
);
