export function stringToColor(str: string): { bg: string, text: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a hue value between 0 and 360
  const h = Math.abs(hash) % 360;
  
  // Use HSL for highly saturated, vibrant but soft pastel backgrounds
  const bg = `hsl(${h}, 70%, 90%)`;
  
  // Use a darker shade of the same hue for strong contrast text
  const text = `hsl(${h}, 80%, 25%)`;
  
  return { bg, text };
}
