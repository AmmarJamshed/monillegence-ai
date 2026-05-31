const FILE_MARKER_RE = /===FILE:\s*(.+?)\s*===/g;

export function detectNewProjectFiles(
  buffer: string,
  seen: Set<string>
): string[] {
  const found: string[] = [];
  FILE_MARKER_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FILE_MARKER_RE.exec(buffer)) !== null) {
    const path = match[1].trim().replace(/^["']|["']$/g, '');
    if (path && !seen.has(path) && !path.includes('..')) {
      seen.add(path);
      found.push(path);
    }
  }
  return found;
}

export async function accumulateStream(
  stream: AsyncGenerator<string>
): Promise<string> {
  let raw = '';
  for await (const chunk of stream) {
    raw += chunk;
  }
  return raw;
}
