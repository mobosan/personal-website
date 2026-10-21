import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, relative, sep } from 'node:path';
const root = resolve('dist');
async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? walk(resolve(path, entry.name)) : [resolve(path, entry.name)],
      ),
    )
  ).flat();
}
const files = await walk(root);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const failures = [];
let checked = 0;
for (const file of htmlFiles) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|tel:|data:|\/\/)/.test(value)) continue;
    const [rawPath, hash] = value.split('#');
    const pathname = decodeURIComponent(rawPath.split('?')[0]);
    let target = pathname
      ? resolve(
          pathname.startsWith('/') ? root : dirname(file),
          '.' + (pathname.startsWith('/') ? pathname : '/' + pathname),
        )
      : file;
    if (!pathname.startsWith('/') && pathname) target = resolve(dirname(file), pathname);
    try {
      if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
      await stat(target);
      checked++;
      if (hash && target.endsWith('.html')) {
        const html = target === file ? source : await readFile(target, 'utf8');
        const id = decodeURIComponent(hash);
        if (!html.includes(`id="${id}"`))
          failures.push(`${relative(root, file)} → ${value}: missing anchor`);
      }
    } catch {
      failures.push(`${relative(root, file)} → ${value}: missing file`);
    }
  }
}
const sitemap = await readFile(resolve(root, 'sitemap-0.xml'), 'utf8');
const rss = await readFile(resolve(root, 'rss.xml'), 'utf8');
if (
  files.some((f) => f.includes(`${sep}draft-check${sep}`)) ||
  sitemap.includes('draft-check') ||
  rss.includes('draft-check')
)
  failures.push('Draft leaked into public output');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `PASS: ${htmlFiles.length} HTML documents, ${checked} local links/assets/anchors; draft excluded.`,
  );
