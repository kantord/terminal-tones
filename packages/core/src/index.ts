import { getPalette } from 'colorthief'

type ImageFilePath = string
type InputImage = HTMLImageElement | ImageFilePath
type TerminalColors = string[16]
type ColorScheme = {
  terminal: TerminalColors
}

const TERMINAL_COLORS: string[] = [
  "#000000", // 0: black
  "#800000", // 1: red
  "#008000", // 2: green
  "#808000", // 3: yellow
  "#000080", // 4: blue
  "#800080", // 5: magenta
  "#008080", // 6: cyan
  "#c0c0c0", // 7: white (light gray)
  "#808080", // 8: bright black (dark gray)
  "#ff0000", // 9: bright red
  "#00ff00", // 10: bright green
  "#ffff00", // 11: bright yellow
  "#0000ff", // 12: bright blue
  "#ff00ff", // 13: bright magenta
  "#00ffff", // 14: bright cyan
  "#ffffff", // 15: bright white
];

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')


async function stealPalette(image: InputImage) {
  return (await getPalette(image, 32)).map(([r, g, b]) => rgbToHex(r, g, b))
}


export async function generateColorScheme(image: InputImage): Promise<ColorScheme> {
  const stolenPalette = await stealPalette(image)

  return {
    terminal: stolenPalette.slice(0, 16)
  }
}
