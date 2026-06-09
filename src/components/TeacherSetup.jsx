import { useState } from 'react'
import { generateCode } from '../teacher-store'

export default function TeacherSetup({ onSetup }) {
  const [step, setStep]           = useState(1)
  const [version, setVersion]     = useState(null)
  const [teacherName, setTeacherName] = useState('')
  const [school, setSchool]       = useState('')
  const [subject, setSubject]     = useState('语文')
  const [className, setClassName] = useState('')

  function handleVersionSelect(v) {
    setVersion(v)
    setStep(2)
  }

  function handleFinish(e) {
    e.preventDefault()
    if (!teacherName.trim() || !school.trim() || !className.trim()) return
    const classCode = version === 'B' ? generateCode() : null
    onSetup({
      initialized: true,
      version,
      teacherName: teacherName.trim(),
      school: school.trim(),
      subject,
      currentClassId: 'c1',
      classes: [{
        id: 'c1',
        name: className.trim(),
        code: classCode,
        students: [],
      }],
      assignments: [],
      announcements: [],
    })
  }

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        {step === 1 ? (
          <>
            <div style={S.logo}>🏫</div>
            <div style={S.title}>教师管理端</div>
            <div style={S.sub}>请选择使用版本</div>

            <div style={S.versionGrid}>
              {/* Version A */}
              <button style={S.versionCard} onClick={() => handleVersionSelect('A')}>
                <div style={S.versionBadge('#667eea')}>A 版</div>
                <div style={S.versionTitle}>教师独立版</div>
                <div style={S.versionDesc}>教师独立管理班级，手动追踪完成情况，适合不需要家长端配合的场景</div>
                <ul style={S.featureList}>
                  <li>✓ 班级学生管理</li>
                  <li>✓ 作业布置与追踪</li>
                  <li>✓ 完成率数据统计</li>
                  <li>✓ 班级报告导出</li>
                </ul>
                <div style={{ ...S.selectBtn, background: '#667eea' }}>选择 A 版 →</div>
              </button>

              {/* Version B */}
              <button style={{ ...S.versionCard, borderColor: '#52c41a' }} onClick={() => handleVersionSelect('B')}>
                <div style={S.versionBadge('#52c41a')}>B 版</div>
                <div style={S.versionTitle}>家校联合版</div>
                <div style={S.versionDesc}>教师布置作业，家长在宠物APP内完成确认，进度自动同步回教师端</div>
                <ul style={S.featureList}>
                  <li>✓ 所有 A 版功能</li>
                  <li>✓ 班级码连接家长</li>
                  <li>✓ 家长确认自动同步</li>
                  <li>✓ 家校沟通公告</li>
                </ul>
                <div style={{ ...S.selectBtn, background: '#52c41a' }}>选择 B 版 →</div>
              </button>
            </div>
          </>
        ) : (
          <>
            <button style={S.back} onClick={() => setStep(1)}>← 返回</button>
            <div style={S.logo}>{version === 'A' ? '📋' : '🤝'}</div>
            <div style={S.title}>
              {version === 'A' ? '教师独立版' : '家校联合版'}
              <span style={{ ...S.badge, background: version === 'A' ? '#667eea' : '#52c41a' }}>
                {version} 版
              </span>
            </div>
            <form onSubmit={handleFinish} style={S.form}>
              <label style={S.label}>教师姓名</label>
              <input
                style={S.input}
                placeholder="例如：王老师"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                required
              />
              <label style={S.label}>学校名称</label>
              <input
                style={S.input}
                placeholder="例如：实验小学"
                value={school}
                onChange={e => setSchool(e.target.value)}
                required
              />
              <label style={S.label}>任教科目</label>
              <select style={S.select} value={subject} onChange={e => setSubject(e.target.value)}>
                {['语文','数学','英语','科学','体育','美术','音乐','综合'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <label style={S.label}>第一个班级名称</label>
              <input
                style={S.input}
                placeholder="例如：三年级2班"
                value={className}
                onChange={e => setClassName(e.target.value)}
                required
              />
              {version === 'B' && (
                <div style={S.tipBox}>
                  💡 创建后系统自动生成<strong>班级码</strong>，发给家长扫码或输入即可与宠物APP联动
                </div>
              )}
              <button
                style={{ ...S.submitBtn, background: version === 'A' ? '#667eea' : '#52c41a' }}
                type="submit"
              >
                开始使用 {version === 'A' ? '📋' : '🤝'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const S = {
  overlay: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '36px 28px',
    maxWidth: 580,
    width: '100%',
    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
    textAlign: 'center',
    position: 'relative',
  },
  back: {
    position: 'absolute', top: 16, left: 16,
    background: 'none', border: 'none',
    fontSize: 14, color: '#888', cursor: 'pointer',
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 22, fontWeight: 800, color: '#1a1a2e',
    marginBottom: 6, display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  sub: { fontSize: 14, color: '#888', marginBottom: 28 },
  badge: {
    color: '#fff', fontSize: 13, fontWeight: 700,
    padding: '2px 10px', borderRadius: 999,
  },
  versionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  versionCard: {
    background: '#fafafa',
    border: '2px solid #667eea',
    borderRadius: 18,
    padding: '20px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  versionBadge: bg => ({
    display: 'inline-block',
    background: bg,
    color: '#fff',
    fontSize: 11, fontWeight: 800,
    padding: '2px 8px', borderRadius: 999,
    alignSelf: 'flex-start',
  }),
  versionTitle: { fontSize: 16, fontWeight: 800, color: '#1a1a2e' },
  versionDesc: { fontSize: 12, color: '#666', lineHeight: 1.5 },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: 12,
    color: '#444',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  selectBtn: {
    color: '#fff', fontWeight: 700,
    fontSize: 13, borderRadius: 8,
    padding: '8px 0', textAlign: 'center',
    marginTop: 4,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' },
  label: { fontSize: 13, fontWeight: 700, color: '#555' },
  input: {
    padding: '11px 14px',
    borderRadius: 12,
    border: '2px solid #eee',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  select: {
    padding: '11px 14px',
    borderRadius: 12,
    border: '2px solid #eee',
    fontSize: 15,
    background: '#fff',
    fontFamily: 'inherit',
  },
  tipBox: {
    background: '#f6ffed',
    border: '1.5px solid #b7eb8f',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#389e0d',
    lineHeight: 1.5,
  },
  submitBtn: {
    marginTop: 8,
    padding: '14px',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
}
