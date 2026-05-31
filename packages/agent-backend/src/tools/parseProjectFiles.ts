export interface ProjectFile {
  path: string;
  content: string;
}

const FILE_BLOCK_RE =
  /===FILE:\s*(.+?)\s*===\r?\n([\s\S]*?)(?====FILE:|===END===|$)/g;

export function parseProjectFiles(raw: string): ProjectFile[] {
  const files: ProjectFile[] = [];
  let match: RegExpExecArray | null;

  FILE_BLOCK_RE.lastIndex = 0;
  while ((match = FILE_BLOCK_RE.exec(raw)) !== null) {
    const path = match[1].trim().replace(/^["']|["']$/g, '');
    const content = match[2].replace(/\r?\n$/, '');
    if (path && content.trim()) {
      files.push({ path, content });
    }
  }

  if (files.length > 0) return normalizeFiles(files);

  return normalizeFiles(parseMarkdownFallback(raw));
}

function parseMarkdownFallback(raw: string): ProjectFile[] {
  const files: ProjectFile[] = [];
  const fenceRe = /```[\w.-]*\r?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = fenceRe.exec(raw)) !== null) {
    const block = match[1];
    const firstLine = block.split('\n')[0]?.trim() ?? '';
    const pathMatch =
      firstLine.match(/^(?:\/\/|#|<!--)\s*file:\s*(.+?)\s*(?:-->)?$/i) ??
      firstLine.match(/^path:\s*(.+)$/i);

    if (pathMatch) {
      const path = pathMatch[1].trim();
      const content = block.split('\n').slice(1).join('\n');
      files.push({ path, content });
    } else {
      index += 1;
      files.push({ path: `generated/file-${index}.txt`, content: block });
    }
  }

  return files;
}

function normalizeFiles(files: ProjectFile[]): ProjectFile[] {
  const seen = new Set<string>();
  return files
    .map((f) => ({
      path: f.path.replace(/\\/g, '/').replace(/^\.\//, ''),
      content: f.content,
    }))
    .filter((f) => {
      if (seen.has(f.path)) return false;
      seen.add(f.path);
      return !f.path.includes('..');
    });
}

/** Strip redundant project-folder prefix when model includes slug in every path. */
export function stripProjectFolderPrefix(
  files: ProjectFile[],
  slug: string
): ProjectFile[] {
  const safe = slug.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').toLowerCase();
  const prefixes = [`${safe}/`, `${safe}\\`];

  const normalized = files.map((f) => ({
    ...f,
    path: f.path.replace(/\\/g, '/'),
  }));

  const allNested = normalized.every((f) =>
    prefixes.some((p) => f.path.toLowerCase().startsWith(p.replace(/\\/g, '/')))
  );

  if (!allNested) return normalized;

  return normalized.map((f) => ({
    ...f,
    path: f.path.replace(new RegExp(`^${safe}/`, 'i'), ''),
  }));
}
