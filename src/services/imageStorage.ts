import { Directory, File, Paths } from 'expo-file-system';

function ensureDir(name: string): Directory {
  const dir = new Directory(Paths.document, name);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export async function persistImage(sourceUri: string, folder: 'clothes' | 'outfits'): Promise<string> {
  const dir = ensureDir(folder);
  const extMatch = sourceUri.split('.').pop()?.split('?')[0];
  const ext = extMatch && extMatch.length <= 4 ? extMatch : 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const destination = new File(dir, filename);
  const source = new File(sourceUri);
  await source.copy(destination);
  return destination.uri;
}

export function deleteImage(uri?: string): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // best-effort cleanup only
  }
}

export async function imageToBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}
