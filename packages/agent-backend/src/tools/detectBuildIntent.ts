const BUILD_VERBS =
  /\b(create|build|make|scaffold|generate|write|setup|set up|develop)\b/i;
const BUILD_OBJECTS =
  /\b(app|application|project|website|site|api|component|todo|dashboard|program|software)\b/i;

export function isBuildIntent(message: string): boolean {
  const m = message.trim();
  if (BUILD_VERBS.test(m) && BUILD_OBJECTS.test(m)) return true;
  if (/\b(create|build|make)\s+.+\s+(with|using)\b/i.test(m)) return true;
  return false;
}

export function inferProjectSlug(message: string): string {
  const cleaned = message
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(
      /\b(create|build|make|scaffold|generate|a|an|the|app|application|project|website|with|using|please|for|me|small|simple)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean).slice(0, 4);
  const slug = words.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug || `project-${Date.now()}`;
}
