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

- The Kitty template emits one file: `current-theme.conf`.
- To persist the theme across restarts, include it from your main `kitty.conf`:

```conf
include current-theme.conf
```

When using the Kitty template with `--write`, the CLI first tries the Kitty config directory so `include current-theme.conf` works out of the box:

- `${XDG_CONFIG_HOME:-~/.config}/kitty` (Linux)
- `~/Library/Application Support/kitty` (macOS)

### Applying automatically with `--apply`

The `--apply` flag writes the template files and then attempts to apply them to a running Kitty instance using `kitty @ load-config`.

Kitty remote control must be enabled. Add the following to your `kitty.conf` and restart Kitty:

```conf
allow_remote_control yes
single_instance yes
```

The Kitty template targets a single kitty server socket. It prefers `KITTY_LISTEN_ON` if set (e.g. `unix:/run/user/1000/kitty.sock`). Otherwise it falls back to `unix:${XDG_RUNTIME_DIR:-$HOME/.cache/run}/kitty.sock`.

If you use a custom socket, either export it for the shell running the CLI:

```sh
export KITTY_LISTEN_ON=unix:/path/to/kitty.sock
```

…or pass `--to` manually when testing `kitty @` yourself (the CLI uses the defaults):

```sh
kitty @ --to "unix:${XDG_RUNTIME_DIR:-$HOME/.cache/run}/kitty.sock" load-config
```

Notes:

- Kitty must be running for `--apply` to work.
- `--apply` changes colors for active sessions; use the `include` line above to persist the theme across restarts.
