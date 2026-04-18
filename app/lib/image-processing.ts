import { Vibrant } from 'node-vibrant/node';

export interface ColorData {
  hex: string;
  rgb: number[];
  population: number;
  name?: string;
}

export async function extractColors(imageUrl: string): Promise<ColorData[]> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();
    const colors: ColorData[] = [];
    
    if (palette.Vibrant) colors.push({ hex: palette.Vibrant.hex, rgb: palette.Vibrant.rgb, population: palette.Vibrant.population, name: 'Vibrant' });
    if (palette.Muted) colors.push({ hex: palette.Muted.hex, rgb: palette.Muted.rgb, population: palette.Muted.population, name: 'Muted' });
    if (palette.DarkVibrant) colors.push({ hex: palette.DarkVibrant.hex, rgb: palette.DarkVibrant.rgb, population: palette.DarkVibrant.population, name: 'DarkVibrant' });
    if (palette.DarkMuted) colors.push({ hex: palette.DarkMuted.hex, rgb: palette.DarkMuted.rgb, population: palette.DarkMuted.population, name: 'DarkMuted' });
    if (palette.LightVibrant) colors.push({ hex: palette.LightVibrant.hex, rgb: palette.LightVibrant.rgb, population: palette.LightVibrant.population, name: 'LightVibrant' });
    if (palette.LightMuted) colors.push({ hex: palette.LightMuted.hex, rgb: palette.LightMuted.rgb, population: palette.LightMuted.population, name: 'LightMuted' });
    
    return colors;
  } catch (err) {
    console.error("Color extraction failed", err);
    return [];
  }
}
