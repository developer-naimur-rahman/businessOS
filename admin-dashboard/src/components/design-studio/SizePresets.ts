export const SIZE_PRESETS = [
  { id: 'a4', name: 'A4 Document', width: 8.27, height: 11.69, unit: 'IN' },
  { id: 'a3', name: 'A3 Document', width: 11.69, height: 16.54, unit: 'IN' },
  { id: 'banner_2x3', name: 'Small Poster (2x3 ft)', width: 24, height: 36, unit: 'IN' },
  { id: 'banner_2x4', name: 'Poster (2x4 ft)', width: 24, height: 48, unit: 'IN' },
  { id: 'banner_2x6', name: 'Tall Banner (2x6 ft)', width: 24, height: 72, unit: 'IN' },
  { id: 'banner_2x8', name: 'Tall Banner (2x8 ft)', width: 24, height: 96, unit: 'IN' },
  { id: 'banner_3x6', name: 'Standard Banner (3x6 ft)', width: 36, height: 72, unit: 'IN' },
  { id: 'banner_3x8', name: 'Standard Banner (3x8 ft)', width: 36, height: 96, unit: 'IN' },
  { id: 'banner_3x10', name: 'Wide Banner (3x10 ft)', width: 36, height: 120, unit: 'IN' },
  { id: 'banner_4x8', name: 'Large Banner (4x8 ft)', width: 48, height: 96, unit: 'IN' },
  { id: 'banner_4x10', name: 'Large Banner (4x10 ft)', width: 48, height: 120, unit: 'IN' },
  { id: 'banner_4x12', name: 'Extra Large (4x12 ft)', width: 48, height: 144, unit: 'IN' },
  { id: 'banner_4x16', name: 'Massive Banner (4x16 ft)', width: 48, height: 192, unit: 'IN' },
];

export function getDimensionsInInches(width: number, height: number, unit: string) {
  let w = Number(width);
  let h = Number(height);
  if (unit === 'FT') {
    w *= 12;
    h *= 12;
  } else if (unit === 'CM') {
    w /= 2.54;
    h /= 2.54;
  } else if (unit === 'MM') {
    w /= 25.4;
    h /= 25.4;
  }
  return { width: w, height: h };
}
