# @terminal-tones/template-kitty

Kitty template for Terminal Tones. Produces a `current-theme.conf` file and provides a best-effort apply helper.

## API

- `renderKittyTheme(scheme, opts?) => Array<{ filename, content }>`
  - Returns an array of files to write. Currently a single `current-theme.conf`.
- `applyKittyTheme(targetDir, files) => Promise<{ applied, tried, error? }>`
  - Asks the running kitty instance to `load-config` via remote control. Returns whether it applied and which commands were tried.

## CLI usage

From `@terminal-tones/cli`:

```sh
terminal-tones from-image <image> --template kitty            # print to stdout
terminal-tones from-image <image> --template kitty --write    # write to config dir
terminal-tones from-image <image> --template kitty --apply    # write + apply
```

Default write locations:

When using the Kitty template with `--write`, the CLI first looks for the Kitty config directory and writes there so `include current-theme.conf` works out of the box:

- `${XDG_CONFIG_HOME:-~/.config}/kitty` (Linux)
- `~/Library/Application Support/kitty` (macOS)

If not found, it falls back to the generic Terminal Tones config directory:

- Linux: `${XDG_CONFIG_HOME:-~/.config}/terminal-tones/theme`
- macOS: `~/Library/Application Support/terminal-tones/theme`
- Windows: `%APPDATA%/terminal-tones/theme`

To persist across restarts, include the generated file from your main `kitty.conf`:

```conf
include current-theme.conf
```

## Enabling Kitty remote control

The `--apply` flow requires Kitty remote control. Add to `kitty.conf` and restart Kitty:

```conf
allow_remote_control yes
single_instance yes
```

The CLI targets the single kitty server socket.
It prefers `KITTY_LISTEN_ON` if set (e.g. `unix:/run/user/1000/kitty.sock`).
Otherwise it falls back to: `unix:${XDG_RUNTIME_DIR:-$HOME/.cache/run}/kitty.sock`.

If you use a custom socket, point the environment to it for your shell:

```sh
export KITTY_LISTEN_ON=unix:/path/to/kitty.sock
```

You can test manually:

```sh
kitty @ --to "unix:${XDG_RUNTIME_DIR:-$HOME/.cache/run}/kitty.sock" load-config
```

Notes:

- Kitty must be running for remote control to succeed.
- The template’s apply helper does not modify your main `kitty.conf`; use the `include` line above to persist.
