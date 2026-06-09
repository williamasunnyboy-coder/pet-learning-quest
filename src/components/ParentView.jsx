import { useState, useRef } from 'react'
import { PET_TYPES, getPetImageUrl } from '../store'
import { playConfirmed } from '../sounds'
import { hapticSuccess } from '../haptic'
import { getNotifEnabled, setNotifEnabled, requestNotifPermission } from '../notifications'
import { lookupClassCode, DEMO_CLASS_CODE } from '../teacher-store'
import CalendarView from './CalendarView'
import PetAlbum from './PetAlbum'
import { MODE_META, MODE_ORDER } from '../constants/mode-meta'
import { MODE } from '../constants/modes'

const TASK_ICONS = ['📝', '📚', '✏️', '🎒', '⏰', '🏃', '🎵', '🧩', '🌟', '💪']
const CATEGORIES = ['学习', '生活', '其他']

export default function ParentView({
  state, todayTasks, history,
  onConfirm, onAddTask, onDeleteTask, onRefreshTasks,
  onRenamePet, onRenameChild,
  onExport, onImport,
  pinEnabled, onSetupPin, onChangePin, onClearPin,
  onOpenReport,
  onSetClassCode,
  appMode = MODE.FAMILY,
  onSetAppMode,
}) {
  const [modeSwitchTo, setModeSwitchTo] = useState(null)   // 待确认切换的目标模式
  const [showAdd, setShowAdd]     = useState(false)
  const [newTask, setNewTask]     = useState({ name: '', points: 15, icon: '⭐', category: '学习' })
  const [filterCat, setFilterCat] = useState('全部')
  const [renPet, setRenPet]       = useState('')
  const [renChild, setRenChild]   = useState('')
  const [notifOn, setNotifOn]     = useState(getNotifEnabled)
  const importRef                 = useRef(null)
  const [classInput, setClassInput]     = useState('')
  const [classLookup, setClassLookup]   = useState(null)   // { className, teacherName } or false
  const [classLookupErr, setClassLookupErr] = useState('')

  const { pet, petStage, petType, childName, streak, bestStreak, monthlyStats } = state
  const petDef = PET_TYPES[petType] || PET_TYPES['west-highland']
  const stageDef = petDef.stages[petStage]
  const imgUrl = getPetImageUrl(petType, petStage)

  const confirmed = todayTasks.filter(t => t.status === 'confirmed').length
  const pending = todayTasks.filter(t => t.status === 'done').length // done=等待确认

  function handleAdd(e) {
    e.preventDefault()
    if (!newTask.name.trim()) return
    onAddTask(newTask.name.trim(), parseInt(newTask.points), newTask.icon, newTask.category)
    setNewTask({ name: '', points: 15, icon: '⭐', category: '学习' })
    setShowAdd(false)
  }

  // Derived: available categories from today's tasks
  const availableCats = ['全部', ...new Set(todayTasks.map(t => t.category || '其他'))]
  const effectiveFilter = availableCats.includes(filterCat) ? filterCat : '全部'
  const filteredTasks = effectiveFilter === '全部'
    ? todayTasks
    : todayTasks.filter(t => (t.category || '其他') === effectiveFilter)

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  function handleConfirm(id) {
    playConfirmed()
    hapticSuccess()
    onConfirm(id)
  }

  function handleClassLookup() {
    const code = classInput.trim().toUpperCase()
    if (!code) return
    const info = lookupClassCode(code)
    if (info) {
      setClassLookup(info)
      setClassLookupErr('')
    } else {
      setClassLookup(null)
      setClassLookupErr('未找到该班级码，请确认后重试')
    }
  }

  function handleJoinClass() {
    if (!classLookup) return
    onSetClassCode?.(classInput.trim().toUpperCase())
    setClassInput('')
    setClassLookup(null)
  }

  function handleLeaveClass() {
    onSetClassCode?.(null)
  }

  async function handleNotifToggle() {
    if (!notifOn) {
      const ok = await requestNotifPermission()
      if (ok) { setNotifEnabled(true); setNotifOn(true) }
    } else {
      setNotifEnabled(false)
      setNotifOn(false)
    }
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    onImport?.(file)
    e.target.value = ''
  }

  // ── 校园模式：家长只读观察视图 ───────────────────────────
  if (appMode === MODE.CAMPUS) {
    const ms = state.monthlyStats || {}
    const classLinked = state.classCode ? lookupClassCode(state.classCode) : null
    return (
      <div style={styles.wrap}>
        {/* 观察提示 + 班级信息 */}
        <div style={{ background: '#f0f4ff', border: '1.5px solid #b0c4ff', borderRadius: 14, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: classLinked ? 8 : 0 }}>
            <span style={{ fontSize: 20 }}>👁</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#667eea' }}>学习观察模式</div>
              <div style={{ fontSize: 12, color: '#888' }}>老师布置任务、孩子完成即结算，无需家长确认</div>
            </div>
          </div>
          {classLinked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px dashed #c7d4ff' }}>
              <span style={{ fontSize: 14 }}>🏫</span>
              <div style={{ flex: 1, fontSize: 12, color: '#555' }}>
                <strong style={{ color: '#1a1a2e' }}>{classLinked.className}</strong> · {classLinked.teacherName}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: 2, padding: '2px 8px', borderRadius: 999, background: '#fff', color: '#667eea', border: '1px solid #b0c4ff' }}>
                {state.classCode}
              </span>
            </div>
          )}
          {!classLinked && (
            <div style={{ paddingTop: 8, borderTop: '1px dashed #c7d4ff', fontSize: 12, color: '#fa8c16' }}>
              ⚠️ 尚未绑定班级，请前往学员端首页输入班级码
            </div>
          )}
        </div>

        {/* Summary card */}
        <div style={{ ...styles.summaryCard, background: `linear-gradient(135deg, ${petDef.themeAccent}cc, #764ba2)` }}>
          <div style={styles.summaryLeft}>
            <div style={styles.summaryTitle}>👋 {childName}的学习档案</div>
            <div style={styles.summaryRow}>
              <span>{pet.name}</span>
              <span style={styles.tag}>{stageDef.name}</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              经验值 {pet.exp} · 饱食度 {Math.round(pet.hunger)}%
            </div>
            {streak > 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: 700 }}>
                🔥 连续打卡 {streak} 天 · 最高 {bestStreak} 天
              </div>
            )}
            {onOpenReport && (
              <button style={styles.reportBtn} onClick={onOpenReport}>📊 月度报告</button>
            )}
          </div>
          <div style={styles.summaryRight}>
            <div style={styles.petAvatarWrap}>
              <img src={imgUrl} alt={pet.name} style={styles.petAvatar} />
            </div>
          </div>
        </div>

        {/* 今日任务进度（只读）*/}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            今日任务进度
            <span style={styles.badge}>{confirmed}/{todayTasks.length} 已完成</span>
          </div>
          {todayTasks.length === 0 && <div style={styles.empty}>老师还未布置今日任务</div>}
          {todayTasks.map(task => (
            <div key={task.id} style={{ ...styles.taskRow, opacity: task.status === 'confirmed' ? 0.6 : 1 }}>
              <span style={styles.taskIcon}>{task.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, textDecoration: task.status === 'confirmed' ? 'line-through' : 'none', color: task.status === 'confirmed' ? '#aaa' : '#1a1a2e' }}>
                  {task.name}
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>+{task.points} 经验</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                background: task.status === 'confirmed' ? '#f6ffed' : task.status === 'done' ? '#fff7e6' : '#f5f5f5',
                color: task.status === 'confirmed' ? '#52c41a' : task.status === 'done' ? '#faad14' : '#bbb',
              }}>
                {task.status === 'confirmed' ? '✅ 已完成' : task.status === 'done' ? '⏳ 完成中' : '未完成'}
              </span>
            </div>
          ))}
        </div>

        {/* 本月统计 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>本月学习统计</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: '完成任务', value: ms.confirmed || 0, unit: '个' },
              { label: '获得经验', value: ms.exp || 0, unit: 'xp' },
              { label: '最高连击', value: bestStreak || 0, unit: '天' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{ background: '#f8f8fc', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: petDef.themeAccent }}>{value}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{unit} · {label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 模式逃生通道：让被锁在校园模式的家长能切换回家庭/家校联合 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎯 切换使用模式</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            当前仅可观察。若想为孩子布置家庭任务，可切换到「家庭模式」或「家校联合」。
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {MODE_ORDER.filter(k => k !== MODE.CAMPUS).map(key => {
              const m = MODE_META[key]
              return (
                <button
                  key={key}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10,
                    border: `1.5px solid ${m.border}`,
                    background: m.gradient,
                    color: m.color, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onClick={() => onSetAppMode?.(key)}
                >
                  {m.icon} 切到 {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 数据导出（家长依然需要） */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>💾 数据备份</div>
          <div style={styles.settingRow}>
            <button style={styles.settingBtn} onClick={onExport}>📤 导出</button>
            <button style={styles.settingBtn} onClick={() => importRef.current?.click()}>📥 导入</button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      {/* Summary card */}
      <div style={{ ...styles.summaryCard, background: `linear-gradient(135deg, ${petDef.themeAccent}cc, #764ba2)` }}>
        <div style={styles.summaryLeft}>
          <div style={styles.summaryTitle}>👋 {childName}的学习档案</div>
          <div style={styles.summaryRow}>
            <span>{pet.name}</span>
            <span style={styles.tag}>{stageDef.name}</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            经验值 {pet.exp} · 饱食度 {Math.round(pet.hunger)}%
          </div>
          {onOpenReport && (
            <button style={styles.reportBtn} onClick={onOpenReport}>
              📊 月度报告
            </button>
          )}
          {streak > 0 && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: 700 }}>
              🔥 连续打卡 {streak} 天 · 最高 {bestStreak} 天
            </div>
          )}
        </div>
        <div style={styles.summaryRight}>
          <div style={styles.petAvatarWrap}>
            <img src={imgUrl} alt={pet.name} style={styles.petAvatar} />
          </div>
        </div>
      </div>

      {/* Pending confirmations */}
      {pending > 0 && (
        <div style={styles.alertCard}>
          <div style={styles.alertTitle}>⏳ 待确认任务 ({pending})</div>
          {todayTasks.filter(t => t.status === 'done').map(task => (
            <div key={task.id} style={styles.confirmRow}>
              <span>{task.icon} {task.name}</span>
              <button style={styles.confirmBtn} onClick={() => handleConfirm(task.id)}>
                ✅ 确认完成
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Today's tasks */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            今日任务
            <span style={styles.badge}>{confirmed}/{todayTasks.length} 已完成</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.iconBtn} onClick={onRefreshTasks} title="刷新今日任务">🔄</button>
            <button style={styles.iconBtn} onClick={() => setShowAdd(!showAdd)} title="添加任务">➕</button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} style={styles.addForm}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TASK_ICONS.map(ic => (
                <span
                  key={ic}
                  style={{ ...styles.iconPicker, background: newTask.icon === ic ? '#667eea22' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setNewTask(p => ({ ...p, icon: ic }))}
                >{ic}</span>
              ))}
            </div>
            <input
              style={styles.input}
              placeholder="任务名称，例如：背诵课文"
              value={newTask.name}
              onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
            />
            {/* Category picker */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>分类</label>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  style={{
                    ...styles.catChip,
                    background: newTask.category === c ? '#667eea' : '#efefef',
                    color: newTask.category === c ? '#fff' : '#666',
                  }}
                  onClick={() => setNewTask(p => ({ ...p, category: c }))}
                >{c}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>经验值</label>
              <input
                style={{ ...styles.input, width: 80 }}
                type="number"
                min={5}
                max={50}
                value={newTask.points}
                onChange={e => setNewTask(p => ({ ...p, points: e.target.value }))}
              />
              <button style={styles.addBtn} type="submit">添加</button>
            </div>
          </form>
        )}

        {/* Category filter tabs */}
        {todayTasks.length > 0 && availableCats.length > 2 && (
          <div style={styles.filterTabs}>
            {availableCats.map(cat => (
              <button
                key={cat}
                style={{
                  ...styles.filterTab,
                  background: effectiveFilter === cat ? '#667eea' : '#f5f5f5',
                  color: effectiveFilter === cat ? '#fff' : '#666',
                }}
                onClick={() => setFilterCat(cat)}
              >{cat}</button>
            ))}
          </div>
        )}

        {todayTasks.length === 0 && (
          <div style={styles.empty}>点击 ➕ 添加今日任务，或点击 🔄 使用模板任务</div>
        )}
        {todayTasks.length > 0 && filteredTasks.length === 0 && (
          <div style={styles.empty}>{effectiveFilter} 分类暂无任务</div>
        )}
        {filteredTasks.map(task => (
          <ParentTaskItem key={task.id} task={task} onConfirm={handleConfirm} onDelete={onDeleteTask} />
        ))}
      </div>

      {/* 7-day history */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📊 近7天完成情况</div>
        {history.length === 0 ? (
          <div style={styles.empty}>暂无历史数据</div>
        ) : (
          <div style={styles.chartWrap}>
            {history.map((h) => {
              const pct = h.total > 0 ? h.done / h.total : 0
              const dateObj = new Date(h.date)
              const dayLabel = weekDays[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]
              return (
                <div key={h.date} style={styles.bar}>
                  <div style={styles.barOuter}>
                    <div
                      style={{
                        ...styles.barInner,
                        height: `${Math.max(4, pct * 100)}%`,
                        background: pct >= 0.8 ? '#52c41a' : pct >= 0.5 ? '#faad14' : '#ff4d4f',
                      }}
                    />
                  </div>
                  <div style={styles.barDate}>周{dayLabel}</div>
                  <div style={styles.barPct}>{h.done}/{h.total}</div>
                </div>
              )
            })}
          </div>
        )}
        <CalendarView tasks={state.tasks || []} />
      </div>

      {/* Pet growth album */}
      {state.evolutionLog?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📸 成长相册</div>
          <PetAlbum evolutionLog={state.evolutionLog} petType={state.petType} />
        </div>
      )}

      {/* ⚙️ Management settings */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>⚙️ 管理设置</div>

        {/* Rename */}
        <div style={styles.settingGroup}>
          <div style={styles.settingLabel}>修改名字</div>
          <div style={styles.settingRow}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder={`宠物名（当前：${pet.name}）`}
              value={renPet}
              onChange={e => setRenPet(e.target.value)}
            />
            <button
              style={styles.settingBtn}
              onClick={() => { if (renPet.trim()) { onRenamePet?.(renPet.trim()); setRenPet('') } }}
            >改名</button>
          </div>
          <div style={styles.settingRow}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder={`孩子名（当前：${childName}）`}
              value={renChild}
              onChange={e => setRenChild(e.target.value)}
            />
            <button
              style={styles.settingBtn}
              onClick={() => { if (renChild.trim()) { onRenameChild?.(renChild.trim()); setRenChild('') } }}
            >改名</button>
          </div>
        </div>

        {/* Export / Import */}
        <div style={styles.settingGroup}>
          <div style={styles.settingLabel}>数据管理</div>
          <div style={styles.settingRow}>
            <button style={styles.settingBtn} onClick={onExport}>📤 导出备份</button>
            <button style={styles.settingBtn} onClick={() => importRef.current?.click()}>📥 导入恢复</button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
            导出后可在新设备导入，完整恢复学习记录
          </div>
        </div>

        {/* Notifications */}
        <div style={styles.settingGroup}>
          <div style={styles.settingLabel}>提醒通知{notifOn ? ' ✅ 已开启' : ''}</div>
          <div style={styles.settingRow}>
            <button style={styles.settingBtn} onClick={handleNotifToggle}>
              {notifOn ? '🔕 关闭提醒' : '🔔 开启提醒'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
            宠物饥饿时自动提醒（需要浏览器通知权限）
          </div>
        </div>

        {/* 使用模式切换 */}
        <div style={styles.settingGroup}>
          <div style={styles.settingLabel}>
            🎯 使用模式
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 999,
              background: MODE_META[appMode]?.color + '22',
              color: MODE_META[appMode]?.color,
            }}>
              {MODE_META[appMode]?.icon} 当前：{MODE_META[appMode]?.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            {MODE_META[appMode]?.desc}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MODE_ORDER.filter(k => k !== appMode).map(key => {
              const m = MODE_META[key]
              const pending = modeSwitchTo === key
              return (
                <button
                  key={key}
                  style={{
                    flex: 1,
                    minWidth: 100,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: pending ? `2px solid ${m.color}` : `1.5px solid ${m.border}`,
                    background: pending ? m.color : m.gradient,
                    color: pending ? '#fff' : m.color,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onClick={() => {
                    if (pending) {
                      onSetAppMode?.(key)
                      setModeSwitchTo(null)
                    } else {
                      setModeSwitchTo(key)
                      setTimeout(() => setModeSwitchTo(curr => curr === key ? null : curr), 3000)
                    }
                  }}
                >
                  {pending ? `✓ 确认切到 ${m.label}` : `${m.icon} 切到 ${m.label}`}
                </button>
              )
            })}
          </div>
          {modeSwitchTo && (
            <div style={{ fontSize: 11, color: '#fa8c16', marginTop: 6 }}>
              ⚠️ 再次点击同一按钮以确认切换（3 秒后自动取消）
              {MODE_META[modeSwitchTo]?.needs === 'classCode' && !state.classCode &&
                '；切换后请前往下方「家校联动」绑定班级码'}
            </div>
          )}
        </div>

        {/* 家校联动 */}
        <div style={styles.settingGroup}>
          <div style={styles.settingLabel}>
            🏫 家校联动
            {state.classCode && <span style={{ color: '#52c41a', marginLeft: 6 }}>✅ 已连接</span>}
          </div>
          {state.classCode ? (
            <div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
                已加入班级码：<strong style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{state.classCode}</strong>
                <br />
                <span style={{ fontSize: 12, color: '#aaa' }}>教师布置的作业将每日自动出现在任务列表</span>
              </div>
              <button style={{ ...styles.settingBtn, background: '#fff1f0', color: '#f5222d' }} onClick={handleLeaveClass}>
                🚪 退出班级
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                输入教师提供的班级码，连接后教师作业自动同步到孩子任务列表
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input
                  style={{ ...styles.input, flex: 1, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace' }}
                  placeholder="班级码（6位）"
                  value={classInput}
                  onChange={e => { setClassInput(e.target.value); setClassLookup(null); setClassLookupErr('') }}
                  onKeyDown={e => e.key === 'Enter' && handleClassLookup()}
                  maxLength={6}
                />
                <button style={styles.settingBtn} onClick={handleClassLookup}>查询</button>
              </div>
              {classInput !== DEMO_CLASS_CODE && !classLookup && (
                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #fff8d0, #fffbe6)',
                    border: '1.5px dashed #ffd666',
                    borderRadius: 10,
                    padding: '6px 10px',
                    fontSize: 12,
                    color: '#8c6a00',
                    cursor: 'pointer',
                    marginBottom: 6,
                    fontFamily: 'inherit',
                  }}
                  onClick={() => { setClassInput(DEMO_CLASS_CODE); setClassLookupErr('') }}
                >
                  💡 试试演示班级 <strong style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{DEMO_CLASS_CODE}</strong>
                </button>
              )}
              {classLookupErr && (
                <div style={{ fontSize: 12, color: '#f5222d', marginBottom: 6 }}>{classLookupErr}</div>
              )}
              {classLookup && (
                <div style={{ background: '#f6ffed', border: '1.5px solid #b7eb8f', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#389e0d' }}>✅ 找到班级！</div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                    {classLookup.teacherName} · {classLookup.className}
                  </div>
                  <button style={{ ...styles.settingBtn, background: '#52c41a', color: '#fff', marginTop: 8 }} onClick={handleJoinClass}>
                    加入班级
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PIN lock */}
        <div style={styles.settingGroup}>
          <div style={styles.settingLabel}>家长 PIN 锁{pinEnabled ? ' ✅ 已启用' : ''}</div>
          <div style={styles.settingRow}>
            {!pinEnabled && (
              <button style={styles.settingBtn} onClick={onSetupPin}>🔐 设置 PIN</button>
            )}
            {pinEnabled && (
              <>
                <button style={styles.settingBtn} onClick={onChangePin}>✏️ 修改 PIN</button>
                <button style={{ ...styles.settingBtn, background: '#fff1f0', color: '#f5222d' }} onClick={onClearPin}>
                  🔓 关闭 PIN
                </button>
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
            {pinEnabled ? '切换到家长端时需要输入 PIN 码' : '开启后切换家长端需要验证'}
          </div>
        </div>
      </div>

      {/* 30-day monthly stats */}
      {monthlyStats && monthlyStats.total > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📈 近30天统计</div>
          <div style={styles.monthlyRow}>
            <div style={styles.monthlyCard}>
              <div style={styles.monthlyNum}>{monthlyStats.confirmed}</div>
              <div style={styles.monthlySub}>已完成</div>
            </div>
            <div style={styles.monthlyCard}>
              <div style={styles.monthlyNum}>{monthlyStats.total}</div>
              <div style={styles.monthlySub}>总任务</div>
            </div>
            <div style={{
              ...styles.monthlyCard,
              background: monthlyStats.rate >= 80 ? '#f6ffed' : monthlyStats.rate >= 50 ? '#fffbe6' : '#fff1f0',
            }}>
              <div style={{
                ...styles.monthlyNum,
                color: monthlyStats.rate >= 80 ? '#52c41a' : monthlyStats.rate >= 50 ? '#faad14' : '#f5222d',
              }}>{monthlyStats.rate}%</div>
              <div style={styles.monthlySub}>完成率</div>
            </div>
          </div>
          {Object.entries(monthlyStats.byCategory).map(([cat, v]) => (
            <div key={cat} style={styles.catStatRow}>
              <div style={styles.catStatLabel}>{cat}</div>
              <div style={styles.catBarBg}>
                <div style={{
                  ...styles.catBarFill,
                  width: `${v.total > 0 ? Math.round(v.done / v.total * 100) : 0}%`,
                }} />
              </div>
              <div style={styles.catStatNum}>{v.done}/{v.total}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ParentTaskItem({ task, onConfirm, onDelete }) {
  const statusMap = {
    pending: { label: '未完成', color: '#d9d9d9', textColor: '#bbb' },
    done: { label: '待确认 →', color: '#faad14', textColor: '#fff' },
    confirmed: { label: '✅ 已确认', color: '#f6ffed', textColor: '#52c41a' },
  }
  const s = statusMap[task.status]
  return (
    <div style={styles.taskRow}>
      <span style={styles.taskIcon}>{task.icon}</span>
      <div style={styles.taskInfo}>
        <span style={{ fontWeight: 600 }}>{task.name}</span>
        <span style={{ fontSize: 12, color: '#aaa', marginLeft: 6 }}>+{task.points}exp</span>
      </div>
      <button
        style={{ ...styles.statusBtn, background: s.color, color: s.textColor, cursor: task.status === 'done' ? 'pointer' : 'default' }}
        onClick={task.status === 'done' ? () => onConfirm(task.id) : undefined}
        disabled={task.status !== 'done'}
      >
        {s.label}
      </button>
      {task.status !== 'confirmed' && (
        <button style={styles.deleteBtn} onClick={() => onDelete(task.id)} title="删除任务">✕</button>
      )}
    </div>
  )
}

const styles = {
  wrap: { padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 },
  summaryCard: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: 20,
    padding: '20px',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLeft: { flex: 1 },
  summaryTitle: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  summaryRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 },
  tag: { background: 'rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: 999, fontSize: 13 },
  summaryRight: { marginLeft: 16 },
  petAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  petAvatar: { width: 72, height: 72, objectFit: 'contain', mixBlendMode: 'multiply' },
  alertCard: {
    background: '#fffbe6',
    border: '2px solid #ffe58f',
    borderRadius: 16,
    padding: '16px',
  },
  alertTitle: { fontWeight: 700, fontSize: 15, marginBottom: 10, color: '#ad6800' },
  confirmRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fff3b0', fontSize: 14 },
  confirmBtn: { background: '#52c41a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  section: { background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
  badge: { background: '#667eea', color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 13 },
  iconBtn: { background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 18 },
  addForm: { background: '#f9f9f9', borderRadius: 12, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  iconPicker: { fontSize: 22, padding: '4px', borderRadius: 8, border: '2px solid transparent' },
  input: { padding: '10px 12px', borderRadius: 10, border: '1.5px solid #eee', fontSize: 15, flex: 1 },
  addBtn: { padding: '10px 18px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  empty: { color: '#bbb', textAlign: 'center', padding: '20px 0', fontSize: 14 },
  taskRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  taskIcon: { fontSize: 22 },
  taskInfo: { flex: 1, fontSize: 14 },
  statusBtn: { padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600 },
  deleteBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: 16, cursor: 'pointer', padding: '4px 6px', marginLeft: 2, lineHeight: 1 },
  chartWrap: { display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center', padding: '8px 0' },
  bar: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 },
  barOuter: { width: '100%', height: 80, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barInner: { width: '100%', borderRadius: 8, transition: 'height 0.4s ease' },
  barDate: { fontSize: 12, color: '#999' },
  barPct: { fontSize: 11, color: '#bbb' },
  // Category filter
  filterTabs: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  filterTab: { padding: '4px 14px', borderRadius: 999, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  catChip: { padding: '4px 12px', borderRadius: 999, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  // Monthly stats
  monthlyRow: { display: 'flex', gap: 8, marginBottom: 14 },
  monthlyCard: { flex: 1, background: '#f8f8fc', borderRadius: 12, padding: '12px 8px', textAlign: 'center' },
  monthlyNum: { fontSize: 22, fontWeight: 800, color: '#667eea' },
  monthlySub: { fontSize: 11, color: '#999', marginTop: 2 },
  catStatRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  catStatLabel: { width: 36, fontSize: 12, color: '#555', fontWeight: 700, flexShrink: 0 },
  catBarBg: { flex: 1, height: 8, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden' },
  catBarFill: { height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 999, transition: 'width 0.5s ease' },
  catStatNum: { width: 36, fontSize: 11, color: '#aaa', textAlign: 'right', flexShrink: 0 },
  settingGroup: { marginTop: 16, paddingTop: 16, borderTop: '1px solid #f5f5f5' },
  settingLabel: { fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 8 },
  settingRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  reportBtn: {
    marginTop: 10,
    padding: '7px 16px',
    background: 'rgba(255,255,255,0.2)',
    border: '1.5px solid rgba(255,255,255,0.4)',
    borderRadius: 999,
    fontSize: 13, fontWeight: 700,
    color: '#fff', cursor: 'pointer',
    display: 'inline-block',
  },
  settingBtn: {
    padding: '8px 14px',
    background: '#f5f5f7',
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#444',
    whiteSpace: 'nowrap',
  },
}
