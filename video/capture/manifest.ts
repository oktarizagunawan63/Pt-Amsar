import type { Role, RoleId } from '../src/content/types.ts';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Manifest = Record<RoleId, Record<string, { file: string; box: Box }>>;

export const VIEWPORT = { width: 1920, height: 1080 };

/** The part of `box` inside the screenshot; a box that is entirely off-screen comes back zero-sized. */
export function clipToViewport(box: Box): Box {
  const x = Math.max(0, box.x);
  const y = Math.max(0, box.y);
  const width = Math.max(0, Math.min(box.x + box.width, VIEWPORT.width) - x);
  const height = Math.max(0, Math.min(box.y + box.height, VIEWPORT.height) - y);
  return { x, y, width, height };
}

/** Problems that would make the video wrong (missing shot, highlight drawn on nothing); empty when valid. */
export function validateManifest(m: Manifest, roles: Role[]): string[] {
  const problems: string[] = [];
  for (const role of roles) {
    for (const shot of role.shots) {
      const key = `${role.id}/${shot.id}`;
      const entry = m[role.id]?.[shot.id];
      if (!entry) {
        problems.push(`${key} tidak ada di manifest`);
        continue;
      }
      const { x, y, width, height } = entry.box;
      if (width <= 0 || height <= 0) problems.push(`${key}: kotak highlight ukuran nol`);
      else if (x < 0 || y < 0 || x + width > VIEWPORT.width || y + height > VIEWPORT.height) {
        problems.push(`${key}: kotak highlight di luar layar`);
      }
    }
  }
  return problems;
}

export function assertNotLoginPage(url: string, role: RoleId): void {
  if (new URL(url).pathname === '/login') throw new Error(`Login gagal untuk role ${role}: masih di /login`);
}
