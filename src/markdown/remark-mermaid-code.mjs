const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const visit = (node) => {
  if (!Array.isArray(node.children)) return;

  node.children = node.children.map((child) => {
    if (child.type !== "code" || child.lang !== "mermaid") {
      visit(child);
      return child;
    }

    return {
      type: "html",
      value: `<div class="mermaid">\n${escapeHtml(child.value.trim())}\n</div>`,
    };
  });
};

export default function remarkMermaidCode() {
  return (tree) => {
    visit(tree);
  };
}
