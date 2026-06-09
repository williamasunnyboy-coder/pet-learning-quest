/**
 * PaywallModal —— 稀有宠物会员付费墙
 *
 * 借鉴 Prodigy 模式：基础宠物免费，稀有 / 限定宠物需开通会员。
 * 这是演示版：「开通会员」按钮直接解锁；真实产品应接入支付。
 */
const BENEFITS = [
  { icon: '🐉', label: '解锁全部稀有 & 限定宠物', desc: '白虎、朱雀等神兽 + 节日限定' },
  { icon: '🎀', label: '专属装扮与道具', desc: '更多帽子 / 光环 / 徽章' },
  { icon: '👨‍👩‍👧', label: '多孩子档案', desc: '最多 3 个孩子分别养成' },
  { icon: '📊', label: '月度成长分析报告', desc: '可打印 / 分享给家人' },
]

export default function PaywallModal({ petName, onUnlock, onClose }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div
        style={S.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        <button style={S.close} onClick={onClose} aria-label="关闭">✕</button>

        <div style={S.crown}>👑</div>
        <div id="paywall-title" style={S.title}>开通会员，解锁稀有宠物</div>
        <div style={S.sub}>
          {petName ? <>「<b>{petName}</b>」是会员专属稀有宠物</> : '会员专属稀有宠物'}
          ，开通后即可选择养成
        </div>

        <div style={S.benefits}>
          {BENEFITS.map(b => (
            <div key={b.label} style={S.benefitRow}>
              <span style={S.benefitIcon} aria-hidden="true">{b.icon}</span>
              <div>
                <div style={S.benefitLabel}>{b.label}</div>
                <div style={S.benefitDesc}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={S.priceRow}>
          <span style={S.price}>¥18</span>
          <span style={S.priceUnit}>/ 月</span>
          <span style={S.priceNote}>· 随时可取消</span>
        </div>

        <button style={S.unlockBtn} onClick={onUnlock}>
          ✨ 开通会员（演示版直接解锁）
        </button>
        <button style={S.laterBtn} onClick={onClose}>暂不，先用免费宠物</button>
      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10,10,30,0.78)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 24,
    padding: '32px 24px 24px',
    maxWidth: 360, width: '100%',
    textAlign: 'center', position: 'relative',
    boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
  },
  close: {
    position: 'absolute', top: 12, right: 14,
    background: 'none', border: 'none',
    fontSize: 20, color: '#bbb', cursor: 'pointer', lineHeight: 1,
  },
  crown: { fontSize: 44, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 },
  sub: { fontSize: 13, color: '#777', marginBottom: 20, lineHeight: 1.6 },
  benefits: {
    display: 'flex', flexDirection: 'column', gap: 12,
    textAlign: 'left', marginBottom: 20,
    background: '#fffaf0', border: '1px solid #ffe7ba',
    borderRadius: 14, padding: '16px 16px',
  },
  benefitRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  benefitIcon: { fontSize: 24, flexShrink: 0, lineHeight: 1.2 },
  benefitLabel: { fontSize: 14, fontWeight: 700, color: '#1a1a2e' },
  benefitDesc: { fontSize: 12, color: '#999', marginTop: 1 },
  priceRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 16 },
  price: { fontSize: 30, fontWeight: 800, color: '#fa8c16' },
  priceUnit: { fontSize: 14, color: '#fa8c16', fontWeight: 700 },
  priceNote: { fontSize: 12, color: '#aaa', marginLeft: 4 },
  unlockBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #ffd200, #f7931e)',
    color: '#5a3a00', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    marginBottom: 10,
  },
  laterBtn: {
    width: '100%', padding: '10px',
    background: 'transparent', color: '#999',
    border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
}
