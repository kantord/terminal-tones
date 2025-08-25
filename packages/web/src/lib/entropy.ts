import sharp from "sharp";

export type OverlayPositionKey = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export interface EntropyPositionResult {
  key: OverlayPositionKey;
  leftPercent: number; // 0..100
  topPercent: number; // 0..100
}

/**
 * Find the lowest entropy region among the four corners and the center.
 * The overlay size is expressed as a percentage of the image width.
 * Computation is done on a downscaled greyscale version for performance.
 */
export async function findLowestEntropyPosition(
  imageUrl: string,
  overlayWidthPercent: number = 45,
  overlayAspectRatio: number = 1,
  downscaleTargetWidth: number = 320,
  edgePaddingPercent: number = 5,
): Promise<EntropyPositionResult> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    return centerFallback(overlayWidthPercent);
  }
  const arrayBuf = await response.arrayBuffer();
  const input = Buffer.from(arrayBuf);

  // Downscale and convert to greyscale, output raw one-channel buffer
  const { data, info } = await sharp(input)
    .resize({ width: downscaleTargetWidth, withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const gray = new Uint8Array(data);
  const width = info.width;
  const height = info.height;
  const channels = info.channels; // should be 1 after greyscale()

  if (!width || !height || channels !== 1) {
    return centerFallback(overlayWidthPercent);
  }

  // Compute overlay size in pixels on the downscaled image
  let overlayWidthPx = Math.max(1, Math.round((overlayWidthPercent / 100) * width));
  let overlayHeightPx = Math.max(1, Math.round(overlayWidthPx / Math.max(1e-6, overlayAspectRatio)));

  // Ensure overlay fits into image; shrink if needed proportionally
  if (overlayWidthPx > width || overlayHeightPx > height) {
    const scale = Math.min(width / overlayWidthPx, height / overlayHeightPx);
    overlayWidthPx = Math.max(1, Math.floor(overlayWidthPx * scale));
    overlayHeightPx = Math.max(1, Math.floor(overlayHeightPx * scale));
  }

  const padPxX = Math.max(0, Math.round((edgePaddingPercent / 100) * width));
  const padPxY = Math.max(0, Math.round((edgePaddingPercent / 100) * height));

  const minLeft = padPxX;
  const minTop = padPxY;
  const maxLeft = Math.max(minLeft, width - overlayWidthPx - padPxX);
  const maxTop = Math.max(minTop, height - overlayHeightPx - padPxY);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const candidates: Array<{ key: OverlayPositionKey; left: number; top: number }> = [
    { key: "top-left", left: minLeft, top: minTop },
    { key: "top-right", left: maxLeft, top: minTop },
    { key: "bottom-left", left: minLeft, top: maxTop },
    { key: "bottom-right", left: maxLeft, top: maxTop },
    { key: "center", left: clamp(Math.round((minLeft + maxLeft) / 2), minLeft, maxLeft), top: clamp(Math.round((minTop + maxTop) / 2), minTop, maxTop) },
  ];

  let best = { key: "center" as OverlayPositionKey, left: Math.round(maxLeft / 2), top: Math.round(maxTop / 2), entropy: Number.POSITIVE_INFINITY };

  for (const c of candidates) {
    const e = entropyForRegion(gray, width, height, c.left, c.top, overlayWidthPx, overlayHeightPx);
    if (e < best.entropy) {
      best = { ...c, entropy: e };
    }
  }

  const leftPercent = (best.left / Math.max(1, width)) * 100;
  const topPercent = (best.top / Math.max(1, height)) * 100;

  return { key: best.key, leftPercent, topPercent };
}

function entropyForRegion(
  gray: Uint8Array,
  width: number,
  height: number,
  left: number,
  top: number,
  regionWidth: number,
  regionHeight: number,
): number {
  // 256-bin histogram for grayscale values
  const histogram = new Uint32Array(256);

  const clampedLeft = Math.max(0, Math.min(left, Math.max(0, width - regionWidth)));
  const clampedTop = Math.max(0, Math.min(top, Math.max(0, height - regionHeight)));

  for (let y = 0; y < regionHeight; y++) {
    const sourceRow = clampedTop + y;
    const rowOffset = sourceRow * width;
    for (let x = 0; x < regionWidth; x++) {
      const value = gray[rowOffset + clampedLeft + x];
      histogram[value]++;
    }
  }

  const total = regionWidth * regionHeight;
  if (total <= 0) return Number.POSITIVE_INFINITY;

  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    const count = histogram[i];
    if (count === 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function centerFallback(overlayWidthPercent: number): EntropyPositionResult {
  const centerLeft = (100 - overlayWidthPercent) / 2;
  const centerTop = centerLeft; // since aspect=1 by default; this is a reasonable default even if not exact
  return { key: "center", leftPercent: centerLeft, topPercent: centerTop };
}
