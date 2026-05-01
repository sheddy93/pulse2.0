/**
 * LazyImage Component
 * Lazy loads images for better performance on list pages
 * 
 * Usage: <LazyImage src="..." alt="..." className="w-full" />
 */
export default function LazyImage({ src, alt, className, onLoad, onError }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onLoad={onLoad}
      onError={onError}
      style={{ aspectRatio: '16 / 9' }}
    />
  );
}