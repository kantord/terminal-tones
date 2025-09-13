import { getPalette } from 'colorthief';
import { converter } from 'culori';
import { minWeightAssign } from 'munkres-algorithm';
export const TERMINAL_16_REF = [
    ['#000000', { wL: 1.5 }], // 0 black
    ['#800000', { wH: 1.2 }], // 1 red
    ['#008000', { wH: 1.2 }], // 2 green
    ['#808000', { wL: 1.1 }], // 3 yellow
    ['#000080', { wH: 1.2 }], // 4 blue
    ['#800080', { wH: 1.2 }], // 5 magenta
    ['#008080', { wH: 1.2 }], // 6 cyan
    ['#c0c0c0', { wL: 1.3 }], // 7 white (light gray)
    ['#808080', { wL: 1.3 }], // 8 bright black (dark gray)
    ['#ff0000'], // 9 bright red
    ['#00ff00'], // 10 bright green
    ['#ffff00', { wS: 1.1 }], // 11 bright yellow
    ['#0000ff'], // 12 bright blue
    ['#ff00ff'], // 13 bright magenta
    ['#00ffff'], // 14 bright cyan
    ['#ffffff', { wL: 1.6 }], // 15 bright white
];
const toOkhsl = converter('okhsl');
function isHexColor(s) {
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}
function hueDeltaDeg(h1, h2) {
    const a = ((h1 ?? 0) % 360 + 360) % 360;
    const b = ((h2 ?? 0) % 360 + 360) % 360;
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}
export function okhslDiff(aHex, bHex) {
    const a = toOkhsl(aHex);
    const b = toOkhsl(bHex);
    return {
        dL: Math.abs((a.l ?? 0) - (b.l ?? 0)),
        dS: Math.abs((a.s ?? 0) - (b.s ?? 0)),
        dH: hueDeltaDeg(a.h, b.h),
    };
}
const DEFAULT_WEIGHTS = {
    wL: 1,
    wS: 1,
    wH: 1,
    normalizeHue: true,
};
function lhsCost(d, w = {}) {
    const { wL, wS, wH, normalizeHue } = { ...DEFAULT_WEIGHTS, ...w };
    const hTerm = normalizeHue ? d.dH / 180 : d.dH;
    return wL * d.dL + wS * d.dS + wH * hTerm;
}
function buildCostMatrix(inputs, weights) {
    const refs = TERMINAL_16_REF.map(([hex]) => toOkhsl(hex));
    const ins = inputs.map(toOkhsl);
    const rows = 16;
    const cols = inputs.length;
    const cost = Array.from({ length: rows }, () => Array(cols).fill(0));
    const normalizeHue = weights.normalizeHue ?? DEFAULT_WEIGHTS.normalizeHue;
    for (let r = 0; r < rows; r++) {
        const [, overrides] = TERMINAL_16_REF[r];
        const wL = overrides?.wL ?? 1;
        const wS = overrides?.wS ?? 1;
        const wH = overrides?.wH ?? 1;
        for (let c = 0; c < cols; c++) {
            const dL = Math.abs((refs[r].l ?? 0) - (ins[c].l ?? 0));
            const dS = Math.abs((refs[r].s ?? 0) - (ins[c].s ?? 0));
            const dH = hueDeltaDeg(refs[r].h, ins[c].h);
            cost[r][c] = lhsCost({ dL, dS, dH }, { wL, wS, wH, normalizeHue });
        }
    }
    return cost;
}
export function assignTerminalColorsOKHSL(inputHexColors, weights = {}) {
    if (!Array.isArray(inputHexColors) || inputHexColors.length < 16) {
        throw new Error('Provide an array of at least 16 hex colors.');
    }
    inputHexColors.forEach((hex, i) => {
        if (!isHexColor(hex))
            throw new Error(`Invalid hex at index ${i}: "${hex}"`);
    });
    const cost = buildCostMatrix(inputHexColors, weights);
    const { assignments, assignmentsWeight } = minWeightAssign(cost);
    const mapping = new Array(16);
    const details = [];
    let sum = 0;
    for (let r = 0; r < 16; r++) {
        const c = assignments[r]; // expect full assignment
        mapping[r] = c;
        const d = okhslDiff(TERMINAL_16_REF[r][0], inputHexColors[c]);
        const costVal = lhsCost(d, weights);
        details.push({ terminalIndex: r, inputIndex: c, dL: d.dL, dS: d.dS, dH: d.dH, cost: costVal });
        sum += costVal;
    }
    const totalCost = Number.isFinite(assignmentsWeight) ? assignmentsWeight : sum;
    return { mapping, totalCost, details };
}
const rgbToHex = (r, g, b) => '#' +
    [r, g, b]
        .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    })
        .join('');
// normalize to lowercase #rrggbb
function normalizeHex(hex) {
    const s = hex.trim().replace(/^#/, '');
    const six = s.length === 3 ? s.split('').map(ch => ch + ch).join('') : s;
    return ('#' + six.toLowerCase()).slice(0, 7);
}
async function stealPalette(image) {
    return (await getPalette(image, 32)).map(([r, g, b]) => rgbToHex(r, g, b));
}
export async function generateColorScheme(image) {
    const stolenPalette = await stealPalette(image);
    if (stolenPalette.length < 16) {
        throw new Error(`Palette too small: got ${stolenPalette.length}, need ≥ 16`);
    }
    const { mapping } = assignTerminalColorsOKHSL(stolenPalette);
    const terminal = mapping.map(idx => normalizeHex(stolenPalette[idx]));
    return { terminal };
}
//# sourceMappingURL=index.js.map