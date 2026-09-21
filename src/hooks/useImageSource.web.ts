import { useEffect, useState } from 'react';

import { getImageBlob } from '@/src/services/imageStore.web';
import { WEB_IMAGE_PREFIX } from '@/src/services/imageStorage.web';

const objectUrlCache = new Map<string, string>();

export function useImageSource(uri?: string): string | undefined {
  const isLocalRef = !!uri && uri.startsWith(WEB_IMAGE_PREFIX);
  const [resolved, setResolved] = useState<string | undefined>(() =>
    isLocalRef ? objectUrlCache.get(uri!) : uri
  );

  useEffect(() => {
    if (!uri || !isLocalRef) {
      setResolved(uri);
      return;
    }
    const cached = objectUrlCache.get(uri);
    if (cached) {
      setResolved(cached);
      return;
    }
    let cancelled = false;
    setResolved(undefined);
    getImageBlob(uri.slice(WEB_IMAGE_PREFIX.length)).then((blob) => {
      if (cancelled || !blob) return;
      const objectUrl = URL.createObjectURL(blob);
      objectUrlCache.set(uri, objectUrl);
      setResolved(objectUrl);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, isLocalRef]);

  return resolved;
}
