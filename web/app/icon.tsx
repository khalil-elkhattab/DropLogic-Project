import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
          borderRadius: 8,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 10,
            height: 10,
            background: '#60a5fa',
            borderRadius: 2,
            transform: 'rotate(12deg)',
          }}
        />
        <div
          style={{
            width: 16,
            height: 14,
            border: '2px solid #fafafa',
            borderRadius: 3,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 5,
            left: 5,
            width: 8,
            height: 8,
            border: '2px solid #3b82f6',
            borderRadius: '50%',
            opacity: 0.7,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
