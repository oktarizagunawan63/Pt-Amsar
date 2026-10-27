import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT } from '../theme';

export interface FlowNode {
  label: string;
  color: string;
}

const NODE_W = 330;
const NODE_H = 120;
const GAP_X = 84;
const GAP_Y = 76;
const PER_ROW = 4;

interface Placed extends FlowNode {
  x: number;
  y: number;
  row: number;
}

/** 'row': one line; 'snake': rows of four that alternate direction so the arrows stay short. */
function place(nodes: FlowNode[], layout: 'row' | 'snake'): Placed[] {
  return nodes.map((n, i) => {
    if (layout === 'row') return { ...n, x: i * (NODE_W + GAP_X), y: 0, row: 0 };
    const row = Math.floor(i / PER_ROW);
    const col = row % 2 === 0 ? i % PER_ROW : PER_ROW - 1 - (i % PER_ROW);
    return { ...n, x: col * (NODE_W + GAP_X), y: row * (NODE_H + GAP_Y), row };
  });
}

const Arrow: React.FC<{ from: Placed; to: Placed; progress: number }> = ({ from, to, progress }) => {
  const sameRow = from.row === to.row;
  const x1 = sameRow ? (to.x > from.x ? from.x + NODE_W : from.x) : from.x + NODE_W / 2;
  const y1 = sameRow ? from.y + NODE_H / 2 : from.y + NODE_H;
  const x2 = sameRow ? (to.x > from.x ? to.x : to.x + NODE_W) : to.x + NODE_W / 2;
  const y2 = sameRow ? to.y + NODE_H / 2 : to.y;
  const xe = x1 + (x2 - x1) * progress;
  const ye = y1 + (y2 - y1) * progress;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={progress > 0 ? 1 : 0}>
      <line x1={x1} y1={y1} x2={xe} y2={ye} stroke={COLORS.muted} strokeWidth={4} strokeLinecap="round" />
      {progress > 0.95 && (
        <polygon
          points="0,0 -16,-9 -16,9"
          fill={COLORS.muted}
          transform={`translate(${x2 - Math.cos(angle) * 2}, ${y2 - Math.sin(angle) * 2}) rotate(${(angle * 180) / Math.PI})`}
        />
      )}
    </g>
  );
};

export const Flowchart: React.FC<{ nodes: FlowNode[]; layout: 'row' | 'snake'; stagger: number }> = ({ nodes, layout, stagger }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const placed = place(nodes, layout);
  const width = Math.max(...placed.map((p) => p.x)) + NODE_W;
  const height = Math.max(...placed.map((p) => p.y)) + NODE_H;
  const appear = (i: number) => spring({ frame: frame - i * stagger, fps, config: { damping: 15, mass: 0.7 } });

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {placed.slice(1).map((to, i) => (
          <Arrow
            key={i}
            from={placed[i]}
            to={to}
            progress={interpolate(frame, [i * stagger + stagger * 0.4, (i + 1) * stagger], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
          />
        ))}
      </svg>
      {placed.map((p, i) => {
        const t = appear(i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: NODE_W,
              height: NODE_H,
              borderRadius: 18,
              background: COLORS.panel,
              border: `3px solid ${p.color}`,
              boxShadow: `0 0 28px ${p.color}55`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 22px',
              opacity: t,
              transform: `scale(${interpolate(t, [0, 1], [0.85, 1])})`,
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                minWidth: 40,
                height: 40,
                borderRadius: 20,
                background: p.color,
                color: '#fff',
                fontWeight: 800,
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </div>
            <div style={{ color: COLORS.text, fontSize: 25, fontWeight: 600, lineHeight: 1.2 }}>{p.label}</div>
          </div>
        );
      })}
    </div>
  );
};
