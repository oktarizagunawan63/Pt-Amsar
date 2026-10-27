import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });

export const FONT = fontFamily;

export const COLORS = {
  bg: '#0B1220',
  panel: '#111A2E',
  line: '#1E293B',
  text: '#F8FAFC',
  muted: '#94A3B8',
  /** The app's own brand green, used for intro/outro accents. */
  brand: '#15803D',
};

/** Screenshot area inside the browser frame: 1600×900 keeps the 16:9 ratio of the 1920×1080 captures. */
export const SCREEN = { width: 1600, height: 900, scale: 1600 / 1920 };
