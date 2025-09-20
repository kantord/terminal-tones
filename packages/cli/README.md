# @terminal-tones/cli

Command-line tool to generate terminal color schemes from images and render them via templates (e.g., Kitty).

## Usage

- Generate a scheme and print a template to stdout:

```sh
terminal-tones from-image <image> --template kitty
```

- Write template files to the OS config directory:

```sh
terminal-tones from-image <image> --template kitty --write
```

- Write to a custom folder:

```sh
terminal-tones from-image <image> --template kitty --write --output-folder ./my-themes
```

- Write and apply immediately (template-specific, requires --write):

```sh
terminal-tones from-image <image> --template kitty --write --apply
```

When writing without an explicit `--output-folder`, files are written to:

- Linux: `${XDG_CONFIG_HOME:-~/.config}/terminal-tones/theme`
- macOS: `~/Library/Application Support/terminal-tones/theme`
- Windows: `%APPDATA%/terminal-tones/theme`

## Kitty Template

- The Kitty template emits one file: `colors.conf`.
- To persist the theme across restarts, include it from your main `kitty.conf`:

```conf
include ~/.config/terminal-tones/theme/colors.conf
```

### Applying automatically with `--apply`

The `--apply` flag writes the template files and then attempts to apply them to running Kitty instances using `kitty @ set-colors`.

Kitty remote control must be enabled. Add the following to your `kitty.conf` and restart Kitty:

```conf
allow_remote_control socket
# Optional but recommended to make the socket location explicit
listen_on unix:/tmp/kitty
```

The CLI automatically tries the common global socket `unix:/tmp/kitty`. If you set a different socket, either export it for the shell running the CLI:

```sh
export KITTY_LISTEN_ON=unix:/tmp/kitty
```

…or pass `--to` manually when testing `kitty @` yourself (the CLI uses the defaults):

```sh
kitty @ --to unix:/tmp/kitty set-colors -a -c ~/.config/terminal-tones/theme/colors.conf
```

Notes:

- Kitty must be running for `--apply` to work.
- `--apply` changes colors for active sessions; use the `include` line above to persist the theme across restarts.
