/**
 * ModeSelect — 三种模式选择卡片
 *
 * 家庭模式      MODE.FAMILY       家长布置 + 确认，无学校参与
 * 校园模式      MODE.CAMPUS       教师布置，学生完成即得奖励，家长只读观察
 * 家校联合模式  MODE.SCHOOL_HOME  教师 + 家长双向管理，完整三方协作
 */
import { MODE, MODE_LIST } from '../constants/modes'

export const MODE_META = {
  [MODE.FAMILY]: {
    id: MODE.FAMILY,
    icon: '🏠',
    label: '家庭模式',
    tagline: '亲子专属空间',
    desc: '家长为孩子布置任务，孩子完成后家长确认，宠物一起成长。简单纯粹，不需要学校参与。',
    color: '#faad14',
    gradient: 'linear-gradient(135deg, #fffbe6, #fff8d0)',
    border: '#ffd666',
    features: ['🐾 家长自定义任务', '✅ 家长一键确认', '📊 家庭成长报告', '🔒 家长 PIN 保护'],
    needs: null,
  },
  [MODE.CAMPUS]: {
    id: MODE.CAMPUS,
    icon: '🏫',
    label: '校园模式',
    tagline: '课堂专用，教师直接带班',
    desc: '教师通过班级码布置作业，学生完成后立即获得奖励，无需家长介入。适合课堂内使用。',
    color: '#667eea',
    gradient: 'linear-gradient(135deg, #f0f4ff, #e8efff)',
    border: '#b0c4ff',
    features: ['📋 教师班级码作业', '⚡ 完成即得奖励', '🏆 班级学习排行', '👁 家长只读观察'],
    needs: 'classCode',
  },
  [MODE.SCHOOL_HOME]: {
    id: MODE.SCHOOL_HOME,
    icon: '🤝',
    label: '家校联合模式',
    tagline: '三方协作，效果最大化',
    desc: '教师布置 + 家长管理 + 孩子完成，进度在家校之间实时流通，全方位守护孩子成长。',
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #f6ffed, #e8f9e0)',
    border: '#95de64',
    features: ['📋 教师作业自动推送', '✅ 家长确认同步教师', '🏠 家长自定义任务', '📢 家校公告联动'],
    needs: 'classCode',
  },
}

export const MODE_ORDER = MODE_LIST

export default function ModeSelect({ selected, onChange }) {
  return (
    <div style={S.wrap}>
      <div style={S.heading}>选择使用模式</div>
      <div style={S.sub}>模式决定谁来布置任务、谁来确认完成，之后可以在设置里修改</div>
      <div style={S.grid}>
        {MODE_ORDER.map(key => {
          const m = MODE_META[key]
          const active = selected === key
          return (
            <button
              key={key}
              style={{
                ...S.card,
                background: active ? m.gradient : '#fafafa',
                border: active ? `2.5px solid ${m.color}` : '2.5px solid #eee',
                transform: active ? 'scale(1.02)' : 'scale(1)',
                boxShadow: active ? `0 6px 24px ${m.color}33` : '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onClick={() => onChange(key)}
            >
              {/* 右上角选中 dot */}
              <div style={{
                ...S.dot,
                background: active ? m.color : '#e0e0e0',
                boxShadow: active ? `0 0 8px ${m.color}88` : 'none',
              }} />

              <div style={S.icon}>{m.icon}</div>
              <div style={{ ...S.label, color: active ? m.color : '#1a1a2e' }}>{m.label}</div>
              <div style={S.tagline}>{m.tagline}</div>
              <div style={S.divider} />
              <ul style={S.features}>
                {m.features.map(f => (
                  <li key={f} style={S.feature}>{f}</li>
                ))}
              </ul>
              {m.needs === 'classCode' && (
                <div style={{ ...S.needsTag, background: active ? m.color : '#f0f0f0', color: active ? '#fff' : '#aaa' }}>
                  需要班级码
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const S = {
  wrap: { width: '100%' },
  heading: { fontSize: 18, fontWeight: 800, color: '#1a1a2e', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 },
  grid: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    borderRadius: 18,
    padding: '16px 18px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.22s ease',
    position: 'relative',
    width: '100%',
    fontFamily: 'inherit',
  },
  dot: {
    position: 'absolute', top: 14, right: 14,
    width: 12, height: 12, borderRadius: '50%',
    transition: 'all 0.2s',
  },
  icon: { fontSize: 28, marginBottom: 6 },
  label: { fontSize: 16, fontWeight: 800, marginBottom: 2, transition: 'color 0.2s' },
  tagline: { fontSize: 12, color: '#888', marginBottom: 10 },
  divider: { height: 1, background: '#f0f0f0', margin: '8px 0' },
  features: {
    listStyle: 'none',
    padding: 0, margin: 0,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 0',
  },
  feature: { fontSize: 12, color: '#555', padding: '2px 0' },
  needsTag: {
    display: 'inline-block',
    fontSize: 11, fontWeight: 700,
    padding: '3px 10px', borderRadius: 999,
    marginTop: 10,
    transition: 'all 0.2s',
  },
}
