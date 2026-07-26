import { describe, it, expect } from 'vitest';
import { getAllDistHtmlFiles } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const JEKYLL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\{%-?\s+\w+/, label: 'Liquid tag ({% ... %})' },
  { pattern: /\{\{-?\s*(page|site|include|content|layout|paginator)\./, label: 'Jekyll variable ({{ site./page./include. })' },
  { pattern: /\{\{-?\s*\w+\s*\|\s*(prepend|append|sort|where|date|strip_html|markdownify|jsonify|slugify|relative_url|absolute_url|smartify|normalize_whitespace|xml_escape|cgi_escape|uri_escape|number_of_words|array_to_sentence_string|split|replace|remove|remove_first|capitalize|downcase|upcase|first|last|join|concat|compact|map|reverse|uniq|size|slice|sort_natural|floor|ceil|divided_by|modulo|plus|minus|times|round)/, label: 'Liquid filter (| filter)' },
  { pattern: /^layout:\s*(post|default|page|home|archive|tag|category)\s*(#.*)?$/m, label: 'Jekyll frontmatter layout' },
  { pattern: /^permalink:\s/m, label: 'Jekyll frontmatter permalink' },
  { pattern: /\binclude\s+\w+\.html/i, label: 'Jekyll include directive' },
  { pattern: /\| prepend: site\./i, label: 'Liquid prepend filter' },
  { pattern: /\| absolute_url/i, label: 'Jekyll absolute_url filter' },
  { pattern: /\| relative_url/i, label: 'Jekyll relative_url filter' },
  { pattern: /\bdate_to_(string|long_string|xmlschema|rfc822)\b/i, label: 'Jekyll date filter' },
  { pattern: /\bwhere_exp\b/i, label: 'Jekyll where_exp filter' },
  { pattern: /\bgroup_by_exp\b/i, label: 'Jekyll group_by_exp filter' },
  { pattern: /\bfind_exp\b/i, label: 'Jekyll find_exp filter' },
  { pattern: /\bpop_off_first\b/i, label: 'Jekyll pop_off_first filter' },
  { pattern: /\bpush\s+\w+\s*=/i, label: 'Jekyll push assignment' },
];

describe('Build Validation: No Jekyll/Liquid Syntax in Built HTML', () => {
  const htmlFiles = getAllDistHtmlFiles();

  it('dist folder contains HTML files to validate', () => {
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  for (const htmlFile of htmlFiles) {
    it(`${htmlFile.replace(/^.*\/dist\//, 'dist/')} has no unresolved Jekyll/Liquid`, () => {
      const content = fs.readFileSync(htmlFile, 'utf-8');

      for (const { pattern, label } of JEKYLL_PATTERNS) {
        const match = content.match(pattern);
        expect(
          match,
          `${htmlFile}: found ${label} matching "${match?.[0] ?? ''}"`
        ).toBeNull();
      }
    });
  }

  it('no Grunt or jQuery references in built HTML', () => {
    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf-8');
      expect(content, `${htmlFile} references jQuery`).not.toContain('jquery');
      expect(content, `${htmlFile} references Grunt`).not.toContain('grunt');
    }
  });

  it('all HTML files have valid doctype', () => {
    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf-8');
      expect(
        content.trimStart().startsWith('<!doctype html>') ||
        content.trimStart().startsWith('<!DOCTYPE html>'),
        `${htmlFile} missing doctype`
      ).toBe(true);
    }
  });

  it('all HTML files have closing body and html tags', () => {
    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf-8');
      expect(content).toContain('</body>');
      expect(content).toContain('</html>');
    }
  });

  it('no HTML files contain inline stylesheet errors', () => {
    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf-8');
      expect(content).not.toContain('undefined');
    }
  });
});

describe('Mermaid fenced Markdown renders to runtime containers', () => {
  it('Lamport article emits Mermaid containers without legacy closing-tag contamination', () => {
    const htmlFile = path.resolve('dist/2026/02/27/Lamport-Happens-Before/index.html');
    const content = fs.readFileSync(htmlFile, 'utf-8');

    expect(content).toContain('class="mermaid"');
    expect(content).not.toContain('language-mermaid');
    expect(content).not.toContain('&lt;/div&gt;');
    expect(content).not.toContain('</div&gt;');
  });
});
