/**
 * Detects the language a post is actually written in.
 *
 * The site chrome is English while most articles are Chinese, so the article
 * element carries its own `lang`. This matters beyond correctness: Pagefind
 * picks its tokenizer from the nearest `lang`, and Chinese indexed as English
 * gets split on whitespace, which makes it effectively unsearchable.
 */

const CJK_PATTERN = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/g;
const LATIN_WORD_PATTERN = /[A-Za-z][A-Za-z'-]*/g;

/** Below this, a handful of stray characters should not flip the language. */
const MIN_CJK_CHARS = 50;

export function detectContentLanguage(markdown: string): "zh" | "en" {
  const cjkChars = (markdown.match(CJK_PATTERN) ?? []).length;
  if (cjkChars < MIN_CJK_CHARS) return "en";

  const latinWords = (markdown.match(LATIN_WORD_PATTERN) ?? []).length;
  // A Chinese character carries roughly as much as a short English word, and
  // technical posts always carry English identifiers, so weight accordingly.
  return cjkChars > latinWords ? "zh" : "en";
}
