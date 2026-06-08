/**
 * Dependency-free remark plugin: estimate reading time and expose it as
 * `minutesRead` on the Astro frontmatter (read in blog/[...slug].astro).
 * ~200 wpm, floored at 1 minute. Walks the mdast manually to avoid pulling
 * in unist-util-visit / reading-time.
 */
export function remarkReadingTime() {
  return function (tree, { data }) {
    let words = 0;
    const walk = (node) => {
      if (node.type === "text" && typeof node.value === "string") {
        const n = node.value.trim().split(/\s+/).filter(Boolean).length;
        words += n;
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
    data.astro.frontmatter.minutesRead = Math.max(1, Math.round(words / 200));
  };
}
