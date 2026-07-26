import { describe, it, expect } from 'vitest';
import { getAllPostFiles, readPostFrontmatter, getAllDistHtmlFiles } from './helpers';
import fs from 'node:fs';
import path from 'node:path';

const EXPECTED_ROUTES = [
  '/2025/10/28/Reading-lists/',
  '/2025/11/01/LevelDB-DBformat/',
  '/2025/11/01/LevelDB-Logformat/',
  '/2025/11/01/LevelDB-Memformat/',
  '/2025/11/01/LevelDB-SSTable/',
  '/2025/11/01/LevelDB-Tableformat/',
  '/2025/12/26/Singleton/',
  '/2026/02/27/Lamport-Happens-Before/',
  '/2026/07/26/A-scheduler-design/',
];

const EXPECTED_PAGES = [
  '/',
  '/archive/',
  '/tags/',
  '/about/',
  '/404.html',
];

function distPathForRoute(route: string): string {
  let rel = route.replace(/^\//, '');
  if (rel === '') return path.resolve('dist/index.html');
  if (rel.endsWith('/')) rel += 'index.html';
  return path.resolve('dist', rel);
}

describe('Route Manifest and Parity', () => {
  const postFiles = getAllPostFiles();
  const frontmatters = postFiles.map(f => ({
    file: f,
    fm: readPostFrontmatter(f),
  }));

  it('content collection defines all expected routes', () => {
    const actualRoutes = frontmatters
      .map(f => f.fm?.targetUrl)
      .filter(Boolean)
      .sort();
    const expectedSorted = [...EXPECTED_ROUTES].sort();
    expect(actualRoutes).toEqual(expectedSorted);
  });

  it('every post targetUrl produces distinct route segment for Astro getStaticPaths', () => {
    const slugs = frontmatters.map(f => {
      const url = f.fm?.targetUrl ?? '';
      return url.replace(/^\//, '').replace(/\/$/, '');
    });
    const unique = new Set(slugs);
    expect(unique.size).toBe(EXPECTED_ROUTES.length);
  });

  it('every expected post route exists in built dist output', () => {
    for (const route of EXPECTED_ROUTES) {
      const filePath = distPathForRoute(route);
      expect(
        fs.existsSync(filePath),
        `Expected built file at ${filePath} for route ${route}`
      ).toBe(true);
    }
  });

  it('every built post index.html declares the language of its content', () => {
    // Posts are Chinese or English; the layout derives lang from the body so
    // screen readers and the Pagefind tokenizer both pick the right one.
    for (const route of EXPECTED_ROUTES) {
      const filePath = distPathForRoute(route);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toMatch(/<html lang="(en|zh)"/);
    }
  });

  it('every built post index.html has a title tag', () => {
    for (const route of EXPECTED_ROUTES) {
      const filePath = distPathForRoute(route);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toMatch(/<title>.*<\/title>/);
    }
  });

  it('every built post index.html has canonical link', () => {
    for (const route of EXPECTED_ROUTES) {
      const filePath = distPathForRoute(route);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toMatch(/<link rel="canonical"/);
    }
  });

  it('all expected page routes exist in built dist', () => {
    for (const page of EXPECTED_PAGES) {
      const filePath = page === '/404.html'
        ? path.resolve('dist/404.html')
        : distPathForRoute(page);
      expect(
        fs.existsSync(filePath),
        `Expected built file at ${filePath} for page ${page}`
      ).toBe(true);
    }
  });

  it('homepage lists every article with links to preserved routes', () => {
    const indexPath = path.resolve('dist/index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    for (const route of EXPECTED_ROUTES) {
      expect(
        content.includes(route),
        `Homepage should link to ${route}`
      ).toBe(true);
    }
  });

  it('archive groups posts by year 2025 and 2026', () => {
    const archivePath = path.resolve('dist/archive/index.html');
    const content = fs.readFileSync(archivePath, 'utf-8');
    expect(content).toContain('2025');
    expect(content).toContain('2026');
  });

  it('tags page includes expected tags', () => {
    const tagsPath = path.resolve('dist/tags/index.html');
    const content = fs.readFileSync(tagsPath, 'utf-8');
    expect(content).toContain('LevelDB');
    expect(content).toContain('CPP');
    expect(content).toContain('Distributed Systems');
  });

  it('feed.xml exists and contains every article item', () => {
    const feedPath = path.resolve('dist/feed.xml');
    expect(fs.existsSync(feedPath)).toBe(true);
    const content = fs.readFileSync(feedPath, 'utf-8');
    const itemCount = (content.match(/<item>/g) || []).length;
    expect(itemCount).toBe(EXPECTED_ROUTES.length);
  });

  it('sitemap contains all article URLs', () => {
    const sitemapPath = path.resolve('dist/sitemap-0.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    for (const route of EXPECTED_ROUTES) {
      const encoded = 'https://puji4810.github.io' + route;
      expect(content).toContain(encoded);
    }
  });

  it('no broken local anchor links in built HTML', () => {
    const htmlFiles = getAllDistHtmlFiles();
    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${file} should not contain broken anchors`).not.toContain('href="#"');
    }
  });
});
