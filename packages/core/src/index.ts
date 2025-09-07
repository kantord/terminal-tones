import { getPalette } from 'colorthief'

type ImageFilePath = string
type InputImage = HTMLImageElement | ImageFilePath
type TerminalColors = string[16]
type ColorScheme = {
  terminal: TerminalColors
}

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')


async function stealPalette(image: InputImage) {
  return (await getPalette(image, 16)).map(([r, g, b]) => rgbToHex(r, g, b))
}


export async function generateColorScheme(image: InputImage): Promise<ColorScheme> {
  const stolenPalette = await stealPalette(image)

  return {
    terminal: stolenPalette
  }
}
