// Synthesizes the video's audio from scratch (no samples, no downloads), then encodes it with
// Remotion's bundled ffmpeg:
//   public/music.mp3  — 300 s ambient bed: C–Am–F–G pad, soft bass, plucked arpeggio with echo
//   public/whoosh.mp3 — 1 s filtered-noise sweep for the chapter wipes
// Run: npm run audio
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** 16-bit PCM WAV from interleaved stereo samples in [-1, 1]. */
function wav(left: Float32Array, right: Float32Array): Buffer {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
  }
  return buf;
}

function normalize(l: Float32Array, r: Float32Array, peakDb: number): void {
  let peak = 0;
  for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  const gain = 10 ** (peakDb / 20) / (peak || 1);
  for (let i = 0; i < l.length; i++) {
    l[i] *= gain;
    r[i] *= gain;
  }
}

function encode(l: Float32Array, r: Float32Array, out: string): void {
  const dir = mkdtempSync(join(tmpdir(), 'amsar-audio-'));
  const input = join(dir, 'in.wav');
  writeFileSync(input, wav(l, r));
  execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-c:a', 'libmp3lame', '-b:a', '160k', out], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
  rmSync(dir, { recursive: true, force: true });
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// C, Am, F, G — eight seconds each, as MIDI notes (pad voicing, then bass root).
const CHORDS = [
  { pad: [60, 64, 67, 72], bass: 36 },
  { pad: [57, 60, 64, 69], bass: 33 },
  { pad: [53, 57, 60, 65], bass: 29 },
  { pad: [55, 59, 62, 67], bass: 31 },
];
const CHORD_SEC = 8;
const FADE_SEC = 2;

function music(seconds: number): [Float32Array, Float32Array] {
  const n = seconds * RATE;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  const segments = Math.ceil(seconds / CHORD_SEC);

  // Pad + bass: each chord swells in over 2 s and overlaps the next, so changes never click.
  for (let s = 0; s < segments; s++) {
    const chord = CHORDS[s % CHORDS.length];
    const start = s * CHORD_SEC - FADE_SEC / 2;
    const end = start + CHORD_SEC + FADE_SEC;
    for (let i = Math.max(0, Math.floor(start * RATE)); i < Math.min(n, end * RATE); i++) {
      const t = i / RATE;
      const into = t - start;
      const left = end - t;
      const env = Math.min(1, into / FADE_SEC, left / FADE_SEC);
      const e = 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, env));
      let padL = 0;
      let padR = 0;
      chord.pad.forEach((note, v) => {
        const f = hz(note);
        // Two slightly detuned oscillators per voice, spread left/right, for a soft chorus.
        padL += Math.sin(2 * Math.PI * (f - 0.6) * t + v) + 0.18 * Math.sin(4 * Math.PI * (f - 0.6) * t);
        padR += Math.sin(2 * Math.PI * (f + 0.6) * t + v * 1.7) + 0.18 * Math.sin(4 * Math.PI * (f + 0.6) * t);
      });
      const bass = Math.sin(2 * Math.PI * hz(chord.bass) * t) * 0.9;
      l[i] += e * (0.11 * padL + 0.35 * bass);
      r[i] += e * (0.11 * padR + 0.35 * bass);
    }
  }

  // Plucked arpeggio, one note per second (1-3-5-3 of the chord, an octave up), with a ping-pong echo.
  const arpL = new Float32Array(n);
  const arpR = new Float32Array(n);
  const PATTERN = [0, 2, 3, 2, 1, 2, 3, 2];
  for (let beat = 0; beat < seconds; beat++) {
    const chord = CHORDS[Math.floor(beat / CHORD_SEC) % CHORDS.length];
    const f = hz(chord.pad[PATTERN[beat % PATTERN.length]] + 12);
    const startI = beat * RATE;
    for (let k = 0; k < 2 * RATE && startI + k < n; k++) {
      const t = k / RATE;
      const env = Math.min(1, t / 0.008) * Math.exp(-t * 3.2);
      const v = env * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(6 * Math.PI * f * t));
      const pan = beat % 2 === 0 ? 0.35 : -0.35;
      arpL[startI + k] += v * (1 - pan) * 0.5;
      arpR[startI + k] += v * (1 + pan) * 0.5;
    }
  }
  const D = Math.round(0.375 * RATE);
  for (let i = D; i < n; i++) {
    arpL[i] += 0.38 * arpR[i - D];
    arpR[i] += 0.38 * arpL[i - D];
  }
  for (let i = 0; i < n; i++) {
    l[i] += 0.22 * arpL[i];
    r[i] += 0.22 * arpR[i];
  }

  // Overall fade in/out.
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const g = Math.min(1, t / 3, (seconds - t) / 4);
    l[i] *= g;
    r[i] *= g;
  }
  normalize(l, r, -3);
  return [l, r];
}

/** White noise through a one-pole low-pass whose cutoff sweeps up then down, panned left → right. */
function whoosh(seconds: number): [Float32Array, Float32Array] {
  const n = Math.round(seconds * RATE);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  let y = 0;
  let seed = 12345;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x3fffffff - 1;
  };
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const cutoff = p < 0.6 ? 300 + (6000 - 300) * (p / 0.6) ** 2 : 6000 - (6000 - 800) * ((p - 0.6) / 0.4);
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / RATE);
    y += a * (noise() - y);
    const env = p < 0.6 ? (p / 0.6) ** 1.5 : (1 - (p - 0.6) / 0.4) ** 2;
    l[i] = y * env * (1 - p);
    r[i] = y * env * p;
  }
  normalize(l, r, -6);
  return [l, r];
}

encode(...music(300), join(ROOT, 'public', 'music.mp3'));
encode(...whoosh(1), join(ROOT, 'public', 'whoosh.mp3'));
console.log('public/music.mp3 dan public/whoosh.mp3 dibuat.');
