/**
 * 班级花园 —— 同班学生的宠物匿名展示
 *
 * 设计原则：
 *   ① 不显示真实姓名（只取首字 + 宠物名）
 *   ② 不显示具体经验值（只显示进化阶段名）
 *   ③ 不做排名（按进入时间倒序）
 *   ④ 目的：让孩子知道"有同学也在和我一起养宠物"，避免攀比焦虑
 */
import { useState, useEffect } from 'react'
import { bridgeGetPeers } from '../teacher-bridge'
import { PET_TYPES, getPetImageUrl } from '../store'

export default function ClassGarden({ classCode, currentProfileId, onClose }) {
  const [peers, setPeers] = useState(() => bridgeGetPeers(classCode))
  // 「今日活跃」判定用的当前时刻：随每次刷新更新，避免在 render 中调用 Date.now()
  const [renderedAt, setRenderedAt] = useState(() => Date.now())

  // 监听变化（其他同学也在打卡时实时刷新）
  useEffect(() => {
    function refresh() {
      setPeers(bridgeGetPeers(classCode))
      setRenderedAt(Date.now())
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('pet-class-link-changed', refresh)
    const tick = setInterval(refresh, 8000)   // 8 秒兜底刷新
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('pet-class-link-changed', refresh)
      clearInterval(tick)
    }
  }, [classCode])

  const entries = Object.entries(peers)
    .filter(([id]) => id !== currentProfileId)        // 排除自己
    .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="garden-title">
        <button style={S.closeBtn} onClick={onClose} aria-label="关闭班级花园">✕</button>
        <div id="garden-title" style={S.header}>
          <div style={{ fontSize: 24 }}>🌳</div>
          <div>
            <div style={S.title}>班级花园</div>
            <div style={S.subtitle}>看看同学的宠物长得怎么样啦</div>
          </div>
        </div>

        {entries.length === 0 && (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
            <div style={S.emptyTitle}>这里还没有别的同学</div>
            <div style={S.emptyText}>
              当同班同学打开 App 时，他们的宠物会自动出现在这里
            </div>
          </div>
        )}

        <div style={S.grid}>
          {entries.map(([id, peer]) => {
            const def = PET_TYPES[peer.petType] || PET_TYPES['west-highland']
            const stageName = def.stages[peer.petStage]?.name || '幼年期'
            const isActive = renderedAt - (peer.updatedAt || 0) < 24 * 60 * 60 * 1000
            return (
              <div key={id} style={{ ...S.card, background: def.theme, borderColor: def.themeAccent + '44' }}>
                {isActive && <span style={S.activeDot} title="今日活跃" aria-label="今日活跃" />}
                <img
                  src={getPetImageUrl(peer.petType, peer.petStage)}
                  alt={`${peer.petName}`}
                  style={S.petImg}
                />
                <div style={S.petName}>{peer.petName || def.name}</div>
                <div style={S.ownerLine}>
                  <span style={{ color: def.themeAccent, fontWeight: 700 }}>{peer.childInitial || '?'}</span> 同学
                </div>
                <div style={S.stageChip}>{stageName}</div>
                {peer.streak > 0 && (
                  <div style={S.streakLine}>🔥 连击 {peer.streak} 天</div>
                )}
              </div>
            )
          })}
        </div>

        <div style={S.footer}>
          <div>🌟 共 {entries.length} 位同学在养宠物</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
            匿名展示，无排名比较，大家一起成长
          </div>
        </div>
      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(20,20,40,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2100, padding: 18,
  },
  modal: {
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fff4 100%)',
    borderRadius: 24, padding: '24px 22px 18px',
    maxWidth: 480, width: '100%',
    maxHeight: '85vh', overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
    fontFamily: 'inherit',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16,
    background: 'rgba(0,0,0,0.05)', border: 'none', fontSize: 16,
    color: '#888', cursor: 'pointer',
    width: 28, height: 28, borderRadius: '50%',
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 800, color: '#1a1a2e' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    marginBottom: 12,
  },
  card: {
    border: '2px solid', borderRadius: 16,
    padding: '14px 10px 12px',
    textAlign: 'center', position: 'relative',
  },
  activeDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: '50%',
    background: '#52c41a',
    boxShadow: '0 0 6px #52c41a88',
  },
  petImg: {
    width: 70, height: 70,
    objectFit: 'contain',
    display: 'block', margin: '0 auto 4px',
  },
  petName: { fontSize: 14, fontWeight: 800, color: '#1a1a2e' },
  ownerLine: { fontSize: 11, color: '#888', marginTop: 2 },
  stageChip: {
    display: 'inline-block', marginTop: 6,
    fontSize: 10, fontWeight: 700,
    padding: '2px 8px', borderRadius: 999,
    background: 'rgba(255,255,255,0.7)', color: '#555',
  },
  streakLine: { fontSize: 11, color: '#fa8c16', marginTop: 4, fontWeight: 700 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#aaa' },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: '#888' },
  emptyText: { fontSize: 12, marginTop: 6, lineHeight: 1.5 },
  footer: {
    textAlign: 'center',
    padding: '10px 0 4px',
    fontSize: 12, color: '#888',
    borderTop: '1px dashed #eee',
    marginTop: 10,
  },
}
