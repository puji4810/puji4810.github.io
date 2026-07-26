/**
 * Reading-time estimate for bilingual posts.
 *
 * CJK and Latin scripts are consumed at very different rates, so they are
 * counted separately rather than run through a single words-per-minute
 * figure. Fenced code is counted by line at a skim rate — excluding it
 * outright badly underestimates the code-heavy posts on this site.
 */

/** Kana, CJK ideographs (plus extension A), compatibility ideographs, Hangul. */
const CJK_PATTERN =
  /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]/g;

const CJK_CHARS_PER_MINUTE = 400;
const LATIN_WORDS_PER_MINUTE = 220;
const CODE_LINES_PER_MINUTE = 20;

export interface ReadingTime {
  /** Rounded up, never below one minute. */
  minutes: number;
  /** CJK characters plus Latin words, excluding code. */
  words: number;
}

export function readingTime(markdown: string): ReadingTime {
  const codeLines = countFencedCodeLines(markdown);

  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code, counted separately
    .replace(/`[^`\n]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links keep their label
    .replace(/<[^>]+>/g, " ") // raw HTML
    .replace(/^\s{0,3}[#>*+-]+\s*/gm, " ") // list and heading markers
    .replace(/[*_~|]/g, " ");

  const cjkChars = (prose.match(CJK_PATTERN) ?? []).length;
  const latinWords = prose
    .replace(CJK_PATTERN, " ")
    .split(/\s+/)
    .filter(token => /[\p{L}\p{N}]/u.test(token)).length;

  const minutes =
    cjkChars / CJK_CHARS_PER_MINUTE +
    latinWords / LATIN_WORDS_PER_MINUTE +
    codeLines / CODE_LINES_PER_MINUTE;

  return {
    minutes: Math.max(1, Math.ceil(minutes)),
    words: cjkChars + latinWords,
  };
}

function countFencedCodeLines(markdown: string): number {
  let lines = 0;
  for (const block of markdown.match(/```[\s\S]*?```/g) ?? []) {
    // Drop the two fence lines themselves.
    lines += Math.max(0, block.split("\n").length - 2);
  }
  return lines;
}
