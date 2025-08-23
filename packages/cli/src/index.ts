#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateCommand } from './lib/generate.js';

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('terminal-tones')
    .command(generateCommand)
    .demandCommand()
    .strict()
    .help()
    .parse();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
