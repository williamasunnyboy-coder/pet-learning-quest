import { playTapPet, playAchievement } from '../sounds'
import { hapticLight, hapticSuccess } from '../haptic'

export default function DecorationModal({ decorations, equippedItems, onEquip, onClose }) {
  const hats = decorations.filter(d => d.type === 'hat')
  const accs = decorations.filter(d => d.type === 'acc')
  const unlockedCount = decorations.filter(d => d.unlocked).length

  function handleEquip(item) {
    if (!item.unlocked) return
    const current = equippedItems[item.type]
    if (current === item.id) {
      playTapPet()
      hapticLight()
      onEquip(item.type, null)        // unequip
    } else {
      playAchievement()
      hapticSuccess()
      onEquip(item.type, item.id)     // equip
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div style={S.handle} />

        <div style={S.header}>
          <div style={S.title}>🎀 宠物换装</div>
          <div style={S.subtitle}>
            已解锁 {unlockedCount}/{decorations.length} 件饰品
          </div>
        </div>

        {/* Hats */}
        <div style={S.sectionLabel}>帽子</div>
        <div style={S.grid}>
          {hats.map(item => (
            <DecoItem
              key={item.id}
              item={item}
              equipped={equippedItems?.hat === item.id}
              onTap={() => handleEquip(item)}
            />
          ))}
        </div>

        {/* Accessories */}
        <div style={S.sectionLabel}>饰品</div>
        <div style={S.grid}>
          {accs.map(item => (
            <DecoItem
              key={item.id}
              item={item}
              equipped={equippedItems?.acc === item.id}
              onTap={() => handleEquip(item)}
            />
          ))}
        </div>

        <button style={S.doneBtn} onClick={onClose}>完成换装 ✓</button>
      </div>
    </div>
  )
}

function DecoItem({ item, equipped, onTap }) {
  const locked = !item.unlocked

  return (
    <div
      style={{
        ...S.item,
        background: equipped
          ? '#f0f5ff'
          : locked ? '#f7f7f9' : '#fff',
        border: equipped
          ? '2.5px solid #667eea'
          : locked ? '2px dashed #ddd' : '2px solid #f0f0f0',
        cursor: locked ? 'default' : 'pointer',
        transform: equipped ? 'scale(1.06)' : 'scale(1)',
      }}
      onClick={onTap}
    >
      {/* Emoji — faded when locked */}
      <div style={{ ...S.itemEmoji, opacity: locked ? 0.35 : 1 }}>
        {item.emoji}
      </div>

      {/* Name */}
      <div style={{ ...S.itemName, color: locked ? '#c0c0cc' : '#444' }}>
        {item.name}
      </div>

      {locked ? (
        /* ── Locked state: show unlock requirement + progress ── */
        <>
          <div style={S.hint}>{item.hint}</div>
          <div style={S.progressBg}>
            <div style={{ ...S.progressFill, width: `${item.progressPct}%` }} />
          </div>
        </>
      ) : (
        /* ── Unlocked state: equipped indicator ── */
        <>
          {equipped && (
            <div style={S.equippedLabel}>已佩戴</div>
          )}
          <div style={S.equippedDot(equipped)} />
        </>
      )}
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10,10,30,0.6)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 1800,
  },
  sheet: {
    background: '#fff',
    borderRadius: '24px 24px 0 0',
    padding: '12px 20px 36px',
    width: '100%', maxWidth: 420,
    maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
  },
  handle: {
    width: 40, height: 4,
    background: '#e0e0e0', borderRadius: 999,
    margin: '0 auto 16px',
  },
  header: { textAlign: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontWeight: 800, color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#aaa', marginTop: 4 },
  sectionLabel: {
    fontSize: 12, fontWeight: 700, color: '#aaa',
    letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8, marginBottom: 20,
  },
  item: {
    borderRadius: 14,
    padding: '10px 4px 8px',
    textAlign: 'center',
    position: 'relative',
    transition: 'all 0.18s ease',
  },
  itemEmoji: { fontSize: 26, marginBottom: 4, lineHeight: 1, transition: 'opacity 0.2s' },
  itemName: { fontSize: 10, fontWeight: 700, lineHeight: 1.2, marginBottom: 3 },
  // Locked state
  hint: {
    fontSize: 9,
    color: '#aaa',
    lineHeight: 1.4,
    marginBottom: 4,
    wordBreak: 'keep-all',
  },
  progressBg: {
    height: 3, background: '#ebebef', borderRadius: 999, overflow: 'hidden',
    margin: '0 2px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    borderRadius: 999,
    transition: 'width 0.5s ease',
  },
  // Unlocked state
  equippedLabel: {
    fontSize: 9, color: '#667eea', fontWeight: 700, marginTop: 2,
  },
  equippedDot: (equipped) => ({
    position: 'absolute', top: 5, right: 5,
    width: 7, height: 7, borderRadius: '50%',
    background: equipped ? '#667eea' : 'transparent',
    boxShadow: equipped ? '0 0 4px #667eea' : 'none',
    transition: 'all 0.2s',
  }),
  doneBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    border: 'none', borderRadius: 14,
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginTop: 4,
  },
}
