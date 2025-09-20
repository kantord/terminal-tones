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
  // Single strategy: reload config on the addressed kitty instance.
  // Assumes kitty.conf includes the generated theme via `include`.
  void targetDir;
  void files;
  const tried: string[] = [];
  const { spawnSync } = await import("node:child_process");
  // Prefer explicit env from kitty, else fall back to the standard single-socket path
  const addr = (() => {
    const envAddr = process.env.KITTY_LISTEN_ON; // e.g. "unix:/run/user/1000/kitty.sock"
    if (envAddr) return envAddr;
    const xdg = process.env.XDG_RUNTIME_DIR || `${process.env.HOME}/.cache/run`;
    return `unix:${xdg}/kitty.sock`;
  })();

  // Ask the single kitty server instance to load its config
  const cmd = ["kitty", "@", "--to", addr, "load-config"];
  tried.push(cmd.join(" "));
  const res = spawnSync(cmd[0]!, cmd.slice(1), { encoding: "utf8" });
  if (res.status === 0) return { applied: true, tried };
  return {
    applied: false,
    tried,
    error:
      "Failed to load via kitty @ load-config. Ensure kitty is running and remote control is enabled. If you use a custom socket, set KITTY_LISTEN_ON.",
  };
}

export default { renderKittyTheme, applyKittyTheme };
