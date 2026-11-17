import { ImageResponse } from 'next/og';

export const alt = 'Find Your Homestay - local stays in Dharamshala';
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
          justifyContent: 'center',
          padding: '72px',
          background: '#0b2f4d',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: '#f59e0b',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Find Your Homestay
        </div>
        <div
          style={{
            display: 'flex',
            maxWidth: 980,
            marginTop: 32,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.08,
          }}
        >
          Stay in Dharamshala.
          <br />
          Feel at home in the Himalayas.
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 32,
            color: '#dbeafe',
            fontSize: 30,
          }}
        >
          Homestays, hotels, and guest houses across Himachal Pradesh
        </div>
        <div
          style={{
            position: 'absolute',
            right: -120,
            bottom: -250,
            width: 560,
            height: 560,
            borderRadius: 280,
            background: '#f59e0b',
            opacity: 0.18,
          }}
        />
      </div>
    ),
    size
  );
}
