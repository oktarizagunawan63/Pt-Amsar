import { COLORS, FONT, SCREEN } from '../theme';

const BAR = 44;

/** A minimal browser window; `children` render inside the 1600×900 screen area. */
export const BrowserFrame: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => (
  <div
    style={{
      width: SCREEN.width,
      height: SCREEN.height + BAR,
      borderRadius: 18,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
    }}
  >
    <div style={{ height: BAR, background: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
      {['#F87171', '#FBBF24', '#34D399'].map((c) => (
        <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
      ))}
      <div
        style={{
          marginLeft: 18,
          flex: 1,
          maxWidth: 720,
          height: 28,
          borderRadius: 14,
          background: '#fff',
          color: '#475569',
          fontFamily: FONT,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        {url}
      </div>
    </div>
    <div style={{ position: 'relative', width: SCREEN.width, height: SCREEN.height, overflow: 'hidden', background: COLORS.text }}>
      {children}
    </div>
  </div>
);
