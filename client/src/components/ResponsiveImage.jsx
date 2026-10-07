import React from 'react';
export default function ResponsiveImage({
  src,
  alt,
  width = 800,
  height = 600,
  className,
  sizes = '(max-width: 600px) 90vw, 400px',
}) {
  const variant = (size, format) => {
    try {
      const url = new URL(src);
      if (url.hostname === 'images.unsplash.com') {
        url.searchParams.set('w', size);
        url.searchParams.set('fm', format);
        url.searchParams.set('q', '80');
        return url.href;
      }
      if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/image/upload/')) {
        url.pathname = url.pathname.replace(
          '/image/upload/',
          `/image/upload/f_${format},w_${size},c_limit,q_auto/`,
        );
        return url.href;
      }
    } catch {}
    return null;
  };
  const srcSet = [400, 800, 1600]
    .map((size) => (variant(size, 'webp') ? `${variant(size, 'webp')} ${size}w` : null))
    .filter(Boolean)
    .join(', ');
  return (
    <picture>
      {srcSet && <source type="image/webp" srcSet={srcSet} sizes={sizes} />}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
}
