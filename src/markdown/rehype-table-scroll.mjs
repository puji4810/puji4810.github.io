/**
 * Wraps every table in a scroll container.
 *
 * A table cannot both fill the article column and overflow it — sized to its
 * own content it needs an ancestor to do the scrolling. Without the wrapper a
 * wide table pushes the whole page sideways on narrow screens, which is how it
 * showed up on mobile: the body scrolled, not the table.
 */
const visit = (node) => {
  if (!Array.isArray(node.children)) return;

  node.children = node.children.map((child) => {
    if (child.type !== "element") return child;

    if (child.tagName !== "table") {
      visit(child);
      return child;
    }

    return {
      type: "element",
      tagName: "div",
      properties: { className: ["table-scroll"] },
      children: [child],
    };
  });
};

export default function rehypeTableScroll() {
  return (tree) => {
    visit(tree);
  };
}
