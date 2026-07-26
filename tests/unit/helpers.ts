import fs from 'node:fs';
import path from 'node:path';

export interface PostFrontmatter {
  title: string;
  subtitle?: string;
  publishedAt: string;
  author: string;
  heroImage?: string;
  showToc: string;
  tags: string[];
  summary: string;
  featured: string;
  legacyUrl: string;
  targetUrl: string;
  routeSlug: string;
}

function parseYamlValue(val: string): unknown {
  val = val.trim();
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
  if (val.startsWith('[') && val.endsWith(']')) {
    const inner = val.slice(1, -1);
    if (inner.trim() === '') return [];
    return inner.split(',').map(s => s.trim().replace(/^["'](.*)["']$/, '$1'));
  }
  const num = Number(val);
  if (!isNaN(num) && val !== '') return num;
  return val;
}

function parseFrontmatterYaml(yamlBlock: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yamlBlock.split('\n');
  let currentKey = '';
  let currentList: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    if (inList) {
      if (trimmed.startsWith('- ')) {
        currentList.push(trimmed.slice(2).trim().replace(/^["'](.*)["']$/, '$1'));
        continue;
      } else {
        result[currentKey] = currentList;
        currentList = [];
        inList = false;
      }
    }

    if (trimmed.startsWith('- ')) {
      currentKey = '';
      inList = false;
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      if (value === '') {
        currentKey = key;
        currentList = [];
        inList = true;
      } else {
        result[key] = parseYamlValue(value);
      }
    }
  }

  if (inList && currentKey) {
    result[currentKey] = currentList;
  }

  return result;
}

export function readPostFrontmatter(filePath: string): PostFrontmatter | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const parsed = parseFrontmatterYaml(match[1]);
  return {
    title: String(parsed.title ?? ''),
    subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
    publishedAt: String(parsed.publishedAt ?? ''),
    author: String(parsed.author ?? ''),
    heroImage: parsed.heroImage ? String(parsed.heroImage) : undefined,
    showToc: String(parsed.showToc ?? ''),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    summary: String(parsed.summary ?? ''),
    featured: String(parsed.featured ?? ''),
    legacyUrl: String(parsed.legacyUrl ?? ''),
    targetUrl: String(parsed.targetUrl ?? ''),
    routeSlug: String(parsed.routeSlug ?? ''),
  };
}

export function getAllPostFiles(): string[] {
  const postsDir = path.resolve(process.cwd(), 'src/content/posts');
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(postsDir, f))
    .sort();
}

export function getAllDistHtmlFiles(): string[] {
  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) return [];
  const results: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) results.push(full);
    }
  }
  walk(distDir);
  return results.sort();
}
