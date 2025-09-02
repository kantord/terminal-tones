import { it, expect, describe } from 'vitest';
import { execa } from 'execa';
import stripAnsi from 'strip-ansi';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const tsEntry = path.resolve(here, '..', 'index.ts');

describe('terminal-tones --help', () => {
  it('prints help and exits 0', async () => {
    const { stdout, stderr, exitCode } = await execa(
      'node',
      ['--import', 'tsx', tsEntry, '--help'],
      { reject: false }
    );
    expect(exitCode).toBe(0);
    expect(stderr).toBe('');
    expect(stripAnsi(stdout)).toMatchSnapshot();
  });
});
