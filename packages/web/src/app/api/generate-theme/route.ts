import { NextRequest, NextResponse } from 'next/server';
import { generateInitialThemeFromSource } from '@terminal-tones/theme-generator/preconfigured';

export async function POST(req: NextRequest) {
  try {
    const { url, colorCount } = await req.json();
    if (typeof url !== 'string' || url.length < 4) {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 });
    }
    const result = await generateInitialThemeFromSource(url, { colorCount: Number(colorCount) || 24 });
    return NextResponse.json({ base16Okhsl: result.base16Okhsl, defaults: result.defaults, meta: result.meta });
  } catch (e) {
    return NextResponse.json({ error: 'failed to generate theme' }, { status: 500 });
  }
}
