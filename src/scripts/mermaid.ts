import mermaid from "mermaid";

type MermaidTheme = "default" | "dark";

const getCurrentTheme = (): MermaidTheme => {
  const theme = document.documentElement.dataset.theme;
  const hasDarkClass = document.documentElement.classList.contains("dark");
  return theme === "dark" || hasDarkClass ? "dark" : "default";
};

const configureMermaid = () => {
  mermaid.initialize({
    startOnLoad: false,
    theme: getCurrentTheme(),
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
