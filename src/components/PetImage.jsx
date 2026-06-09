import { useState } from 'react'

/**
 * Pet image with skeleton-pulse loading state.
 * Renders as a React fragment (no extra wrapper div).
 */
export default function PetImage({ src, alt, style }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const w = style?.width ?? 140
  const h = style?.height ?? w
  const baseDisplay = style?.display ?? 'block'
  const baseMargin  = style?.margin  ?? '0 auto'

  return (
    <>
      {/* Skeleton placeholder shown while loading */}
      {!loaded && !error && (
        <div
          className="skeleton-pulse"
          style={{
            width: w, height: h,
            borderRadius: 12,
            display: baseDisplay,
            margin: baseMargin,
          }}
        />
      )}

      {/* Actual image — hidden until onLoad fires */}
      <img
        src={src}
        alt={alt || ''}
        style={{
          ...style,
          display: loaded && !error ? baseDisplay : 'none',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />

      {/* Fallback emoji on error */}
      {error && (
        <div style={{
          width: w, height: h,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.floor(w * 0.45),
          margin: baseMargin,
        }}>
          🐾
        </div>
      )}
    </>
  )
}
