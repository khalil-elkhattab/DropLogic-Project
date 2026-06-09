import { ImageResponse } from 'next/og';

export const alt = 'DropLogic — AI dropshipping intelligence platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(160deg, #09090b 0%, #18181b 50%, #0a0a0a 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.18)',
            filter: 'blur(80px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #27272a, #09090b)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 24, height: 20, border: '3px solid #fafafa', borderRadius: 4 }} />
          </div>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#fafafa',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            DropLogic
            <span style={{ color: '#2563eb' }}>.</span>
          </span>
        </div>

        <div style={{ position: 'relative', maxWidth: 800 }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#2563eb',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Built for Dropshippers
          </p>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#fafafa',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              marginBottom: 24,
            }}
          >
            Find winners. Render ads. Scale with logic.
          </h1>
          <p style={{ fontSize: 24, color: '#a1a1aa', lineHeight: 1.5 }}>
            AI product research, high-retention video creatives, and margin-safe insights for TikTok &amp; Meta sellers.
          </p>
        </div>

        <p style={{ fontSize: 16, color: '#52525b', fontFamily: 'monospace', position: 'relative' }}>
          droplogic.com · Smart commerce built with logic
        </p>
      </div>
    ),
    { ...size },
  );
}
