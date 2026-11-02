export type TimingInput = { north: number; south: number; east: number; west: number; saturationFlow: number; lostTime: number };
export type TimingResult = { cycle: number; nsGreen: number; ewGreen: number; amber: number; allRed: number; yNS: number; yEW: number; Y: number; oversaturated: boolean };

export function calculateWebster(input: TimingInput): TimingResult {
  const sat = Math.max(500, input.saturationFlow || 1900);
  const lost = Math.max(1, Math.min(10, input.lostTime || 4));
  const yNS = Math.max(input.north, input.south, 0) / sat;
  const yEW = Math.max(input.east, input.west, 0) / sat;
  const Y = yNS + yEW;
  const raw = Y < 0.95 ? (1.5 * (2 * lost) + 5) / (1 - Y) : 180;
  const cycle = Math.max(40, Math.min(180, raw));
  const amber = Math.min(3, lost);
  const allRed = Math.max(0, lost - amber);
  const effective = Math.max(14, cycle - 2 * lost);
  const extra = Math.max(0, effective - 14);
  const share = Y > 0 ? yNS / Y : 0.5;
  return { cycle, nsGreen: 7 + extra * share, ewGreen: 7 + extra * (1 - share), amber, allRed, yNS, yEW, Y, oversaturated: Y >= 0.95 };
}
