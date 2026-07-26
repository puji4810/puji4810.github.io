import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { getAllPostFiles, readPostFrontmatter } from './helpers';

const EXPECTED_POSTS = 9;

const REQUIRED_STRING_FIELDS = [
  'title',
  'publishedAt',
  'author',
  'summary',
  'legacyUrl',
  'targetUrl',
  'routeSlug',
] as const;

const REQUIRED_BOOLEAN_FIELDS = ['showToc', 'featured'] as const;

const VALID_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

describe('Content Schema Validation', () => {
  const postFiles = getAllPostFiles();
  const frontmatters = postFiles.map(f => ({
    file: f,
    fm: readPostFrontmatter(f),
  }));

  it(`has exactly ${EXPECTED_POSTS} posts in content collection`, () => {
    expect(postFiles.length).toBe(EXPECTED_POSTS);
  });

  it('all posts have parsable frontmatter', () => {
    for (const { file, fm } of frontmatters) {
      expect(fm, `Failed to parse frontmatter for ${file}`).not.toBeNull();
    }
  });

  describe('required fields present on all posts', () => {
    for (const field of REQUIRED_STRING_FIELDS) {
      it(`every post has non-empty "${field}"`, () => {
        for (const { file, fm } of frontmatters) {
          expect(
            fm?.[field],
            `Post ${file} is missing "${field}"`
          ).toBeTruthy();
          expect(
            typeof fm?.[field],
            `Post ${file} "${field}" should be a string`
          ).toBe('string');
        }
      });
    }
  });

  describe('required boolean fields', () => {
    for (const field of REQUIRED_BOOLEAN_FIELDS) {
      it(`every post has "${field}" as "true" or "false"`, () => {
        for (const { file, fm } of frontmatters) {
          const val = fm?.[field];
          expect(
            val === 'true' || val === 'false',
            `Post ${file} "${field}" is "${val}", expected "true" or "false"`
          ).toBe(true);
        }
      });
    }
  });

  it('all posts have valid ISO dates for publishedAt', () => {
    for (const { file, fm } of frontmatters) {
      expect(
        fm?.publishedAt,
        `Post ${file} missing publishedAt`
      ).toBeTruthy();
      expect(
        VALID_DATE_REGEX.test(fm?.publishedAt ?? ''),
        `Post ${file} publishedAt "${fm?.publishedAt}" is not YYYY-MM-DD`
      ).toBe(true);
    }
  });

  it('all posts have tags array with at least one tag', () => {
    for (const { file, fm } of frontmatters) {
      expect(
        Array.isArray(fm?.tags),
        `Post ${file} tags should be an array`
      ).toBe(true);
      expect(
        fm!.tags.length,
        `Post ${file} should have at least one tag`
      ).toBeGreaterThan(0);
    }
  });

  it('all posts have targetUrl with leading slash and trailing slash', () => {
    for (const { file, fm } of frontmatters) {
      expect(
        fm?.targetUrl?.startsWith('/'),
        `Post ${file} targetUrl "${fm?.targetUrl}" should start with /`
      ).toBe(true);
      expect(
        fm?.targetUrl?.endsWith('/'),
        `Post ${file} targetUrl "${fm?.targetUrl}" should end with /`
      ).toBe(true);
    }
  });

  it('all posts have matching legacyUrl and targetUrl', () => {
    for (const { file, fm } of frontmatters) {
      expect(
        fm?.targetUrl,
        `Post ${file} targetUrl "${fm?.targetUrl}" should equal legacyUrl "${fm?.legacyUrl}"`
      ).toBe(fm?.legacyUrl);
    }
  });

  it('all titles are unique', () => {
    const titles = frontmatters.map(f => f.fm?.title);
    const unique = new Set(titles);
    expect(unique.size).toBe(frontmatters.length);
  });

  it('all targetUrls are unique', () => {
    const urls = frontmatters.map(f => f.fm?.targetUrl);
    const unique = new Set(urls);
    expect(unique.size).toBe(frontmatters.length);
  });
});

describe('Mermaid authoring format', () => {
  const postFiles = getAllPostFiles();
  const mermaidPosts = postFiles.filter(file => fs.readFileSync(file, 'utf-8').includes('```mermaid'));

  it('uses fenced mermaid code blocks instead of legacy raw HTML containers', () => {
    expect(mermaidPosts.length, 'Expected migrated Mermaid posts').toBeGreaterThan(0);

    for (const file of postFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${file} still uses legacy Mermaid HTML`).not.toContain('<div class="mermaid">');
    }
  });

  it('has balanced fenced mermaid blocks in every Mermaid post', () => {
    for (const file of mermaidPosts) {
      const content = fs.readFileSync(file, 'utf-8');
      const openings = content.match(/^```mermaid$/gm) ?? [];
      const fences = content.match(/^```$/gm) ?? [];

      expect(openings.length, `${file} should contain at least one Mermaid fence`).toBeGreaterThan(0);
      expect(fences.length, `${file} should close every Mermaid fence`).toBeGreaterThanOrEqual(openings.length);
    }
  });
});
