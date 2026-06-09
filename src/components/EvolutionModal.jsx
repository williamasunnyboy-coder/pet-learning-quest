import { useEffect, useRef, useState } from 'react'
import { PET_TYPES, getPetImageUrl } from '../store'
import { playEvolution } from '../sounds'

export default function EvolutionModal({ petType, petStage, petName, onClose }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const onCloseRef = useRef(onClose)
  const petDef = PET_TYPES[petType] || PET_TYPES['west-highland']
  const stageDef = petDef.stages[petStage]
  const imgUrl = getPetImageUrl(petType, petStage)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  function handleShare() {
    const text = `🎉 ${petName}进化成【${stageDef.name}】！\n已达到第 ${petStage + 1}/${petDef.stages.length} 阶段 ✨\n通过完成学习任务养成神兽中～`
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  useEffect(() => {
    requestAnimationFrame(() => setShow(true))
    playEvolution()
    const t = setTimeout(() => onCloseRef.current(), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ ...styles.overlay, opacity: show ? 1 : 0 }} onClick={onClose}>
      <div style={{ ...styles.modal, transform: show ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(40px)' }}>
        {/* Sparkles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{ ...styles.sparkle, ...sparklePos(i) }}>✨</div>
        ))}

        <div style={styles.badge}>🎉 进化了！</div>

        <img src={imgUrl} alt={petName} style={styles.petImg} />

        <div style={styles.stageName}>{stageDef.name}</div>
        <div style={styles.petNameText}>{petName} 解锁了新形态！</div>

        <div style={styles.stageRow}>
          {petDef.stages.map((s, i) => (
            <div key={i} style={{
              ...styles.stageStep,
              background: i <= petStage ? petDef.themeAccent : '#e8e8e8',
              color: i <= petStage ? '#fff' : '#bbb',
            }}>
              {i + 1}
            </div>
          ))}
        </div>
        <div style={styles.stageHint}>阶段 {petStage + 1} / {petDef.stages.length}</div>

        <button style={styles.shareBtn} onClick={handleShare}>
          {copied ? '✅ 已复制分享内容！' : '📤 分享这个成就'}
        </button>

        <button style={{ ...styles.closeBtn, background: petDef.themeAccent }} onClick={onClose}>
          太棒啦！继续加油 →
        </button>
      </div>
    </div>
  )
}

function sparklePos(i) {
  const angle = (i / 12) * 360
  const r = 130 + Math.sin(i * 1.3) * 20
  const x = 50 + Math.cos((angle * Math.PI) / 180) * r / 3
  const y = 50 + Math.sin((angle * Math.PI) / 180) * r / 3.5
  return {
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${(i * 0.15) % 1}s`,
    fontSize: i % 3 === 0 ? 22 : 14,
  }
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,10,30,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    transition: 'opacity 0.4s ease',
    padding: 20,
  },
  modal: {
    background: '#fff',
    borderRadius: 28,
    padding: '36px 28px',
    maxWidth: 340,
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
    boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
  },
  sparkle: {
    position: 'absolute',
    transform: 'translate(-50%,-50%)',
    animation: 'sparkle 1.5s ease-in-out infinite',
    pointerEvents: 'none',
    zIndex: 0,
  },
  badge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f7931e, #ffd200)',
    color: '#333',
    borderRadius: 999,
    padding: '6px 20px',
    fontWeight: 800,
    fontSize: 16,
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  petImg: {
    width: 160,
    height: 160,
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto 12px',
    animation: 'jump 0.6s ease infinite alternate',
    position: 'relative',
    zIndex: 1,
    filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))',
  },
  stageName: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 4,
    position: 'relative',
    zIndex: 1,
  },
  petNameText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  stageRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
    zIndex: 1,
  },
  stageStep: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 13,
    transition: 'all 0.3s',
  },
  stageHint: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  shareBtn: {
    padding: '10px 24px',
    background: 'transparent',
    color: '#888',
    border: '1.5px solid #e8e8e8',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    position: 'relative',
    zIndex: 1,
    width: '100%',
    marginBottom: 10,
    transition: 'all 0.2s',
  },
  closeBtn: {
    padding: '12px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    position: 'relative',
    zIndex: 1,
    width: '100%',
  },
}
