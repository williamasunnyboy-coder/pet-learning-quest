import { useEffect, useState } from 'react'

const PARTICLES = ['🎉', '⭐', '🌟', '✨', '🎊', '💫', '🎈', '🏆', '🎀', '🌈', '🍀', '💝']

export default function CelebrationEffect({ onEnd }) {
  const [particles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: PARTICLES[i % PARTICLES.length],
      x: 15 + Math.random() * 70,
      delay: Math.random() * 0.35,
      dur: 0.75 + Math.random() * 0.55,
    }))
  )

  useEffect(() => {
    const t = setTimeout(onEnd, 1600)
    return () => clearTimeout(t)
  }, [onEnd])

  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', overflow: 'hidden', zIndex: 100,
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '70%',
            fontSize: 22,
            animation: `celebParticle ${p.dur}s ${p.delay}s ease-out forwards`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  )
}
