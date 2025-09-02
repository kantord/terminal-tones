
import { Command } from 'commander'

const program = new Command()


program.name('terminal-tones').description('A command line tool for generating terminal color schemes')


program.command('from-image')
  .description('Generate a color scheme from an image')
  .argument('<path>', 'path to image file')


program.parse()
