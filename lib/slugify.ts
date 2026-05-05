export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(title: string): string {
  const base = generateSlug(title);
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}
