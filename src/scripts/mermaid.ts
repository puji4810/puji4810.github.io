import mermaid from "mermaid";

const isDark = (): boolean => {
  const theme = document.documentElement.dataset.theme;
  return theme === "dark" || document.documentElement.classList.contains("dark");
};

/** Reads a design token so diagrams stay in sync with theme.css. */
const token = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Mermaid's bundled themes ship their own palettes — lavender nodes on pale
 * yellow — which fight the parchment system. The `base` theme is the only one
 * that accepts a full palette, so every colour is mapped from a site token and
 * re-read whenever the theme flips.
 */
const themeVariables = () => {
  const fg = token("--color-fg");
  const muted = token("--color-fg-muted");
  const subtle = token("--color-fg-subtle");
  const accent = token("--color-accent");
  const surface = token("--color-surface");
  const elevated = token("--color-bg-elevated");
  const border = token("--color-border");
  const bg = token("--color-bg");

  return {
    darkMode: isDark(),
    background: surface,
    fontFamily: token("--font-sans"),
    fontSize: "14px",

    // Nodes: elevated fill, quiet border, body text.
    primaryColor: elevated,
    primaryTextColor: fg,
    primaryBorderColor: subtle,
    secondaryColor: surface,
    secondaryBorderColor: border,
    secondaryTextColor: fg,
    tertiaryColor: bg,
    tertiaryBorderColor: border,
    tertiaryTextColor: muted,

    // Edges and their labels.
    lineColor: muted,
    textColor: fg,
    edgeLabelBackground: surface,
    titleColor: fg,

    // Subgraph containers sit back on the page colour.
    clusterBkg: bg,
    clusterBorder: border,

    // Notes are the one place accent earns its keep.
    noteBkgColor: surface,
    noteBorderColor: accent,
    noteTextColor: fg,

    // Sequence diagrams.
    actorBkg: elevated,
    actorBorder: subtle,
    actorTextColor: fg,
    actorLineColor: muted,
    signalColor: muted,
    signalTextColor: fg,
    labelBoxBkgColor: elevated,
    labelBoxBorderColor: subtle,
    labelTextColor: fg,
    loopTextColor: fg,
    activationBkgColor: surface,
    activationBorderColor: accent,
    sequenceNumberColor: bg,
  };
};

const configureMermaid = () => {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: themeVariables(),
    securityLevel: "loose",
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
      curve: "basis",
    },
    sequence: {
      useMaxWidth: true,
    },
  });
};

const sourceFor = (element: HTMLElement) => {
  const original = element.dataset.mermaidSource;
  if (original) return original;

  const source = element.textContent?.trim() ?? "";
  element.dataset.mermaidSource = source;
  return source;
};

const renderDiagram = async (element: HTMLElement, index: number) => {
  const source = sourceFor(element);
  if (!source) return;

  element.dataset.mermaidState = "pending";
  element.textContent = source;

  try {
    const { svg } = await mermaid.render(`mermaid-diagram-${index}`, source);
    element.innerHTML = svg;
    element.dataset.mermaidState = "rendered";
    element.classList.remove("mermaid-error");
  } catch (error) {
    element.textContent = source;
    element.dataset.mermaidState = "error";
    element.classList.add("mermaid-error");
    console.warn("Mermaid render failed; preserved source fallback.", error);
  }
};

export const renderMermaidDiagrams = async () => {
  const diagrams = Array.from(document.querySelectorAll<HTMLElement>(".mermaid"));
  if (diagrams.length === 0) return;

  configureMermaid();
  for (const [index, diagram] of diagrams.entries()) {
    await renderDiagram(diagram, index);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void renderMermaidDiagrams();
  }, { once: true });
} else {
  void renderMermaidDiagrams();
}

window.addEventListener("render-theme-change", () => {
  void renderMermaidDiagrams();
});
