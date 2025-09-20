# @terminal-tones/template-kitty

Kitty template for Terminal Tones. Produces a `current-theme.conf` file and provides a best-effort apply helper.

## API

- `renderKittyTheme(scheme, opts?) => Array<{ filename, content }>`
  - Returns an array of files to write. Currently a single `current-theme.conf`.
- `applyKittyTheme(targetDir, files) => Promise<{ applied, tried, error? }>`
  - Uses Kitty remote control to run `set-colors --all -c <file>`. Returns whether it applied and which commands were tried.

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
listen_on unix:/tmp/kitty
```

The apply helper first tries `KITTY_LISTEN_ON` (or running inside Kitty), and then falls back to `unix:/tmp/kitty`.

You can test manually:

```sh
# If running inside a Kitty window (or KITTY_LISTEN_ON is exported):
kitty @ set-colors --all -c current-theme.conf

# Or target the configured socket explicitly:
kitty @ --to "unix:/tmp/kitty" set-colors --all -c current-theme.conf
```

Notes:

- Kitty must be running for remote control to succeed.
- The template’s apply helper does not modify your main `kitty.conf`; use the `include` line above to persist.
