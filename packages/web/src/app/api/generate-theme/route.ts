import { NextRequest, NextResponse } from 'next/server';
import { generateInitialThemeFromSource } from '@terminal-tones/theme-generator/preconfigured';

export async function POST(req: NextRequest) {
  try {
    const { url, colorCount } = await req.json();
    if (typeof url !== 'string' || url.length < 4) {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 });
    }
    const result = await generateInitialThemeFromSource(url, { colorCount: Number(colorCount) || 24 });
    // If extraction failed, the generator now throws. Propagate as 422 for client visibility.
    return NextResponse.json({ base16Okhsl: result.base16Okhsl, defaults: result.defaults, meta: result.meta });
  } catch (e) {
    const message = (e as Error)?.message || 'failed to generate theme';
    const status = /Insufficient colors extracted/i.test(message) ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
