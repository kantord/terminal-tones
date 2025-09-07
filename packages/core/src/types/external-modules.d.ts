declare module 'colorthief' {
  export function getPalette(
    sourceImage: HTMLImageElement | string,
    colorCount?: number,
    quality?: number
  ): Promise<[number, number, number][]>;
}

declare module 'culori' {
  export function converter(space: string): (c: unknown) => any;
}

