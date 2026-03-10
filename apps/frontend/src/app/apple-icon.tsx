import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #34D399 0%, #60A5FA 100%)',
          color: 'white',
          fontSize: 72,
          fontWeight: 900,
          borderRadius: 36,
          letterSpacing: -2,
        }}
      >
        EK
      </div>
    ),
    {
      ...size,
    },
  );
}
