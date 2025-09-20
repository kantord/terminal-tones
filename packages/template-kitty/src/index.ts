// Minimal types to avoid cross-package build ordering constraints
type TerminalColors = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];
type SemanticColors = {
  background: { terminalColor: { fg: string; bg: string } };
  [k: string]: unknown; // other fields are not used here
};
export type ColorScheme = {
  terminal: TerminalColors;
  contrastColors: unknown;
  semanticColors: SemanticColors;
};

export type RenderOptions = {
  // Optional theme name to emit as a comment header
  name?: string;
};

export type TemplateFile = { filename: string; content: string };

// Render the kitty theme as a list of files so the CLI can either print
// them with headers or write them to disk in the config directory.
export function renderKittyTheme(
  scheme: ColorScheme,
  opts: RenderOptions = {},
): TemplateFile[] {
  const { terminal, semanticColors } = scheme;
  const bg = String(semanticColors.background.terminalColor.bg);
  const fg = String(semanticColors.background.terminalColor.fg);

  const lines: string[] = [];
  if (opts.name) {
    lines.push(`# ${opts.name}`);
  }
  // Core UI colors
  lines.push(`background ${bg}`);
  lines.push(`foreground ${fg}`);
  // Reasonable defaults; callers can tweak after generation
  lines.push(`cursor ${fg}`);
  lines.push(`selection_background ${fg}`);
  lines.push(`selection_foreground ${bg}`);

  // 16-color palette
  for (let i = 0; i < terminal.length; i++) {
    lines.push(`color${i} ${terminal[i]}`);
  }

  const content = lines.join("\n") + "\n";
  return [
    {
      // Kitty setups commonly include a single file from kitty.conf
      // like: `include current-theme.conf`.
      filename: "current-theme.conf",
      content,
    },
  ];
}

// Try to apply the theme using kitty's remote control. We best-effort a couple
// of common invocations. If all fail, return false to let the caller inform
// the user with hints.
export async function applyKittyTheme(
  targetDir: string,
  files: TemplateFile[],
): Promise<{ applied: boolean; tried: string[]; error?: string }> {
  // Apply colors via kitty remote control using the generated theme file.
  const tried: string[] = [];
  const { spawnSync } = await import("node:child_process");
  const path = await import("node:path");
  const fs = await import("node:fs");

  // Resolve the written theme file path. Prefer our standard filename.
  const themePath = (() => {
    const preferred = files.find((f) => f.filename === "current-theme.conf");
    const picked = preferred || files[0];
    return picked ? path.join(targetDir, picked.filename) : undefined;
  })();
  if (!themePath) {
    return { applied: false, tried, error: "No theme file found to apply." };
  }

  // Build a small sequence of strategies:
  // 1) Respect KITTY_LISTEN_ON if present
  // 2) Try without --to (works when run from a kitty child env)
  // 3) Broadcast to all detected unix:/tmp/kitty-* sockets (multiple instances)
  // 4) Fallback to a conventional socket path unix:/tmp/kitty
  const strategies: Array<string[]> = [];

  const envAddr = process.env.KITTY_LISTEN_ON;
  const addresses = new Set<string>();
  if (envAddr && envAddr.trim()) {
    addresses.add(envAddr.trim());
  }

  // No explicit --to: relies on KITTY_LISTEN_ON inherited when running inside kitty
  strategies.push(["kitty", "@", "set-colors", "--all", "-c", themePath]);

  // If we are using the default per-instance unix socket convention, attempt to
  // discover other kitty instances and apply to all of them.
  try {
    const tmpDir = "/tmp";
    const entries = fs.readdirSync(tmpDir, { withFileTypes: true });
    for (const ent of entries) {
      // Prefer actual sockets if available
      if (typeof ent.isSocket === "function" && !ent.isSocket()) continue;
      if (ent.name.startsWith("kitty-")) {
        addresses.add(`unix:${path.join(tmpDir, ent.name)}`);
      }
    }
    // Fallback when Dirent.isSocket is not implemented: include any kitty-* entries
    for (const ent of entries) {
      if (!ent.name.startsWith("kitty-")) continue;
      addresses.add(`unix:${path.join(tmpDir, ent.name)}`);
    }
  } catch {
    // Best effort; ignore discovery errors
  }

  // Add explicit commands for each discovered address
  for (const addr of addresses) {
    strategies.push([
      "kitty",
      "@",
      "--to",
      addr,
      "set-colors",
      "--all",
      "-c",
      themePath,
    ]);
  }

  // Conventional fixed socket used by our docs as an opt-in
  strategies.push([
    "kitty",
    "@",
    "--to",
    "unix:/tmp/kitty",
    "set-colors",
    "--all",
    "-c",
    themePath,
  ]);

  let anySuccess = false;
  for (const cmd of strategies) {
    tried.push(cmd.join(" "));
    const res = spawnSync(cmd[0]!, cmd.slice(1), { encoding: "utf8" });
    if (res.status === 0) anySuccess = true;
  }

  if (anySuccess) return { applied: true, tried };

  return {
    applied: false,
    tried,
    error:
      "Failed to apply via kitty remote control. Ensure kitty is running, allow_remote_control is enabled, and either run inside Kitty, set KITTY_LISTEN_ON, or configure `listen_on unix:/tmp/kitty`.",
  };
}

export default { renderKittyTheme, applyKittyTheme };
