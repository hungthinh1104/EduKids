import { ImageResponse } from 'next/og';
import { semanticColors } from '@/shared/utils/design-tokens';

export const size = {
  width: 32,
  height: 32,
};

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
          background: `linear-gradient(135deg, ${semanticColors.primaryLight} 0%, ${semanticColors.interactive} 100%)`,
          color: semanticColors.textInverse,
          fontSize: 18,
          fontWeight: 800,
          borderRadius: 8,
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
