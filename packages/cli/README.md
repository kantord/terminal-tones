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

- Generate a scheme and set your X11 wallpaper (per-screen, cover via feh):

```sh
terminal-tones set-wallpaper <image> --template kitty --write --apply
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

The `--apply` flag writes the template files and then applies them to a running Kitty instance using `kitty @ set-colors --all -c <file>`.

Kitty remote control must be enabled. Add the following to your `kitty.conf` and restart Kitty:

```conf
allow_remote_control yes
single_instance yes
listen_on unix:/tmp/kitty
```

When applying, the CLI first tries `KITTY_LISTEN_ON` (or running inside Kitty), and then falls back to `unix:/tmp/kitty`.

When testing manually, you can use:

```sh
kitty @ set-colors --all -c current-theme.conf
# or target an explicit socket you configured
kitty @ --to "unix:/tmp/kitty" set-colors --all -c current-theme.conf
```

Notes:

- Kitty must be running for `--apply` to work.
- `--apply` changes colors for active sessions; use the `include` line above to persist the theme across restarts.

## X11 Wallpaper

- The `set-wallpaper` command sets your X11 wallpaper per-screen, fitting to cover the screen.
- Requires `feh`. Install it with your package manager, for example:
  - Debian/Ubuntu: `sudo apt install feh`
  - Arch: `sudo pacman -S feh`
  - Fedora: `sudo dnf install feh`
- Command used under the hood:
  - `feh --no-fehbg --bg-fill <image>`
