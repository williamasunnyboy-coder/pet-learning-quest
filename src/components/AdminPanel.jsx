import { useState } from 'react'
import { PET_TYPES, getPetImageUrl, getAchievements, DEFAULT_ACHIEVEMENTS } from '../store'

const ADMIN_KEY = 'petAdminConfig'
const APP_KEY = 'petLearningApp'

const DEFAULT_THRESHOLDS = [80, 200, 380, 620, 920, 1300, 1800]
const DEFAULT_TEMPLATES = [
  { id: 't1', name: '完成作业', points: 12, icon: '📝' },
  { id: 't2', name: '阅读20分钟', points: 10, icon: '📚' },
  { id: 't3', name: '练字', points: 10, icon: '✏️' },
  { id: 't4', name: '睡前收拾书包', points: 6, icon: '🎒' },
  { id: 't5', name: '早起不赖床', points: 6, icon: '⏰' },
]

function loadAdmin() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}') } catch { return {} }
}
function loadApp() {
  try { return JSON.parse(localStorage.getItem(APP_KEY) || 'null') } catch { return null }
}

function initPetTypes() {
  const admin = loadAdmin()
  const result = {}
  for (const [k, v] of Object.entries(PET_TYPES)) {
    const ov = admin.petTypes?.[k] || {}
    result[k] = {
      name: ov.name ?? v.name,
      emoji: ov.emoji ?? v.emoji,
      theme: ov.theme ?? v.theme,
      themeAccent: ov.themeAccent ?? v.themeAccent,
      stages: (ov.stages ?? v.stages).map(s => ({ ...s })),
    }
  }
  return result
}

export default function AdminPanel() {
  const [tab, setTab] = useState('pets')
  const [pets, setPets] = useState(initPetTypes)
  const [thresholds, setThresholds] = useState(() => loadAdmin().expThresholds ?? [...DEFAULT_THRESHOLDS])
  const [templates, setTemplates] = useState(() => loadAdmin().taskTemplates ?? DEFAULT_TEMPLATES.map(t => ({ ...t })))
  const [appState, setAppState] = useState(loadApp)
  const [toast, setToast] = useState('')
  const [newTpl, setNewTpl] = useState({ name: '', points: 10, icon: '⭐', weekdays: null })
  const [achievements, setAchievements] = useState(() => getAchievements())

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function saveAll() {
    const validThresholds = thresholds.length > 0 && thresholds[0] > 0 &&
      thresholds.every((t, i) => i === 0 || t > thresholds[i - 1])
    if (!validThresholds) {
      showToast('⚠️ 进化阈值必须依次递增且大于 0！')
      return
    }
    localStorage.setItem(ADMIN_KEY, JSON.stringify({
      petTypes: pets,
      expThresholds: thresholds,
      taskTemplates: templates,
      achievements,
    }))
    if (appState) localStorage.setItem(APP_KEY, JSON.stringify(appState))
    showToast('✅ 已保存！刷新前台页面后生效')
  }

  const TABS = [
    ['pets', '🐾 宠物成长路径'],
    ['thresholds', '⭐ 进化阈值'],
    ['templates', '📋 任务模板'],
    ['achievements', '🏆 成就系统'],
    ['save', '💾 当前存档'],
  ]

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>🛠️ 宠物学习 · 后台管理</div>
          <div style={S.headerSub}>修改配置后点击「保存」，前台刷新后生效</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {toast && <div style={S.toast}>{toast}</div>}
          <button style={S.saveBtn} onClick={saveAll}>💾 保存所有修改</button>
          <a href="/" style={S.backLink}>← 返回前台</a>
        </div>
      </div>

      <div style={S.tabBar}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ ...S.tabBtn, ...(tab === key ? S.tabActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {tab === 'pets' && <PetsTab pets={pets} setPets={setPets} />}
        {tab === 'thresholds' && <ThresholdsTab thresholds={thresholds} setThresholds={setThresholds} />}
        {tab === 'templates' && (
          <TemplatesTab
            templates={templates}
            setTemplates={setTemplates}
            newTpl={newTpl}
            setNewTpl={setNewTpl}
          />
        )}
        {tab === 'achievements' && (
          <AchievementsTab
            achievements={achievements}
            setAchievements={setAchievements}
            templates={templates}
          />
        )}
        {tab === 'save' && (
          <SaveTab
            appState={appState}
            setAppState={setAppState}
            onReset={() => {
              if (!confirm('确定清除存档？孩子的所有进度将丢失。')) return
              localStorage.removeItem(APP_KEY)
              setAppState(null)
              showToast('🗑️ 存档已清除')
            }}
          />
        )}
      </div>
    </div>
  )
}

// ─── 宠物成长路径 ────────────────────────────────────────
function PetsTab({ pets, setPets }) {
  function upd(petKey, field, value) {
    setPets(prev => ({ ...prev, [petKey]: { ...prev[petKey], [field]: value } }))
  }
  function updStage(petKey, idx, field, value) {
    setPets(prev => ({
      ...prev,
      [petKey]: {
        ...prev[petKey],
        stages: prev[petKey].stages.map((s, i) => i === idx ? { ...s, [field]: value } : s),
      },
    }))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
      {Object.entries(pets).map(([key, pet]) => (
        <div key={key} style={{ ...S.card, borderTop: `4px solid ${pet.themeAccent}` }}>
          {/* Header row */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <img
              src={getPetImageUrl(key, 0)}
              alt={pet.name}
              style={{ width: 60, height: 60, objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#bbb', marginBottom: 6, fontFamily: 'monospace' }}>ID: {key}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...S.input, width: 52 }}
                  value={pet.emoji}
                  onChange={e => upd(key, 'emoji', e.target.value)}
                />
                <input
                  style={{ ...S.input, flex: 1 }}
                  value={pet.name}
                  onChange={e => upd(key, 'name', e.target.value)}
                  placeholder="宠物名称"
                />
              </div>
            </div>
          </div>

          {/* Color pickers */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            {[['themeAccent', '主题色'], ['theme', '背景色']].map(([field, label]) => (
              <div key={field} style={{ flex: 1 }}>
                <div style={S.label}>{label}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={pet[field]}
                    onChange={e => upd(key, field, e.target.value)}
                    style={S.colorPicker}
                  />
                  <input
                    style={{ ...S.input, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                    value={pet[field]}
                    onChange={e => upd(key, field, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Stages */}
          <div style={S.label}>成长阶段（4阶段）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {pet.stages.map((stage, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <img
                  src={getPetImageUrl(key, idx)}
                  style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ ...S.stageChip, background: pet.themeAccent }}>阶段 {idx + 1}</div>
                <input
                  style={{ ...S.input, flex: 1 }}
                  value={stage.name}
                  onChange={e => updStage(key, idx, 'name', e.target.value)}
                />
                <code style={{ fontSize: 11, color: '#ccc', flexShrink: 0 }}>{stage.level}</code>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── 进化阈值 ────────────────────────────────────────
function ThresholdsTab({ thresholds, setThresholds }) {
  const n = thresholds.length                 // 阈值数 = 进化阶段数 - 1
  const last = thresholds[n - 1] || 0
  const max = last + 300
  const segColors = ['#b7eb8f', '#ffd591', '#91caff', '#ffadd2', '#d3adf7', '#ffe58f', '#87e8de', '#ffbb96']
  const barColors = ['#52c41a', '#faad14', '#1677ff', '#eb2f96', '#722ed1', '#d4b106', '#13c2c2', '#fa541c']
  // n+1 个经验区段，对应 n+1 个进化阶段
  const segments = [
    ...thresholds.map((t, i) => ({
      label: `阶段 ${i + 1}`,
      from: i === 0 ? 0 : thresholds[i - 1],
      to: t,
      color: segColors[i % segColors.length],
    })),
    { label: `阶段 ${n + 1}`, from: last, to: max, color: segColors[n % segColors.length] },
  ]

  return (
    <div style={{ maxWidth: 660 }}>
      <div style={S.card}>
        <div style={S.sectionTitle}>经验值进化阈值</div>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
          孩子完成任务积累经验值，达到阈值后宠物进化到下一阶段。当前共 {n + 1} 个进化阶段。
        </p>

        {/* Visual bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', height: 36, borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: '1px solid #f0f0f0' }}>
            {segments.map((seg, i) => (
              <div
                key={i}
                style={{
                  flex: Math.max(1, seg.to - seg.from),
                  background: seg.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#444',
                }}
              >
                {seg.label}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa', padding: '0 2px' }}>
            <span>0</span>
            {thresholds.map((t, i) => <span key={i}>{t}</span>)}
            <span>{max}+</span>
          </div>
        </div>

        {/* Inputs（按阈值数量动态渲染） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {thresholds.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 110, fontSize: 14, fontWeight: 700, color: '#444', flexShrink: 0 }}>阶段{i + 1} → {i + 2}</div>
              <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (t / max) * 100)}%`, height: '100%', background: barColors[i % barColors.length], transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: '#999' }}>需经验</span>
                <input
                  type="number"
                  style={{ ...S.input, width: 90, textAlign: 'center' }}
                  value={t}
                  min={i > 0 ? thresholds[i - 1] + 1 : 1}
                  onChange={e => {
                    const v = Math.max(1, parseInt(e.target.value) || 0)
                    setThresholds(prev => prev.map((x, idx) => idx === i ? v : x))
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: '12px 16px', background: '#f9f9f9', borderRadius: 10, fontSize: 13, color: '#666' }}>
          💡 默认 8 阶段阈值：<b>80 / 200 / 380 / 620 / 920 / 1300 / 1800</b> 经验
        </div>
      </div>
    </div>
  )
}

// ─── 任务模板 ────────────────────────────────────────
const TASK_ICONS = ['📝', '📚', '✏️', '🎒', '⏰', '🏃', '🎵', '🧩', '🌟', '💪', '🎨', '🏊', '🧘', '🌱', '🔬']

function TemplatesTab({ templates, setTemplates, newTpl, setNewTpl }) {
  function upd(id, field, value) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }
  function remove(id) {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }
  function add() {
    if (!newTpl.name.trim()) return
    setTemplates(prev => [...prev, { ...newTpl, id: Date.now().toString() }])
    setNewTpl({ name: '', points: 10, icon: '⭐', weekdays: null })
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={S.card}>
        <div style={S.sectionTitle}>默认任务模板</div>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4, marginBottom: 20 }}>
          新游戏初始化或点击「刷新任务」时使用的默认模板列表。
        </p>

        {/* Add new */}
        <div style={{ background: '#f9fafb', border: '1.5px dashed #d9d9d9', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#444', marginBottom: 10 }}>➕ 添加新模板</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {TASK_ICONS.map(ic => (
              <span
                key={ic}
                onClick={() => setNewTpl(p => ({ ...p, icon: ic }))}
                style={{
                  fontSize: 20, cursor: 'pointer', padding: '4px 6px', borderRadius: 8,
                  background: newTpl.icon === ic ? '#eff6ff' : 'transparent',
                  border: newTpl.icon === ic ? '2px solid #667eea' : '2px solid transparent',
                }}
              >{ic}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              placeholder="任务名称，例如：背诵课文"
              value={newTpl.name}
              onChange={e => setNewTpl(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && add()}
            />
            <input
              type="number"
              style={{ ...S.input, width: 80 }}
              min={1} max={100}
              placeholder="经验"
              value={newTpl.points}
              onChange={e => setNewTpl(p => ({ ...p, points: Number(e.target.value) }))}
            />
            <button style={S.addBtn} onClick={add}>添加</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#666', flexShrink: 0 }}>重复日</span>
            <WeekdayPicker
              weekdays={newTpl.weekdays}
              onChange={v => setNewTpl(p => ({ ...p, weekdays: v }))}
            />
            <span style={{ fontSize: 12, color: '#bbb' }}>
              {newTpl.weekdays === null ? '每天' : `每周${newTpl.weekdays.map(d => '日一二三四五六'[d]).join('、')}`}
            </span>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              {['图标', '任务名称', '经验值', '重复日', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#aaa', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templates.map(tpl => (
              <tr key={tpl.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '8px 10px' }}>
                  <select
                    value={tpl.icon}
                    onChange={e => upd(tpl.id, 'icon', e.target.value)}
                    style={{ ...S.input, width: 58, textAlign: 'center', fontSize: 16 }}
                  >
                    {TASK_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <input
                    style={{ ...S.input, width: '100%', minWidth: 160 }}
                    value={tpl.name}
                    onChange={e => upd(tpl.id, 'name', e.target.value)}
                  />
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <input
                    type="number"
                    style={{ ...S.input, width: 72 }}
                    value={tpl.points}
                    min={1} max={100}
                    onChange={e => upd(tpl.id, 'points', Number(e.target.value))}
                  />
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <WeekdayPicker
                    weekdays={tpl.weekdays ?? null}
                    onChange={v => upd(tpl.id, 'weekdays', v)}
                  />
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <button
                    onClick={() => remove(tpl.id)}
                    style={S.deleteBtn}
                  >删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 14, fontSize: 13, color: '#bbb' }}>
          共 {templates.length} 个模板
        </div>
      </div>
    </div>
  )
}

// ─── 当前存档 ────────────────────────────────────────
function SaveTab({ appState, setAppState, onReset }) {
  if (!appState) {
    return (
      <div style={{ ...S.card, maxWidth: 420, textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🥚</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#444' }}>暂无存档</div>
        <div style={{ fontSize: 14, color: '#aaa', marginTop: 6 }}>前台首次启动设置后自动生成存档</div>
      </div>
    )
  }

  function upd(path, value) {
    setAppState(prev => {
      const parts = path.split('.')
      if (parts.length === 1) return { ...prev, [path]: value }
      return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } }
    })
  }

  const _d = new Date()
  const todayStr = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`
  const todayTasks = (appState.tasks || []).filter(t => t.date === todayStr)
  const petDef = PET_TYPES[appState.petType]

  const fields = [
    { label: '孩子名字', path: 'childName', value: appState.childName },
    { label: '宠物名字', path: 'pet.name', value: appState.pet?.name },
    { label: '经验值', path: 'pet.exp', value: appState.pet?.exp, type: 'number', min: 0 },
    { label: '饱食度', path: 'pet.hunger', value: appState.pet?.hunger, type: 'number', min: 0, max: 100, hint: '0–100' },
    { label: '连续打卡', path: 'streak', value: appState.streak, type: 'number', min: 0, hint: '天' },
    { label: '历史最高', path: 'bestStreak', value: appState.bestStreak, type: 'number', min: 0, hint: '天' },
  ]

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Basic fields */}
      <div style={{ ...S.card, flex: '1 1 300px', minWidth: 0 }}>
        <div style={S.sectionTitle}>存档数据</div>

        {/* Pet type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 20px', padding: '10px 14px', background: '#f9f9f9', borderRadius: 10 }}>
          <img src={getPetImageUrl(appState.petType, 0)} style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{petDef?.name || appState.petType}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>宠物类型（不可在此修改）</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(f => (
            <div key={f.path} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 88, fontSize: 13, fontWeight: 600, color: '#555', flexShrink: 0 }}>{f.label}</div>
              <input
                style={{ ...S.input, flex: 1 }}
                type={f.type || 'text'}
                min={f.min}
                max={f.max}
                value={f.value ?? ''}
                onChange={e => upd(f.path, f.type === 'number' ? Number(e.target.value) : e.target.value)}
              />
              {f.hint && <span style={{ fontSize: 12, color: '#bbb', flexShrink: 0 }}>{f.hint}</span>}
            </div>
          ))}
        </div>

        <button onClick={onReset} style={S.resetBtn}>
          🗑️ 清除存档（重新开始）
        </button>
      </div>

      {/* Today's tasks */}
      <div style={{ ...S.card, flex: '1 1 340px', minWidth: 0 }}>
        <div style={S.sectionTitle}>今日任务</div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 4, marginBottom: 14 }}>
          {todayStr} · 共 {todayTasks.length} 个任务
        </div>

        {todayTasks.length === 0 ? (
          <div style={{ color: '#ccc', textAlign: 'center', padding: '28px 0', fontSize: 14 }}>暂无今日任务</div>
        ) : (
          <div>
            {todayTasks.map(task => {
              const statusMap = {
                pending: { label: '未完成', bg: '#f5f5f5', color: '#bbb' },
                done: { label: '待确认', bg: '#fffbe6', color: '#faad14' },
                confirmed: { label: '已确认', bg: '#f6ffed', color: '#52c41a' },
              }
              const st = statusMap[task.status] || statusMap.pending
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 18 }}>{task.icon}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{task.name}</span>
                  <span style={{ fontSize: 12, color: '#bbb' }}>+{task.points}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          {[
            ['已确认', todayTasks.filter(t => t.status === 'confirmed').length, '#52c41a'],
            ['待确认', todayTasks.filter(t => t.status === 'done').length, '#faad14'],
            ['未完成', todayTasks.filter(t => t.status === 'pending').length, '#d9d9d9'],
          ].map(([label, count, color]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: '#f9f9f9', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 成就系统 ────────────────────────────────────────
const ACHIEVEMENT_TYPES = ['streak', 'exp', 'taskCount', 'petStage']
const TYPE_LABELS = {
  streak: '连续打卡天数',
  exp: '累计经验值',
  taskCount: '任务完成次数',
  petStage: '宠物进化阶段',
}
const ACH_EMOJIS = ['🔥', '⚡', '⭐', '🌟', '📖', '📝', '⏰', '🦋', '🏆', '🎖️', '💎', '🌈', '🚀', '🎯', '👑']

function conditionText(a, templates) {
  switch (a.type) {
    case 'streak':    return `连续打卡达到 ${a.threshold} 天`
    case 'exp':       return `累计经验值达到 ${a.threshold}`
    case 'taskCount': {
      const tpl = templates.find(t => t.id === a.templateId)
      return `「${tpl ? tpl.icon + tpl.name : a.templateId || '?'}」完成 ${a.threshold} 次`
    }
    case 'petStage':  return `宠物进化到第 ${a.threshold + 1} 阶段`
    default:          return '—'
  }
}

function AchievementsTab({ achievements, setAchievements, templates }) {
  const [newA, setNewA] = useState({
    emoji: '🏆', name: '', type: 'streak', threshold: 7, templateId: '', active: true,
  })

  function upd(id, field, value) {
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }
  function remove(id) {
    setAchievements(prev => prev.filter(a => a.id !== id))
  }
  function add() {
    if (!newA.name.trim()) return
    setAchievements(prev => [...prev, { ...newA, id: Date.now().toString() }])
    setNewA({ emoji: '🏆', name: '', type: 'streak', threshold: 7, templateId: '', active: true })
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={S.sectionTitle}>成就系统配置</div>
          <button
            style={{ ...S.deleteBtn, background: '#f9f0ff', border: '1px solid #d3adf7', color: '#722ed1' }}
            onClick={() => {
              if (!confirm('确定恢复默认成就？当前修改将丢失。')) return
              setAchievements(DEFAULT_ACHIEVEMENTS)
            }}
          >↺ 恢复默认</button>
        </div>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4, marginBottom: 20 }}>
          自定义孩子可解锁的成就徽章，支持开启/关闭、修改条件阈值、新增自定义成就。
        </p>

        {/* Add new */}
        <div style={{ background: '#f9fafb', border: '1.5px dashed #d9d9d9', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#444', marginBottom: 10 }}>➕ 添加新成就</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {ACH_EMOJIS.map(em => (
              <span
                key={em}
                onClick={() => setNewA(p => ({ ...p, emoji: em }))}
                style={{
                  fontSize: 20, cursor: 'pointer', padding: '4px 6px', borderRadius: 8,
                  background: newA.emoji === em ? '#eff6ff' : 'transparent',
                  border: newA.emoji === em ? '2px solid #667eea' : '2px solid transparent',
                }}
              >{em}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...S.input, flex: '1 1 140px' }}
              placeholder="成就名称，例如：数学达人"
              value={newA.name}
              onChange={e => setNewA(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && add()}
            />
            <select
              style={{ ...S.input }}
              value={newA.type}
              onChange={e => setNewA(p => ({ ...p, type: e.target.value }))}
            >
              {ACHIEVEMENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input
              type="number" min={1}
              style={{ ...S.input, width: 80 }}
              placeholder="阈值"
              value={newA.threshold}
              onChange={e => setNewA(p => ({ ...p, threshold: Number(e.target.value) }))}
            />
            {newA.type === 'taskCount' && (
              <select
                style={{ ...S.input }}
                value={newA.templateId}
                onChange={e => setNewA(p => ({ ...p, templateId: e.target.value }))}
              >
                <option value="">— 选择任务模板 —</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
              </select>
            )}
            <button style={S.addBtn} onClick={add}>添加成就</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                {['启用', '图标', '名称', '类型', '阈值', '关联任务', '触发条件说明', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#aaa', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {achievements.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: a.active === false ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <input
                      type="checkbox"
                      checked={a.active !== false}
                      onChange={e => upd(a.id, 'active', e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#667eea' }}
                    />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <input
                      style={{ ...S.input, width: 52, textAlign: 'center', fontSize: 18 }}
                      value={a.emoji}
                      onChange={e => upd(a.id, 'emoji', e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <input
                      style={{ ...S.input, minWidth: 110 }}
                      value={a.name}
                      onChange={e => upd(a.id, 'name', e.target.value)}
                    />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <select
                      style={{ ...S.input }}
                      value={a.type}
                      onChange={e => upd(a.id, 'type', e.target.value)}
                    >
                      {ACHIEVEMENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <input
                      type="number" min={1}
                      style={{ ...S.input, width: 72 }}
                      value={a.threshold}
                      onChange={e => upd(a.id, 'threshold', Number(e.target.value))}
                    />
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {a.type === 'taskCount' ? (
                      <select
                        style={{ ...S.input }}
                        value={a.templateId || ''}
                        onChange={e => upd(a.id, 'templateId', e.target.value)}
                      >
                        <option value="">—</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                      </select>
                    ) : (
                      <span style={{ fontSize: 13, color: '#ccc' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                    {conditionText(a, templates)}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <button onClick={() => remove(a.id)} style={S.deleteBtn}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, fontSize: 13, color: '#bbb' }}>
          共 {achievements.length} 个成就 · {achievements.filter(a => a.active !== false).length} 个已启用
        </div>
      </div>
    </div>
  )
}

// ─── 星期选择器 ──────────────────────────────────────
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function WeekdayPicker({ weekdays, onChange }) {
  // weekdays === null means every day; array = specific days [0-6]
  const active = weekdays === null ? [0, 1, 2, 3, 4, 5, 6] : weekdays

  function toggle(d) {
    let next
    if (weekdays === null) {
      next = [0, 1, 2, 3, 4, 5, 6].filter(x => x !== d)
    } else {
      if (weekdays.includes(d)) {
        next = weekdays.filter(x => x !== d)
        if (next.length === 0) next = [d] // prevent empty selection
      } else {
        next = [...weekdays, d].sort((a, b) => a - b)
      }
    }
    onChange(next.length === 7 ? null : next)
  }

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {WEEK_LABELS.map((label, i) => (
        <button
          key={i}
          type="button"
          title={`周${label}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: active.includes(i) ? '#667eea' : '#f0f0f0',
            color: active.includes(i) ? '#fff' : '#bbb',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            transition: 'all 0.15s',
          }}
          onClick={() => toggle(i)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Styles ────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  header: {
    background: '#1a1a2e',
    padding: '18px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 800, color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  toast: {
    background: '#52c41a',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  backLink: {
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  tabBar: {
    background: '#fff',
    padding: '0 32px',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    gap: 0,
    overflowX: 'auto',
  },
  tabBtn: {
    padding: '14px 20px',
    border: 'none',
    background: 'none',
    fontSize: 14,
    fontWeight: 600,
    color: '#999',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
  },
  tabActive: {
    color: '#667eea',
    borderBottom: '3px solid #667eea',
  },
  content: { padding: 32 },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  sectionTitle: { fontSize: 17, fontWeight: 800, color: '#1a1a2e' },
  input: {
    padding: '7px 11px',
    border: '1.5px solid #e8e8e8',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fafafa',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  colorPicker: {
    width: 34,
    height: 32,
    border: '1.5px solid #e8e8e8',
    borderRadius: 6,
    cursor: 'pointer',
    padding: 2,
    background: '#fafafa',
    flexShrink: 0,
  },
  stageChip: {
    fontSize: 11,
    fontWeight: 800,
    color: '#fff',
    padding: '3px 8px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  addBtn: {
    background: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    background: '#fff1f0',
    border: '1px solid #ffa39e',
    color: '#f5222d',
    borderRadius: 6,
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  resetBtn: {
    marginTop: 24,
    width: '100%',
    padding: '11px',
    background: '#fff1f0',
    border: '1.5px solid #ffa39e',
    color: '#f5222d',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
  },
}
