// Minimal smoke test to prove we can import Leonardo
// and access its exports without runtime errors.

import * as Leonardo from '@adobe/leonardo-contrast-colors';

export function leonardoImportSmoke(): string[] {
  return Object.keys(Leonardo);
}

// If executed directly via `pnpm --filter @terminal-tones/core demo:leonardo`,
// print a few keys to confirm import worked.
if (import.meta.url === `file://${process.argv[1]}`) {
  const keys = leonardoImportSmoke();
  console.log('Leonardo import OK. Export keys (sample):', keys.slice(0, 10));
}

