import { deleteImageBlob, putImageBlob } from '@/src/services/imageStore.web';
import { generateId } from '@/src/utils/id';

export const WEB_IMAGE_PREFIX = 'weblocal:';

export async function persistImage(sourceUri: string, _folder: 'clothes' | 'outfits'): Promise<string> {
  const response = await fetch(sourceUri);
  const blob = await response.blob();
  const key = generateId('img_');
  await putImageBlob(key, blob);
  return `${WEB_IMAGE_PREFIX}${key}`;
}

export function deleteImage(uri?: string): void {
  if (!uri || !uri.startsWith(WEB_IMAGE_PREFIX)) return;
  const key = uri.slice(WEB_IMAGE_PREFIX.length);
  deleteImageBlob(key).catch(() => {});
}
