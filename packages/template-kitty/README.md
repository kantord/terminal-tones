# @terminal-tones/template-kitty

Kitty template for Terminal Tones. Produces a `colors.conf` file and provides a best-effort apply helper.

## API

- `renderKittyTheme(scheme, opts?) => Array<{ filename, content }>`
  - Returns an array of files to write. Currently a single `colors.conf`.
- `applyKittyTheme(targetDir, files) => Promise<{ applied, tried, error? }>`
  - Tries `kitty @ set-colors` variants against the generated file. Returns whether it applied and which commands were tried.

## CLI usage

From `@terminal-tones/cli`:

```sh
terminal-tones from-image <image> --template kitty            # print to stdout
terminal-tones from-image <image> --template kitty --write    # write to config dir
terminal-tones from-image <image> --template kitty --apply    # write + apply
```

Default write locations:

- Linux: `${XDG_CONFIG_HOME:-~/.config}/terminal-tones/theme`
- macOS: `~/Library/Application Support/terminal-tones/theme`
- Windows: `%APPDATA%/terminal-tones/theme`

To persist across restarts, include the generated file from your main `kitty.conf`:

```conf
include ~/.config/terminal-tones/theme/colors.conf
```

## Enabling Kitty remote control

The `--apply` flow requires Kitty remote control. Add to `kitty.conf` and restart Kitty:

```conf
allow_remote_control socket
# Optional but recommended to make the socket location explicit
listen_on unix:/tmp/kitty
```

The CLI automatically tries the common global socket `unix:/tmp/kitty`. If you set a different socket, point the environment to it for your shell:

```sh
export KITTY_LISTEN_ON=unix:/tmp/kitty
```

You can test manually:

```sh
kitty @ --to unix:/tmp/kitty set-colors -a -c ~/.config/terminal-tones/theme/colors.conf
```

Notes:

- Kitty must be running for remote control to succeed.
- The template’s apply helper does not modify your main `kitty.conf`; use the `include` line above to persist.
