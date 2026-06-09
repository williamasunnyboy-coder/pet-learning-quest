import { getEarnedAchievements, PET_TYPES, getPetImageUrl } from '../store'

export default function MonthlyReport({ state, onClose }) {
  const { childName, pet, petType, petStage, streak, bestStreak, monthlyStats } = state
  const petDef  = PET_TYPES[petType] || PET_TYPES['west-highland']
  const stageDef = petDef.stages[petStage]
  const imgUrl   = getPetImageUrl(petType, petStage)

  const achievements  = getEarnedAchievements(state)
  const earnedAch     = achievements.filter(a => a.earned)
  const completedPct  = monthlyStats?.rate || 0
  const confirmed     = monthlyStats?.confirmed || 0

  // Date range
  const now  = new Date()
  const ago  = new Date(now); ago.setDate(ago.getDate() - 30)
  const fmt  = d => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  const dateRange = `${fmt(ago)} — ${fmt(now)}`

  // Motivational tagline
  const tagline =
    streak >= 14 ? `🔥 ${childName}已坚持 ${streak} 天，超厉害！` :
    completedPct >= 80 ? `🌟 完成率 ${completedPct}%，${pet.name}为你骄傲！` :
    earnedAch.length >= 3 ? `🏆 已解锁 ${earnedAch.length} 个成就，继续加油！` :
    `✨ 每天一小步，${pet.name}和你一起成长！`

  async function handleShare() {
    const lines = [
      `🐾 ${childName}的宠物学习报告`,
      `📅 ${dateRange}`,
      ``,
      `🐾 宠物：${pet.name}（${stageDef?.name || ''}）`,
      `✅ 完成任务：${confirmed} 个  完成率：${completedPct}%`,
      `🔥 当前连打卡：${streak} 天  最高：${bestStreak} 天`,
      `🏆 解锁成就：${earnedAch.length} / ${achievements.length} 个`,
    ]
    if (earnedAch.length > 0) {
      lines.push(`   ${earnedAch.map(a => a.emoji + a.name).join('  ')}`)
    }
    lines.push(``, tagline, ``, `📱 来自「宠物学习助手」`)
    const text = lines.join('\n')

    try {
      if (navigator.share) {
        await navigator.share({ title: `${childName}的学习报告`, text })
      } else {
        await navigator.clipboard.writeText(text)
        alert('报告内容已复制！可粘贴到微信或朋友圈分享 📤')
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.wrapper} onClick={e => e.stopPropagation()}>

        {/* ── Report card ─────────────────────────── */}
        <div style={{ ...S.card, borderTop: `5px solid ${petDef.themeAccent}` }}>

          {/* Brand header */}
          <div style={S.cardHead}>
            <span style={{ ...S.brandChip, background: petDef.themeAccent }}>
              🐾 宠物学习助手
            </span>
            <span style={S.dateRange}>{dateRange}</span>
          </div>

          {/* Pet + child */}
          <div style={S.petRow}>
            <div style={{ ...S.petCircle, background: petDef.theme }}>
              <img src={imgUrl} alt={pet.name} style={S.petImg} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.reportName}>{childName}的成长报告</div>
              <div style={S.petMeta}>{pet.name} · {stageDef?.name}</div>
              <span style={{ ...S.stageTag, background: petDef.themeAccent }}>
                第 {petStage + 1} 阶段
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div style={S.statsGrid}>
            {[
              { v: confirmed,     u: '个', l: '完成任务',   c: '#52c41a' },
              { v: completedPct,  u: '%',  l: '完成率',
                c: completedPct >= 80 ? '#52c41a' : completedPct >= 50 ? '#faad14' : '#f5222d' },
              { v: bestStreak,    u: '天', l: '最高连打卡', c: '#ff6b35' },
              { v: streak,        u: '天', l: '当前连打卡', c: '#667eea' },
            ].map(s => (
              <div key={s.l} style={S.statBox}>
                <div style={{ ...S.statNum, color: s.c }}>
                  {s.v}<span style={S.statUnit}>{s.u}</span>
                </div>
                <div style={S.statLabel}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Completion bar */}
          <div style={S.barWrap}>
            <div style={S.barBg}>
              <div style={{
                ...S.barFill,
                width: `${completedPct}%`,
                background: `linear-gradient(90deg, ${petDef.themeAccent}, #764ba2)`,
              }} />
            </div>
            <span style={{ fontSize: 12, color: '#aaa', marginLeft: 8, flexShrink: 0 }}>
              近30天
            </span>
          </div>

          {/* Category breakdown */}
          {monthlyStats?.byCategory && Object.keys(monthlyStats.byCategory).length > 0 && (
            <div style={S.catSection}>
              {Object.entries(monthlyStats.byCategory).map(([cat, v]) => (
                <div key={cat} style={S.catRow}>
                  <span style={S.catLabel}>{cat}</span>
                  <div style={S.catBg}>
                    <div style={{
                      ...S.catFill,
                      width: `${v.total > 0 ? Math.round(v.done / v.total * 100) : 0}%`,
                      background: petDef.themeAccent,
                    }} />
                  </div>
                  <span style={S.catNum}>{v.done}/{v.total}</span>
                </div>
              ))}
            </div>
          )}

          {/* Achievements */}
          {earnedAch.length > 0 && (
            <div style={S.achWrap}>
              <div style={S.achTitle}>🏆 已解锁成就 {earnedAch.length}/{achievements.length}</div>
              <div style={S.achRow}>
                {earnedAch.map(a => (
                  <div key={a.id} style={S.achBadge} title={a.name}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <span style={S.achName}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tagline */}
          <div style={{ ...S.tagline, borderColor: petDef.themeAccent + '44' }}>
            {tagline}
          </div>
        </div>

        {/* ── Buttons ─────────────────────────────── */}
        <div style={S.btnRow}>
          <button style={S.shareBtn} onClick={handleShare}>📤 分享报告</button>
          <button style={S.closeBtn} onClick={onClose}>关闭</button>
        </div>
        <div style={S.hint}>长按卡片截图可保存到相册</div>
      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10,10,30,0.78)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1600, padding: '20px 16px', overflowY: 'auto',
  },
  wrapper: {
    width: '100%', maxWidth: 380,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  card: {
    background: '#fff',
    borderRadius: 22,
    padding: '20px 18px 16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  cardHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  brandChip: {
    color: '#fff', borderRadius: 999,
    padding: '3px 12px', fontSize: 11, fontWeight: 800,
  },
  dateRange: { fontSize: 10, color: '#bbb' },
  petRow: { display: 'flex', gap: 14, alignItems: 'center' },
  petCircle: {
    width: 70, height: 70, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  },
  petImg: { width: 62, height: 62, objectFit: 'contain' },
  reportName: { fontSize: 17, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.3 },
  petMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  stageTag: {
    display: 'inline-block', borderRadius: 999,
    padding: '2px 10px', fontSize: 11, color: '#fff', fontWeight: 700, marginTop: 4,
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
  },
  statBox: {
    background: '#f8f8fc', borderRadius: 12,
    padding: '10px 4px', textAlign: 'center',
  },
  statNum: { fontSize: 19, fontWeight: 800, lineHeight: 1 },
  statUnit: { fontSize: 11, fontWeight: 600 },
  statLabel: { fontSize: 10, color: '#aaa', marginTop: 3 },
  barWrap: { display: 'flex', alignItems: 'center' },
  barBg: { flex: 1, height: 8, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, transition: 'width 0.6s ease' },
  catSection: { display: 'flex', flexDirection: 'column', gap: 6 },
  catRow: { display: 'flex', alignItems: 'center', gap: 8 },
  catLabel: { width: 32, fontSize: 12, color: '#555', fontWeight: 700, flexShrink: 0 },
  catBg: { flex: 1, height: 7, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 999 },
  catNum: { width: 34, fontSize: 11, color: '#aaa', textAlign: 'right', flexShrink: 0 },
  achWrap: {},
  achTitle: { fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 },
  achRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  achBadge: {
    background: '#fffbe6', border: '1.5px solid #ffe58f',
    borderRadius: 10, padding: '6px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44,
  },
  achName: { fontSize: 9, color: '#666', marginTop: 2, fontWeight: 700, lineHeight: 1.2, textAlign: 'center' },
  tagline: {
    background: '#fffdf5',
    border: '1.5px solid',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13, color: '#4e342e', lineHeight: 1.6, fontWeight: 600, textAlign: 'center',
  },
  btnRow: { display: 'flex', gap: 10 },
  shareBtn: {
    flex: 1, padding: '13px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    border: 'none', borderRadius: 14,
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  closeBtn: {
    padding: '13px 20px',
    background: 'rgba(255,255,255,0.15)',
    border: '1.5px solid rgba(255,255,255,0.35)',
    borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  hint: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
}
