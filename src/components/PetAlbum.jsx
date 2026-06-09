import { getPetImageUrl, PET_TYPES } from '../store'

export default function PetAlbum({ evolutionLog, petType }) {
  if (!evolutionLog?.length) {
    return (
      <div style={styles.empty}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
        <div>进化后将自动记录成长照片</div>
      </div>
    )
  }

  const petDef = PET_TYPES[petType] || PET_TYPES['west-highland']

  return (
    <div style={styles.list}>
      {evolutionLog.map((entry, i) => {
        const imgUrl = getPetImageUrl(petType, entry.stage)
        const stageName = petDef.stages[entry.stage]?.name || `第 ${entry.stage + 1} 阶段`
        return (
          <div key={i} style={styles.card}>
            <img src={imgUrl} alt={entry.petName} style={styles.img} />
            <div style={styles.petName}>{entry.petName}</div>
            <div style={styles.stageName}>{stageName}</div>
            <div style={styles.date}>{entry.date}</div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  list: { display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 },
  card: {
    flexShrink: 0,
    width: 88,
    background: '#f8f8fc',
    borderRadius: 16,
    padding: '10px 8px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  img: { width: 60, height: 60, objectFit: 'contain', display: 'block', margin: '0 auto' },
  petName: { fontSize: 12, fontWeight: 700, color: '#1a1a2e', marginTop: 6 },
  stageName: { fontSize: 10, color: '#667eea', marginTop: 2, fontWeight: 600 },
  date: { fontSize: 9, color: '#bbb', marginTop: 3 },
  empty: { textAlign: 'center', padding: '20px 0', color: '#aaa', fontSize: 13 },
}
