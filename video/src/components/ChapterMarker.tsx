import { ROLES } from '../content/roles';
import { COLORS, FONT } from '../theme';

const SHORT = ['Sales', 'Sales Mgr', 'Site Mgr', 'Engineer', 'Admin'];

/** Top-right chapter index shown through chapters 01–05; the active role is lit in its color. */
export const ChapterMarker: React.FC<{ activeIndex: number }> = ({ activeIndex }) => (
  <div style={{ position: 'absolute', top: 30, right: 44, display: 'flex', gap: 22, fontFamily: FONT }}>
    {ROLES.map((role, i) => {
      const active = i === activeIndex;
      return (
        <div key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: active ? 1 : 0.55 }}>
          <div
            style={{
              width: active ? 16 : 11,
              height: active ? 16 : 11,
              borderRadius: 8,
              background: active ? role.color : 'transparent',
              border: `2px solid ${active ? role.color : COLORS.muted}`,
              boxShadow: active ? `0 0 16px ${role.color}` : 'none',
            }}
          />
          <span style={{ color: active ? COLORS.text : COLORS.muted, fontSize: 18, fontWeight: active ? 700 : 500 }}>{SHORT[i]}</span>
        </div>
      );
    })}
  </div>
);
