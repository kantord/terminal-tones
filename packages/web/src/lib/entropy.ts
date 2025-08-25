import sharp from "sharp";

export type OverlayPositionKey = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "grid";

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
  gridSteps: number = 5,
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

  // If overlay does not fit within padded bounds, shrink it proportionally
  const usableWidth = Math.max(1, width - 2 * padPxX);
  const usableHeight = Math.max(1, height - 2 * padPxY);
  if (overlayWidthPx > usableWidth || overlayHeightPx > usableHeight) {
    const scale = Math.min(usableWidth / overlayWidthPx, usableHeight / overlayHeightPx);
    overlayWidthPx = Math.max(1, Math.floor(overlayWidthPx * scale));
    overlayHeightPx = Math.max(1, Math.floor(overlayHeightPx * scale));
  }

  const minLeft = padPxX;
  const minTop = padPxY;
  const maxLeft = Math.max(minLeft, width - overlayWidthPx - padPxX);
  const maxTop = Math.max(minTop, height - overlayHeightPx - padPxY);

  const candidates: Array<{ key: OverlayPositionKey; left: number; top: number }> = [];
  const steps = Math.max(1, Math.floor(gridSteps));
  const denom = Math.max(1, steps - 1);
  for (let yi = 0; yi < steps; yi++) {
    for (let xi = 0; xi < steps; xi++) {
      const left = Math.round(minLeft + ((maxLeft - minLeft) * xi) / denom);
      const top = Math.round(minTop + ((maxTop - minTop) * yi) / denom);
      candidates.push({ key: "grid", left, top });
    }
  }

  // Compute gradient magnitude image once (Sobel)
  const { grad, gradMax } = computeSobelGradient(gray, width, height);

  let best = { key: "grid" as OverlayPositionKey, left: Math.round((minLeft + maxLeft) / 2), top: Math.round((minTop + maxTop) / 2), score: Number.POSITIVE_INFINITY };

  for (const c of candidates) {
    const s = scoreForRegion(gray, grad, width, height, c.left, c.top, overlayWidthPx, overlayHeightPx, gradMax);
    if (s < best.score) {
      best = { ...c, score: s };
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

function computeSobelGradient(gray: Uint8Array, width: number, height: number): { grad: Float32Array; gradMax: number } {
  const grad = new Float32Array(width * height);
  let maxVal = 0;
  // Skip borders to avoid bounds checks; treat borders as zero gradient
  for (let y = 1; y < height - 1; y++) {
    const ym1 = y - 1;
    const yp1 = y + 1;
    const rowOff = y * width;
    const rowOffM1 = ym1 * width;
    const rowOffP1 = yp1 * width;
    for (let x = 1; x < width - 1; x++) {
      const xm1 = x - 1;
      const xp1 = x + 1;
      const p00 = gray[rowOffM1 + xm1];
      const p01 = gray[rowOffM1 + x];
      const p02 = gray[rowOffM1 + xp1];
      const p10 = gray[rowOff + xm1];
      const p11 = gray[rowOff + x];
      const p12 = gray[rowOff + xp1];
      const p20 = gray[rowOffP1 + xm1];
      const p21 = gray[rowOffP1 + x];
      const p22 = gray[rowOffP1 + xp1];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;
      const mag = Math.hypot(gx, gy);
      grad[rowOff + x] = mag;
      if (mag > maxVal) maxVal = mag;
    }
  }
  return { grad, gradMax: maxVal > 0 ? maxVal : 1 };
}

function scoreForRegion(
  gray: Uint8Array,
  grad: Float32Array,
  width: number,
  height: number,
  left: number,
  top: number,
  regionWidth: number,
  regionHeight: number,
  gradMax: number,
): number {
  const clampedLeft = Math.max(0, Math.min(left, Math.max(0, width - regionWidth)));
  const clampedTop = Math.max(0, Math.min(top, Math.max(0, height - regionHeight)));

  let sumGrad = 0;
  let sum = 0;
  let sumSq = 0;
  const n = regionWidth * regionHeight;
  if (n <= 0) return Number.POSITIVE_INFINITY;

  for (let y = 0; y < regionHeight; y++) {
    const idxRow = (clampedTop + y) * width + clampedLeft;
    for (let x = 0; x < regionWidth; x++) {
      const g = grad[idxRow + x];
      sumGrad += g;
      const v = gray[idxRow + x];
      sum += v;
      sumSq += v * v;
    }
  }

  const meanGrad = sumGrad / n;
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  const stdDev = Math.sqrt(variance);

  // Normalize
  const meanGradNorm = meanGrad / gradMax;
  const stdDevNorm = stdDev / 128; // std dev roughly <= ~127.5

  const score = 0.8 * meanGradNorm + 0.2 * stdDevNorm;
  return score;
}

function centerFallback(overlayWidthPercent: number): EntropyPositionResult {
  const centerLeft = (100 - overlayWidthPercent) / 2;
  const centerTop = centerLeft; // since aspect=1 by default; this is a reasonable default even if not exact
  return { key: "center", leftPercent: centerLeft, topPercent: centerTop };
}
