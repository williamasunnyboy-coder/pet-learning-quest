import { useMemo } from 'react'
import { WEEKLY_GOAL as GOAL } from '../store'

function getWeekStart() {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

export default function WeeklyChallenge({ tasks, weeklyChallenge, onClaim }) {
  const weekStart = getWeekStart()

  const progress = useMemo(() =>
    (tasks || []).filter(t => t.status === 'confirmed' && t.date >= weekStart).length,
    [tasks, weekStart]
  )

  const pct      = Math.min(100, Math.round(progress / GOAL * 100))
  const complete = progress >= GOAL
  const claimed  = weeklyChallenge?.claimed && weeklyChallenge?.weekStart === weekStart

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={styles.title}>本周挑战</div>
          <div style={styles.sub}>完成 {GOAL} 个任务解锁奖励</div>
        </div>
        <div style={styles.counter}>
          <span style={{ ...styles.num, color: complete ? '#52c41a' : '#667eea' }}>{progress}</span>
          <span style={styles.total}>/{GOAL}</span>
        </div>
      </div>

      <div style={styles.barBg}>
        <div style={{
          ...styles.barFill,
          width: `${pct}%`,
          background: complete ? '#52c41a' : 'linear-gradient(90deg, #667eea, #764ba2)',
        }} />
      </div>

      {complete && !claimed && (
        <button style={styles.claimBtn} onClick={onClaim}>
          🎁 领取 +20 经验奖励
        </button>
      )}
      {claimed && (
        <div style={styles.claimedText}>✅ 本周奖励已领取！继续加油！</div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: 'linear-gradient(135deg, #f0f4ff, #e8f5e9)',
    borderRadius: 16,
    padding: '14px 16px',
  },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  icon: { fontSize: 26, flexShrink: 0 },
  title: { fontWeight: 700, fontSize: 14, color: '#333' },
  sub: { fontSize: 11, color: '#888', marginTop: 1 },
  counter: { display: 'flex', alignItems: 'baseline', flexShrink: 0 },
  num: { fontSize: 22, fontWeight: 800 },
  total: { fontSize: 13, color: '#aaa' },
  barBg: { height: 10, background: '#e0e0ea', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, transition: 'width 0.55s ease' },
  claimBtn: {
    marginTop: 10, width: '100%', padding: '10px',
    background: 'linear-gradient(135deg, #52c41a, #95de64)',
    border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
  },
  claimedText: {
    marginTop: 8, textAlign: 'center', fontSize: 13, color: '#52c41a', fontWeight: 600,
  },
}
