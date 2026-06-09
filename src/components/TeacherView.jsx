import { useState } from 'react'
import {
  saveTeacherData, clearTeacherData,
  publishClassLink, getClassLinks, getCompletionCount,
  generateCode, SUBJECTS, TASK_ICONS_T, today,
  getClassPeers,
} from '../teacher-store'
import { PET_TYPES, getPetImageUrl } from '../store'

// ─── 顶层：带数据绑定的容器 ────────────────────────
export default function TeacherView({ data, onDataChange }) {
  const [tab, setTab] = useState('class')

  function update(partial) {
    const next = { ...data, ...partial }
    saveTeacherData(next)
    onDataChange(next)
  }

  // B版：每次保存时同步更新班级码共享层
  function updateAndSync(partial) {
    const next = { ...data, ...partial }
    saveTeacherData(next)
    if (next.version === 'B') {
      const cls = next.classes.find(c => c.id === next.currentClassId)
      if (cls?.code) {
        publishClassLink(cls.code, {
          classId: cls.id,
          className: cls.name,
          teacherName: next.teacherName,
          assignments: next.assignments.filter(a => a.classId === cls.id),
        })
      }
    }
    onDataChange(next)
  }

  const currentClass = data.classes.find(c => c.id === data.currentClassId) || data.classes[0]
  const tabs = [
    { id: 'class',   label: '班级管理', icon: '👥', desc: '学生名册 + 班级切换' },
    { id: 'assign',  label: '布置作业', icon: '📋', desc: '当前班级的作业' },
    { id: 'petwall', label: '班级宠物墙', icon: '🐾', desc: '全班学生的宠物' },
    { id: 'stats',   label: '学习统计', icon: '📊', desc: '完成率与排行' },
    ...(data.version === 'B' ? [{ id: 'notice', label: '家校公告', icon: '📢', desc: '推送给家长' }] : []),
  ]

  return (
    <div style={S.shell}>
      {/* Top bar (顶部蓝紫色横幅) */}
      <div style={S.topbar}>
        <div style={S.brand}>
          <span style={{ fontSize: 22 }}>🏫</span>
          <div>
            <div style={S.brandTitle}>宠物班级管理台</div>
            <div style={S.brandSub}>Teacher Web · {data.version === 'A' ? '独立课堂版' : '家校联合版'}</div>
          </div>
        </div>
        <div style={S.topbarRight}>
          <div style={S.teacherChip}>
            <span style={{ ...S.versionBadge, background: data.version === 'A' ? '#667eea' : '#52c41a' }}>
              {data.version}版
            </span>
            <span style={{ marginLeft: 8 }}>{data.teacherName} · {data.subject}</span>
          </div>
          <a href="#" style={S.exitLink}>← 学员端</a>
        </div>
      </div>

      {/* 主体 = 左侧栏 + 右内容 */}
      <div style={S.body}>
        {/* 左侧栏 */}
        <aside style={S.sidebar}>
          {/* 班级切换器 */}
          <div style={S.sideSchoolBlock}>
            <div style={S.sideSchoolName}>{data.school}</div>
            <select
              style={S.sideClassSelect}
              value={data.currentClassId}
              onChange={e => update({ currentClassId: e.target.value })}
            >
              {data.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div style={S.sideStudentCount}>
              👥 {currentClass?.students?.length || 0} 名学生
            </div>
          </div>

          {/* 侧边导航 */}
          <nav style={S.sideNav} role="navigation" aria-label="教师功能导航">
            {tabs.map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  style={{
                    ...S.sideNavItem,
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#1a1a2e' : 'rgba(255,255,255,0.85)',
                    fontWeight: active ? 800 : 600,
                    boxShadow: active ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
                  }}
                  onClick={() => setTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                >
                  <span style={{ fontSize: 18, marginRight: 10 }} aria-hidden="true">{t.icon}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div>{t.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 400, opacity: active ? 0.6 : 0.7, marginTop: 1 }}>
                      {t.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* 底部重置按钮 */}
          <div style={S.sideFooter}>
            <button style={S.resetBtn} onClick={() => {
              if (window.__teacherResetConfirm) {
                clearTeacherData()
                onDataChange({ initialized: false })
              } else {
                window.__teacherResetConfirm = true
                setTimeout(() => { window.__teacherResetConfirm = false }, 3000)
                alert('再次点击"重置教师端"确认清空所有数据')
              }
            }}>重置教师端</button>
          </div>
        </aside>

        {/* 主内容 */}
        <main style={S.content}>
          <header style={S.contentHeader}>
            <div>
              <div style={S.crumb}>{currentClass?.name} · {tabs.find(t => t.id === tab)?.label}</div>
              <h1 style={S.contentTitle}>
                <span style={{ marginRight: 10 }}>{tabs.find(t => t.id === tab)?.icon}</span>
                {tabs.find(t => t.id === tab)?.label}
              </h1>
            </div>
          </header>

          <div style={S.contentBody}>
            {tab === 'class' && (
              <ClassTab data={data} currentClass={currentClass} update={updateAndSync} />
            )}
            {tab === 'assign' && (
              <AssignTab data={data} currentClass={currentClass} update={updateAndSync} />
            )}
            {tab === 'petwall' && (
              <PetWallTab data={data} currentClass={currentClass} />
            )}
            {tab === 'stats' && (
              <StatsTab data={data} currentClass={currentClass} />
            )}
            {tab === 'notice' && data.version === 'B' && (
              <NoticeTab data={data} currentClass={currentClass} update={updateAndSync} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 班级宠物墙 —— 教师视角看全班宠物
// ═══════════════════════════════════════════════════
function PetWallTab({ currentClass }) {
  // 「今日活跃」判定基准时刻，避免在 render 中直接调用 Date.now()
  const [now] = useState(() => Date.now())
  // 拉取所有班级的 peers 合集；按当前班级筛选
  const allPeers = currentClass?.code ? getClassPeers(currentClass.code) : {}
  const peersList = Object.entries(allPeers)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  if (!currentClass?.code) {
    return (
      <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', color: '#999' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔗</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>当前班级还没有班级码</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          需要把教师端切换到 B 版（家校联合）才能给班级分配班级码
        </div>
      </div>
    )
  }

  if (peersList.length === 0) {
    return (
      <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', color: '#999' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🌱</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#666' }}>暂无学生宠物</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          告诉学生 / 家长用班级码 <strong style={{ fontFamily: 'monospace', letterSpacing: 2, color: '#52c41a' }}>{currentClass.code}</strong> 加入班级<br/>
          他们打开 App 后，宠物会自动出现在这里
        </div>
      </div>
    )
  }

  // 统计：进化阶段分布
  const stageDist = peersList.reduce((acc, p) => {
    acc[p.petStage] = (acc[p.petStage] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部统计带 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        background: '#fff', borderRadius: 16, padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        {[
          { label: '已加入', value: peersList.length, color: '#52c41a' },
          { label: '今日活跃', value: peersList.filter(p => now - (p.updatedAt || 0) < 24*60*60*1000).length, color: '#667eea' },
          { label: '最高连击', value: Math.max(0, ...peersList.map(p => p.streak || 0)), color: '#fa8c16' },
          { label: '已进化', value: peersList.filter(p => (p.petStage || 0) >= 2).length, color: '#eb2f96' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 宠物卡片墙 */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>🐾 全班宠物</h2>
          <div style={{ fontSize: 12, color: '#999' }}>共 {peersList.length} 只 · 实时同步</div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 14,
        }}>
          {peersList.map(p => {
            const def = PET_TYPES[p.petType] || PET_TYPES['west-highland']
            const stageName = def.stages[p.petStage]?.name || '幼年期'
            const active = now - (p.updatedAt || 0) < 24*60*60*1000
            return (
              <div key={p.id} style={{
                background: def.theme,
                border: `1.5px solid ${def.themeAccent}44`,
                borderRadius: 14,
                padding: '14px 10px 12px',
                textAlign: 'center',
                position: 'relative',
              }}>
                {active && (
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#52c41a', boxShadow: '0 0 6px #52c41a88',
                  }} aria-label="今日活跃" />
                )}
                <img
                  src={getPetImageUrl(p.petType, p.petStage)}
                  alt={p.petName}
                  style={{ width: 80, height: 80, objectFit: 'contain', mixBlendMode: 'multiply', display: 'block', margin: '0 auto' }}
                />
                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, color: '#1a1a2e' }}>
                  {p.petName || def.name}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  <strong style={{ color: def.themeAccent }}>{p.childInitial || '?'}</strong> 同学
                </div>
                <div style={{
                  display: 'inline-block', marginTop: 6,
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.85)', color: '#555',
                }}>
                  {stageName}
                </div>
                {p.streak > 0 && (
                  <div style={{ fontSize: 10, color: '#fa8c16', marginTop: 4, fontWeight: 700 }}>
                    🔥 {p.streak} 天
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 进化阶段分布 */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800 }}>📈 进化阶段分布</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 100 }}>
          {[0,1,2,3].map(stage => {
            const count = stageDist[stage] || 0
            const pct = peersList.length ? (count / peersList.length) * 100 : 0
            return (
              <div key={stage} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{count}</div>
                <div style={{
                  width: '100%', minHeight: 4,
                  height: `${Math.max(pct, 4)}%`,
                  background: ['#bae7ff','#85a5ff','#9254de','#eb2f96'][stage],
                  borderRadius: 6,
                  transition: 'height 0.3s',
                }} />
                <div style={{ fontSize: 11, color: '#666', marginTop: 6, fontWeight: 700 }}>
                  {stage + 1} 阶
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Tab 1 — 班级管理
// ═══════════════════════════════════════════════════
function ClassTab({ data, currentClass, update }) {
  const [newName, setNewName]     = useState('')
  const [addClsName, setAddClsName] = useState('')
  const [showAddCls, setShowAddCls] = useState(false)

  function addStudent() {
    if (!newName.trim()) return
    const s = { id: Date.now().toString(), name: newName.trim(), joinDate: today() }
    const classes = data.classes.map(c =>
      c.id === currentClass.id ? { ...c, students: [...c.students, s] } : c
    )
    update({ classes })
    setNewName('')
  }

  function removeStudent(sid) {
    const classes = data.classes.map(c =>
      c.id === currentClass.id
        ? { ...c, students: c.students.filter(s => s.id !== sid) }
        : c
    )
    update({ classes })
  }

  function addClass() {
    if (!addClsName.trim()) return
    const newCls = {
      id: Date.now().toString(),
      name: addClsName.trim(),
      code: data.version === 'B' ? generateCode() : null,
      students: [],
    }
    update({ classes: [...data.classes, newCls], currentClassId: newCls.id })
    setAddClsName('')
    setShowAddCls(false)
  }

  // B版：班级码信息
  const links = data.version === 'B' ? getClassLinks() : {}
  const linkedStudents = data.version === 'B' && currentClass.code
    ? Object.keys(links[currentClass.code]?.completions || {}).length
    : 0

  return (
    <div style={T.wrap}>
      {/* B版班级码卡片 */}
      {data.version === 'B' && currentClass.code && (
        <div style={T.codeCard}>
          <div style={T.codeLabel}>📌 班级码（发给家长）</div>
          <div style={T.code}>{currentClass.code}</div>
          <div style={T.codeSub}>
            家长在宠物APP家长端 → 设置 → "加入班级" 中输入此码即可联动
          </div>
          <div style={T.codeStat}>
            已连接家长：<strong>{linkedStudents}</strong> 位
          </div>
        </div>
      )}

      {/* 学生列表 */}
      <div style={T.section}>
        <div style={T.sectionHeader}>
          <div style={T.sectionTitle}>
            👥 学生名单
            <span style={T.badge}>{currentClass.students.length} 人</span>
          </div>
        </div>

        {currentClass.students.length === 0 ? (
          <div style={T.empty}>还没有学生，在下方添加吧</div>
        ) : (
          <div style={T.studentGrid}>
            {currentClass.students.map((s, i) => (
              <div key={s.id} style={T.studentCard}>
                <div style={T.studentAvatar}>{s.name[0]}</div>
                <div style={T.studentName}>{s.name}</div>
                <div style={T.studentSub}>#{i + 1}</div>
                <button style={T.removeBtn} onClick={() => removeStudent(s.id)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* 添加学生 */}
        <div style={T.addRow}>
          <input
            style={T.input}
            placeholder="输入学生姓名后回车"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStudent()}
          />
          <button style={T.addBtn} onClick={addStudent}>添加</button>
        </div>
      </div>

      {/* 添加新班级 */}
      <div style={T.section}>
        <div style={T.sectionTitle}>🏫 班级管理</div>
        <div style={T.classList}>
          {data.classes.map(c => (
            <div key={c.id} style={{ ...T.clsChip, background: c.id === data.currentClassId ? '#667eea' : '#f0f0f8', color: c.id === data.currentClassId ? '#fff' : '#444' }}>
              {c.name}
              {data.version === 'B' && c.code && <span style={T.codeChip}>{c.code}</span>}
            </div>
          ))}
        </div>
        {!showAddCls ? (
          <button style={T.outlineBtn} onClick={() => setShowAddCls(true)}>➕ 新增班级</button>
        ) : (
          <div style={T.addRow}>
            <input
              style={T.input}
              placeholder="新班级名称"
              value={addClsName}
              onChange={e => setAddClsName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addClass()}
              autoFocus
            />
            <button style={T.addBtn} onClick={addClass}>创建</button>
            <button style={T.cancelBtn} onClick={() => setShowAddCls(false)}>取消</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Tab 2 — 作业布置
// ═══════════════════════════════════════════════════
function AssignTab({ data, currentClass, update }) {
  const todayStr = today()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', icon: '📖', subject: data.subject,
    points: 15, dueDate: todayStr,
  })

  const classAssignments = data.assignments
    .filter(a => a.classId === currentClass.id)
    .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate))

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const newA = {
      id: Date.now().toString(),
      classId: currentClass.id,
      name: form.name.trim(),
      icon: form.icon,
      subject: form.subject,
      points: Number(form.points),
      dueDate: form.dueDate,
      assignedDate: todayStr,
      completions: {},   // A版手动勾选 { studentId: bool }
    }
    update({ assignments: [...data.assignments, newA] })
    setForm({ name: '', icon: '📖', subject: data.subject, points: 15, dueDate: todayStr })
    setShowForm(false)
  }

  function deleteAssignment(id) {
    update({ assignments: data.assignments.filter(a => a.id !== id) })
  }

  // A版：手动切换学生完成状态
  function toggleStudentDone(assignmentId, studentId) {
    const assignments = data.assignments.map(a => {
      if (a.id !== assignmentId) return a
      const c = { ...(a.completions || {}) }
      c[studentId] = !c[studentId]
      return { ...a, completions: c }
    })
    update({ assignments })
  }

  return (
    <div style={T.wrap}>
      <div style={T.sectionHeader}>
        <div style={T.sectionTitle}>
          📋 作业列表
          <span style={T.badge}>{classAssignments.length} 项</span>
        </div>
        <button style={T.primaryBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '➕ 布置作业'}
        </button>
      </div>

      {/* 布置作业表单 */}
      {showForm && (
        <form onSubmit={submit} style={T.form}>
          {/* 图标选择 */}
          <div style={T.iconRow}>
            {TASK_ICONS_T.map(ic => (
              <span
                key={ic}
                style={{ ...T.iconOpt, background: form.icon === ic ? '#667eea22' : 'transparent', border: form.icon === ic ? '2px solid #667eea' : '2px solid transparent' }}
                onClick={() => setForm(p => ({ ...p, icon: ic }))}
              >{ic}</span>
            ))}
          </div>
          <input
            style={T.input}
            placeholder="作业内容，例如：预习第3课"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
          />
          <div style={T.formRow}>
            <div style={{ flex: 1 }}>
              <div style={T.fLabel}>科目</div>
              <select style={T.select} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ width: 80 }}>
              <div style={T.fLabel}>经验值</div>
              <input
                type="number" min={5} max={50}
                style={{ ...T.input, width: '100%' }}
                value={form.points}
                onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={T.fLabel}>截止日期</div>
              <input
                type="date" style={T.input}
                value={form.dueDate}
                min={todayStr}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
          </div>
          {data.version === 'B' && (
            <div style={T.tipSmall}>
              💡 布置后将自动同步到已连接家长的孩子任务列表
            </div>
          )}
          <button style={T.submitBtn} type="submit">确认布置</button>
        </form>
      )}

      {/* 作业列表 */}
      {classAssignments.length === 0 ? (
        <div style={T.empty}>暂无作业，点击"布置作业"开始</div>
      ) : (
        classAssignments.map(a => {
          const doneCount = data.version === 'B'
            ? getCompletionCount(currentClass.code, a.id)
            : Object.values(a.completions || {}).filter(Boolean).length
          const totalCount = data.version === 'B'
            ? '?' /* 家长端人数未知 */
            : currentClass.students.length
          const isExpired = a.dueDate < todayStr

          return (
            <div key={a.id} style={{ ...T.assignCard, opacity: isExpired ? 0.75 : 1 }}>
              <div style={T.assignTop}>
                <span style={T.assignIcon}>{a.icon}</span>
                <div style={T.assignInfo}>
                  <div style={T.assignName}>{a.name}</div>
                  <div style={T.assignMeta}>
                    {a.subject} · +{a.points}exp · 截止 {a.dueDate}
                    {isExpired && <span style={T.expiredTag}>已过期</span>}
                  </div>
                </div>
                <div style={T.assignRight}>
                  <div style={T.doneCount}>
                    {doneCount}
                    {data.version === 'A' && `/${totalCount}`}
                    <div style={T.doneLabel}>完成</div>
                  </div>
                  <button style={T.deleteBtn} onClick={() => deleteAssignment(a.id)}>🗑</button>
                </div>
              </div>

              {/* A版：手动勾选每个学生 */}
              {data.version === 'A' && currentClass.students.length > 0 && (
                <div style={T.studentChecks}>
                  {currentClass.students.map(s => (
                    <button
                      key={s.id}
                      style={{
                        ...T.checkChip,
                        background: a.completions?.[s.id] ? '#52c41a' : '#f0f0f8',
                        color: a.completions?.[s.id] ? '#fff' : '#666',
                      }}
                      onClick={() => toggleStudentDone(a.id, s.id)}
                    >
                      {a.completions?.[s.id] ? '✅' : '○'} {s.name}
                    </button>
                  ))}
                </div>
              )}

              {/* B版：显示同步状态 */}
              {data.version === 'B' && (
                <div style={T.syncStatus}>
                  🔄 已同步至家长端 · {doneCount} 位家长已确认完成
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Tab 3 — 数据统计
// ═══════════════════════════════════════════════════
function StatsTab({ data, currentClass }) {
  const todayStr = today()
  const classA   = data.assignments.filter(a => a.classId === currentClass.id)
  const recent   = classA.filter(a => a.dueDate >= todayStr || a.dueDate === todayStr)
  const expired  = classA.filter(a => a.dueDate < todayStr)

  // A版完成率
  function getRate(a) {
    if (data.version === 'B') {
      const done = getCompletionCount(currentClass.code, a.id)
      return done   // 分子；分母未知
    }
    const total = currentClass.students.length
    if (!total) return 0
    const done = Object.values(a.completions || {}).filter(Boolean).length
    return Math.round(done / total * 100)
  }

  // A版：每个学生的总完成数
  const studentStats = currentClass.students.map(s => {
    const done = classA.filter(a => a.completions?.[s.id]).length
    const rate = classA.length ? Math.round(done / classA.length * 100) : 0
    return { ...s, done, rate }
  }).sort((a, b) => b.rate - a.rate)

  return (
    <div style={T.wrap}>
      {/* 总览卡片 */}
      <div style={T.statGrid}>
        <div style={T.statCard}>
          <div style={T.statNum}>{currentClass.students.length}</div>
          <div style={T.statSub}>学生人数</div>
        </div>
        <div style={T.statCard}>
          <div style={T.statNum}>{classA.length}</div>
          <div style={T.statSub}>总作业数</div>
        </div>
        <div style={T.statCard}>
          <div style={{ ...T.statNum, color: '#52c41a' }}>{recent.length}</div>
          <div style={T.statSub}>进行中</div>
        </div>
        <div style={T.statCard}>
          <div style={{ ...T.statNum, color: '#aaa' }}>{expired.length}</div>
          <div style={T.statSub}>已截止</div>
        </div>
      </div>

      {/* A版：学生排行 */}
      {data.version === 'A' && studentStats.length > 0 && (
        <div style={T.section}>
          <div style={T.sectionTitle}>🏆 学生完成排行</div>
          {studentStats.map((s, i) => (
            <div key={s.id} style={T.rankRow}>
              <div style={{ ...T.rankNum, color: i < 3 ? ['#faad14','#bfbfbf','#d48806'][i] : '#ccc' }}>
                {i + 1}
              </div>
              <div style={T.rankAvatar}>{s.name[0]}</div>
              <div style={T.rankName}>{s.name}</div>
              <div style={T.rankBar}>
                <div style={{ ...T.rankFill, width: `${s.rate}%`, background: s.rate >= 80 ? '#52c41a' : s.rate >= 50 ? '#faad14' : '#ff4d4f' }} />
              </div>
              <div style={T.rankPct}>{s.rate}%</div>
            </div>
          ))}
        </div>
      )}

      {/* B版：按作业显示家长确认数 */}
      {data.version === 'B' && classA.length > 0 && (
        <div style={T.section}>
          <div style={T.sectionTitle}>📊 家长确认情况</div>
          {classA.slice(0, 10).map(a => {
            const done = getCompletionCount(currentClass.code, a.id)
            return (
              <div key={a.id} style={T.assignStatRow}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{a.subject} · {a.dueDate}</div>
                </div>
                <div style={T.confirmedBadge}>{done} 人已确认</div>
              </div>
            )
          })}
        </div>
      )}

      {/* 作业完成率列表 */}
      {data.version === 'A' && classA.length > 0 && (
        <div style={T.section}>
          <div style={T.sectionTitle}>📋 作业完成率</div>
          {classA.map(a => {
            const rate = getRate(a)
            return (
              <div key={a.id} style={T.rateRow}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{a.name}</div>
                  <div style={T.rateBarBg}>
                    <div style={{ ...T.rateBarFill, width: `${rate}%`, background: rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f' }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#555', flexShrink: 0, marginLeft: 8 }}>{rate}%</div>
              </div>
            )
          })}
        </div>
      )}

      {classA.length === 0 && (
        <div style={T.empty}>还没有作业数据，先去布置作业吧</div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Tab 4 — 家校公告（仅B版）
// ═══════════════════════════════════════════════════
function NoticeTab({ data, currentClass, update }) {
  const [text, setText]   = useState('')
  const notices = (data.announcements || [])
    .filter(n => n.classId === currentClass.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  function post() {
    if (!text.trim()) return
    const n = {
      id: Date.now().toString(),
      classId: currentClass.id,
      content: text.trim(),
      date: today(),
      pinned: false,
    }
    update({ announcements: [...(data.announcements || []), n] })
    setText('')
  }

  function deleteNotice(id) {
    update({ announcements: data.announcements.filter(n => n.id !== id) })
  }

  function togglePin(id) {
    update({
      announcements: data.announcements.map(n =>
        n.id === id ? { ...n, pinned: !n.pinned } : n
      ),
    })
  }

  return (
    <div style={T.wrap}>
      <div style={T.section}>
        <div style={T.sectionTitle}>📢 发布家校公告</div>
        <div style={T.tipSmall}>公告将通过班级码共享层同步给所有连接的家长</div>
        <textarea
          style={T.textarea}
          placeholder="输入公告内容，例如：明天下午3点开家长会…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
        />
        <button style={T.submitBtn} onClick={post}>发布公告</button>
      </div>

      <div style={T.section}>
        <div style={T.sectionTitle}>
          📋 历史公告
          <span style={T.badge}>{notices.length} 条</span>
        </div>
        {notices.length === 0 ? (
          <div style={T.empty}>还没有公告</div>
        ) : (
          notices.map(n => (
            <div key={n.id} style={{ ...T.noticeCard, borderLeft: n.pinned ? '4px solid #faad14' : '4px solid #f0f0f8' }}>
              <div style={T.noticeContent}>{n.content}</div>
              <div style={T.noticeMeta}>
                📅 {n.date}
                {n.pinned && <span style={T.pinnedTag}>📌 已置顶</span>}
              </div>
              <div style={T.noticeActions}>
                <button style={T.textBtn} onClick={() => togglePin(n.id)}>
                  {n.pinned ? '取消置顶' : '📌 置顶'}
                </button>
                <button style={{ ...T.textBtn, color: '#f5222d' }} onClick={() => deleteNotice(n.id)}>删除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── 样式 ──────────────────────────────────────────
const S = {
  // ───── 桌面 Web 布局：顶栏 + 左侧栏 + 主内容 ─────
  shell: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    height: 56,
    background: 'linear-gradient(90deg, #1a1a2e, #16213e)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  brandTitle: { fontSize: 16, fontWeight: 800 },
  brandSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 18 },
  teacherChip: {
    fontSize: 13,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    padding: '6px 14px', borderRadius: 999,
    display: 'flex', alignItems: 'center',
  },
  versionBadge: {
    color: '#fff', fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 999,
  },
  exitLink: {
    color: 'rgba(255,255,255,0.7)', fontSize: 13,
    textDecoration: 'none', fontWeight: 600,
  },

  body: {
    display: 'flex', flex: 1,
    minHeight: 'calc(100vh - 56px)',
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: 'linear-gradient(180deg, #2c2c4a, #1a1a2e)',
    color: '#fff',
    padding: '20px 12px',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  sideSchoolBlock: {
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  sideSchoolName: { fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 8 },
  sideClassSelect: {
    width: '100%',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8, color: '#fff',
    padding: '6px 10px', fontSize: 13,
    fontFamily: 'inherit', cursor: 'pointer',
    appearance: 'none',
  },
  sideStudentCount: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)',
    marginTop: 8,
  },
  sideNav: {
    display: 'flex', flexDirection: 'column', gap: 4,
    flex: 1,
  },
  sideNavItem: {
    display: 'flex', alignItems: 'center',
    padding: '10px 14px',
    border: 'none', borderRadius: 10,
    fontSize: 13, fontFamily: 'inherit',
    cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.2s',
    width: '100%',
  },
  sideFooter: {
    paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  resetBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8, padding: '7px 16px',
    fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
    fontFamily: 'inherit',
  },

  content: {
    flex: 1,
    padding: '24px 32px 40px',
    overflowY: 'auto',
    width: '100%',
    minWidth: 0,
  },
  contentHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #e8e8e8',
  },
  crumb: { fontSize: 12, color: '#999', marginBottom: 4 },
  contentTitle: { fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  contentBody: { display: 'flex', flexDirection: 'column', gap: 16 },
}

const T = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 14 },
  section: { background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  badge: { background: '#667eea', color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 12 },
  empty: { color: '#bbb', textAlign: 'center', padding: '20px 0', fontSize: 14 },

  // 班级码
  codeCard: {
    background: 'linear-gradient(135deg, #e6fffb, #f0fffe)',
    border: '2px solid #36cfc9',
    borderRadius: 16, padding: '16px',
    textAlign: 'center',
  },
  codeLabel: { fontSize: 12, color: '#08979c', fontWeight: 700, marginBottom: 8 },
  code: { fontSize: 36, fontWeight: 900, letterSpacing: 8, color: '#006d75', fontFamily: 'monospace' },
  codeSub: { fontSize: 12, color: '#389e9f', marginTop: 6, lineHeight: 1.5 },
  codeStat: { fontSize: 13, color: '#006d75', fontWeight: 700, marginTop: 8 },

  // 学生
  studentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 14 },
  studentCard: {
    background: '#f8f8fc', borderRadius: 12,
    padding: '12px 8px', textAlign: 'center',
    position: 'relative',
  },
  studentAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 6px',
  },
  studentName: { fontSize: 12, fontWeight: 700, color: '#333' },
  studentSub: { fontSize: 10, color: '#bbb', marginTop: 2 },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    background: 'none', border: 'none',
    color: '#ddd', cursor: 'pointer', fontSize: 12,
    padding: '2px 4px',
  },

  // 班级列表
  classList: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  clsChip: { padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  codeChip: { fontSize: 11, background: 'rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: 999, fontFamily: 'monospace', letterSpacing: 1 },

  // 表单
  form: { background: '#f8f8fc', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 },
  formRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  fLabel: { fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 4 },
  iconRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  iconOpt: { fontSize: 22, padding: '4px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' },
  input: { padding: '10px 12px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 14, fontFamily: 'inherit', flex: 1, outline: 'none' },
  select: { padding: '10px 12px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 14, background: '#fff', fontFamily: 'inherit', width: '100%' },
  textarea: { padding: '12px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box' },
  tipSmall: { fontSize: 12, color: '#52c41a', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: '8px 12px' },
  addRow: { display: 'flex', gap: 8 },
  addBtn: { padding: '10px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  cancelBtn: { padding: '10px 14px', background: '#f5f5f5', color: '#888', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' },
  outlineBtn: { width: '100%', padding: '10px', background: 'transparent', border: '1.5px dashed #667eea', color: '#667eea', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', marginTop: 4 },
  primaryBtn: { padding: '8px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap', fontFamily: 'inherit' },
  submitBtn: { padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' },

  // 作业卡片
  assignCard: { background: '#fff', border: '1.5px solid #f0f0f8', borderRadius: 14, padding: '14px', marginBottom: 10 },
  assignTop: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  assignIcon: { fontSize: 26, flexShrink: 0, lineHeight: 1 },
  assignInfo: { flex: 1, minWidth: 0 },
  assignName: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 },
  assignMeta: { fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 8 },
  expiredTag: { background: '#fff1f0', color: '#f5222d', fontSize: 11, padding: '1px 6px', borderRadius: 999, fontWeight: 700 },
  assignRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  doneCount: { textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#667eea' },
  doneLabel: { fontSize: 10, color: '#aaa', textAlign: 'center' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ddd' },
  studentChecks: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f5f5f5' },
  checkChip: { padding: '5px 12px', borderRadius: 999, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' },
  syncStatus: { marginTop: 10, fontSize: 12, color: '#52c41a', paddingTop: 10, borderTop: '1px solid #f6ffed' },

  // 统计
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 4 },
  statCard: { background: '#fff', borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statNum: { fontSize: 24, fontWeight: 800, color: '#667eea' },
  statSub: { fontSize: 11, color: '#bbb', marginTop: 4 },
  rankRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  rankNum: { width: 24, fontWeight: 800, fontSize: 16, textAlign: 'center', flexShrink: 0 },
  rankAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankName: { width: 56, fontSize: 13, fontWeight: 600, color: '#333', flexShrink: 0 },
  rankBar: { flex: 1, height: 10, background: '#f0f0f8', borderRadius: 999, overflow: 'hidden' },
  rankFill: { height: '100%', borderRadius: 999, transition: 'width 0.5s ease' },
  rankPct: { width: 36, fontSize: 13, fontWeight: 700, textAlign: 'right', flexShrink: 0, color: '#555' },
  rateRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  rateBarBg: { height: 8, background: '#f0f0f8', borderRadius: 999, overflow: 'hidden' },
  rateBarFill: { height: '100%', borderRadius: 999, transition: 'width 0.5s ease' },
  assignStatRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  confirmedBadge: { background: '#f6ffed', color: '#52c41a', border: '1px solid #b7eb8f', borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0 },

  // 公告
  noticeCard: { background: '#fafafa', borderRadius: 12, padding: '14px', marginBottom: 10 },
  noticeContent: { fontSize: 14, color: '#333', lineHeight: 1.6, marginBottom: 8 },
  noticeMeta: { fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 10 },
  pinnedTag: { background: '#fffbe6', color: '#ad6800', fontSize: 11, padding: '1px 8px', borderRadius: 999 },
  noticeActions: { display: 'flex', gap: 16, marginTop: 8 },
  textBtn: { background: 'none', border: 'none', color: '#667eea', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' },
}
