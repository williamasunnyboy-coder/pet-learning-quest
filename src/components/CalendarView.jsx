import { useMemo } from 'react'

function dayKey(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function cellColor(rate) {
  if (rate < 0) return '#f0f0f5'       // no tasks that day
  if (rate === 0) return '#ffd7d7'     // tasks but none confirmed
  if (rate < 0.5) return '#b5d5ff'    // some confirmed
  if (rate < 1)   return '#667eea'    // most confirmed
  return '#52c41a'                     // all confirmed
}

const LEGEND = [
  ['#f0f0f5', '无任务'],
  ['#ffd7d7', '未完成'],
  ['#b5d5ff', '部分'],
  ['#667eea', '大部分'],
  ['#52c41a', '全部'],
]

export default function CalendarView({ tasks }) {
  const heatmap = useMemo(() => {
    const byDate = {}
    ;(tasks || []).forEach(t => {
      if (!byDate[t.date]) byDate[t.date] = { total: 0, done: 0 }
      byDate[t.date].total++
      if (t.status === 'confirmed') byDate[t.date].done++
    })
    // Build 84 cells (12 weeks × 7 days), oldest first
    return Array.from({ length: 84 }, (_, i) => {
      const key = dayKey(83 - i)
      const d = byDate[key] || { total: 0, done: 0 }
      return {
        key,
        rate: d.total > 0 ? d.done / d.total : -1,
        label: `${key}  ${d.done}/${d.total}`,
      }
    })
  }, [tasks])

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>📅 84 天打卡热力图</div>
      <div style={styles.grid}>
        {heatmap.map(cell => (
          <div
            key={cell.key}
            title={cell.label}
            style={{ ...styles.cell, background: cellColor(cell.rate) }}
          />
        ))}
      </div>
      <div style={styles.legend}>
        {LEGEND.map(([color, label]) => (
          <div key={color} style={styles.legendItem}>
            <div style={{ ...styles.dot, background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrap: { marginTop: 14, background: '#f8f8fc', borderRadius: 14, padding: '12px 14px' },
  title: { fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: 3,
  },
  cell: { aspectRatio: '1', borderRadius: 3, minWidth: 0 },
  legend: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#888' },
  dot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },
}
