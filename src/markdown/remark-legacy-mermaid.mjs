const openingMermaidDiv = /<div\s+class=["']mermaid["']\s*>/i;
const closingMermaidDiv = /<\/div>/i;

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const nodeText = (node) => {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) return node.children.map(nodeText).join("");
  return "";
};

const sourceAfterOpening = (value) => {
  const match = value.match(openingMermaidDiv);
  if (!match || match.index === undefined) return "";
  return value.slice(match.index + match[0].length).trim();
};

const sourceBeforeClosing = (value) => {
  const match = value.match(closingMermaidDiv);
  if (!match || match.index === undefined) return value.trim();
  return value.slice(0, match.index).trim();
};

const mermaidHtml = (source) => `<div class="mermaid">\n${escapeHtml(source.trim())}\n</div>`;

const mergeLegacyMermaidBlocks = (parent) => {
  if (!Array.isArray(parent.children)) return;

  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children[index];

    if (child.type !== "html" || !openingMermaidDiv.test(child.value)) {
      mergeLegacyMermaidBlocks(child);
      continue;
    }

    const parts = [];
    const rawInitial = sourceAfterOpening(child.value);
    const foundClosingInInitial = closingMermaidDiv.test(rawInitial);
    const initial = foundClosingInInitial ? sourceBeforeClosing(rawInitial) : rawInitial;
    if (initial) parts.push(initial);

    let endIndex = index;
    let foundClosing = foundClosingInInitial || closingMermaidDiv.test(child.value);

    while (!foundClosing && endIndex + 1 < parent.children.length) {
      endIndex += 1;
      const next = parent.children[endIndex];
      const text = nodeText(next);

      if (closingMermaidDiv.test(text)) {
        const closingSource = sourceBeforeClosing(text);
        if (closingSource) parts.push(closingSource);
        foundClosing = true;
        break;
      }

      if (text.trim()) parts.push(text.trim());
    }

    if (!foundClosing) {
      mergeLegacyMermaidBlocks(child);
      continue;
    }

    parent.children.splice(index, endIndex - index + 1, {
      type: "html",
      value: mermaidHtml(parts.join("\n")),
    });
  }
};

export default function remarkLegacyMermaid() {
  return (tree) => {
    mergeLegacyMermaidBlocks(tree);
  };
}
