'use client';

import Image from 'next/image';
import { useState } from 'react';

type SmartImageProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  width?: number;
  previewWidth?: number;
};

export function cdnImageUrl(source: string, width: number) {
  try {
    const url = new URL(source);
    if (url.hostname === 'res.cloudinary.com') {
      const uploadPath = '/image/upload/';
      const uploadIndex = url.pathname.indexOf(uploadPath);
      if (uploadIndex >= 0) {
        const variantStart = uploadIndex + uploadPath.length;
        const pathAfterUpload = url.pathname.slice(variantStart);
        const existingTransforms = pathAfterUpload.match(/^((?:f_[^,/]+|q_[^,/]+|w_\d+|h_\d+|c_[^,/]+|g_[^,/]+|e_[^,/]+|fl_[^,/]+|dpr_[^,/]+)(?:,(?:f_[^,/]+|q_[^,/]+|w_\d+|h_\d+|c_[^,/]+|g_[^,/]+|e_[^,/]+|fl_[^,/]+|dpr_[^,/]+))*)\/(.+)$/);
        const assetPath = existingTransforms ? existingTransforms[2] : pathAfterUpload;
        const preservedTransforms = existingTransforms?.[1]?.split(',')
          .filter((transform) => !/^(?:f_|q_|w_|h_|c_|dpr_)/.test(transform)) ?? [];
        const transforms = ['f_auto', 'q_auto', `w_${width}`, 'c_limit', ...preservedTransforms].join(',');
        url.pathname = `${url.pathname.slice(0, variantStart)}${transforms}/${assetPath}`;
      }
    }
    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', '68');
    }
    return url.toString();
  } catch {
    return source;
  }
}

const warmedImages = new Set<string>();

export function preloadSmartImage(source?: string | null, width = 1400) {
  if (!source || typeof window === 'undefined') return;
  const url = cdnImageUrl(source, width);
  if (warmedImages.has(url)) return;
  warmedImages.add(url);
  const image = new window.Image();
  image.decoding = 'async';
  image.src = url;
}

export function SmartImage({ src, alt, sizes, className, priority = false, width = 720, previewWidth }: SmartImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | undefined>();
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>();
  const [previewLoadedSrc, setPreviewLoadedSrc] = useState<string | undefined>();
  const failed = !src || failedSrc === src;
  const loaded = loadedSrc === src;
  const previewLoaded = previewLoadedSrc === src;
  const hasPreview = Boolean(previewWidth && previewWidth < width);

  return (
    <span className="smart-image-frame" aria-busy={Boolean(src) && !failed && !loaded && !previewLoaded}>
      <span className="smart-image-placeholder" aria-hidden="true" />
      {src && !failed ? (
        <>
          {hasPreview && <Image src={cdnImageUrl(src, previewWidth!)} alt="" fill sizes={sizes} priority={priority} unoptimized className="smart-image-media smart-image-preview" onLoad={() => setPreviewLoadedSrc(src)} onError={() => setFailedSrc(src)} />}
          <Image
            src={cdnImageUrl(src, width)}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            unoptimized
            className={`smart-image-media${hasPreview ? ` smart-image-upgrade${loaded ? ' is-ready' : ''}` : ''}${className ? ` ${className}` : ''}`}
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailedSrc(src)}
          />
        </>
      ) : (
        <span className="smart-image-fallback" role="img" aria-label={alt}>
          <svg viewBox="0 0 120 96" aria-hidden="true">
            <path d="M16 75h88M25 75V39l35-22 35 22v36M39 75V52h42v23M49 52v23M71 52v23" />
            <path d="M18 31 60 8l42 23" />
            <circle cx="88" cy="22" r="7" />
          </svg>
        </span>
      )}
    </span>
  );
}
