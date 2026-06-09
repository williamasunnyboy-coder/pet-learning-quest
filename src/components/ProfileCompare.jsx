import { PET_TYPES, getPetImageUrl } from '../store'

export default function ProfileCompare({ snapshots, onClose }) {
  if (!snapshots?.length) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.card} onClick={e => e.stopPropagation()}>
          <div style={styles.title}>📊 档案对比</div>
          <div style={{ textAlign: 'center', color: '#aaa', padding: '20px 0' }}>暂无其他档案可对比</div>
          <button style={styles.closeBtn} onClick={onClose}>关闭</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>📊 档案对比</div>

        <div style={styles.grid}>
          {snapshots.map(s => {
            const petDef = PET_TYPES[s.petType] || PET_TYPES['west-highland']
            const imgUrl = getPetImageUrl(s.petType, s.petStage)
            return (
              <div key={s.id} style={{ ...styles.col, background: petDef.theme }}>
                <div style={styles.avatarWrap}>
                  <img src={imgUrl} alt={s.petName} style={styles.petImg} />
                </div>
                <div style={styles.profileName}>{s.label}</div>
                <div style={styles.childName}>{s.childName}</div>
                <div style={styles.statRow}>
                  <div style={styles.stat}>
                    <div style={{ ...styles.statVal, color: petDef.themeAccent }}>{s.exp}</div>
                    <div style={styles.statLabel}>经验</div>
                  </div>
                  <div style={styles.stat}>
                    <div style={{ ...styles.statVal, color: petDef.themeAccent }}>{s.streak}</div>
                    <div style={styles.statLabel}>连打天</div>
                  </div>
                </div>
                <div style={{ ...styles.stageBadge, color: petDef.themeAccent }}>
                  {petDef.emoji} {petDef.stages[s.petStage]?.name || ''}
                </div>
              </div>
            )
          })}
        </div>

        <button style={styles.closeBtn} onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10,10,30,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: 20,
  },
  card: {
    background: '#fff', borderRadius: 22,
    padding: '22px 20px 18px',
    maxWidth: 400, width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
  },
  title: { fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, textAlign: 'center' },
  grid: { display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 },
  col: {
    flex: '0 0 128px',
    borderRadius: 16,
    padding: '14px 10px',
    textAlign: 'center',
  },
  avatarWrap: {
    width: 72, height: 72,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto',
    overflow: 'hidden',
  },
  petImg: { width: 64, height: 64, objectFit: 'contain' },
  profileName: { fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginTop: 8 },
  childName: { fontSize: 11, color: '#888', marginTop: 2 },
  statRow: { display: 'flex', justifyContent: 'center', gap: 14, margin: '10px 0 8px' },
  stat: { textAlign: 'center' },
  statVal: { fontSize: 20, fontWeight: 800 },
  statLabel: { fontSize: 10, color: '#888' },
  stageBadge: {
    fontSize: 11, background: 'rgba(0,0,0,0.05)',
    borderRadius: 999, padding: '3px 10px', fontWeight: 700,
  },
  closeBtn: {
    marginTop: 16, width: '100%', padding: '12px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
}
