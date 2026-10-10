import MarkdownIt from "markdown-it";
import type { Plugin } from "vite";

const frontmatterPattern = /^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/;

export function markdownComponentsPlugin(): Plugin {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });
  markdown.linkify.set({ fuzzyLink: false });

  return {
    name: "lptff-markdown-components",
    enforce: "pre",
    transform(source, id) {
      if (!id.endsWith(".md")) return;

      const content = source.trimStart().replace(frontmatterPattern, "");
      const html = markdown.render(content).replace(/<code(.*?)>/g, "<code$1 v-pre>");

      return {
        code: `<template><div>${html}</div></template>`,
        map: null,
      };
    },
  };
}
