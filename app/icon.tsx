import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

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
          backgroundColor: '#2563eb',
          borderRadius: '8px',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="9" width="3" height="6" rx="0.75" fill="white" />
          <rect x="3.25" y="7" width="0.75" height="2" fill="white" />
          <rect x="3.25" y="15" width="0.75" height="1.5" fill="white" opacity="0.6" />

          <rect x="7.5" y="4" width="3" height="8" rx="0.75" fill="white" />
          <rect x="8.75" y="2" width="0.75" height="2" fill="white" />
          <rect x="8.75" y="12" width="0.75" height="1.5" fill="white" opacity="0.6" />

          <rect x="13" y="6" width="3" height="7" rx="0.75" fill="white" />
          <rect x="14.25" y="4" width="0.75" height="2" fill="white" />
          <rect x="14.25" y="13" width="0.75" height="1.5" fill="white" opacity="0.6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
