export function resolvePublicImage(path: string): string {
  if (!path) {
    return '';
  }
  if (path.startsWith('/public/')) {
    return path.replace('/public', '');
  }
  if (path.startsWith('public/')) {
    return path.replace('public', '');
  }
  return path;
}
