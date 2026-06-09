/**
 * ParentEntry — 独立的家长入口（#parent）
 *
 * 流程：
 *   ① 列出所有档案（多孩家庭）→ 家长挑选一个孩子
 *   ② 若该档案启用了 PIN → 走 PIN 校验
 *   ③ 进入完整 ParentView（沿用 useAppStore + 现有家长面板）
 *   ④ 顶部"切换孩子"按钮回到选择页
 *
 * 与学员 App 内的家长 Tab 共享同一 localStorage profile，写回即刻生效。
 */
import { useState, lazy, Suspense } from 'react'
import {
  useAppStore, PET_TYPES, getPetImageUrl,
  getProfiles, getProfileSnapshot,
  hasPinCode,
  exportData, importData,
} from '../store'
import { MODE_META } from './ModeSelect'
import { MODE } from '../constants/modes'
import PinModal from './PinModal'

const ParentView    = lazy(() => import('./ParentView'))
const MonthlyReport = lazy(() => import('./MonthlyReport'))

export default function ParentEntry() {
  const [picked, setPicked]         = useState(null)   // profileId
  const [unlocked, setUnlocked]     = useState(false)
  const [showPin, setShowPin]       = useState(false)
  const [showReport, setShowReport] = useState(false)

  // ── 未选孩子：渲染孩子卡片选择页 ─────────────────────────
  if (!picked) {
    const profiles  = getProfiles()
    const snapshots = profiles.map(p => getProfileSnapshot(p.id)).filter(Boolean)

    function pickProfile(id) {
      setPicked(id)
      if (hasPinCode()) {
        setShowPin(true)
        setUnlocked(false)
      } else {
        setUnlocked(true)
      }
    }

    return (
      <div style={S.shell}>
        <div style={S.card}>
          <div style={S.header}>
            <div style={S.titleRow}>
              <span style={S.titleIcon}>👨‍👩‍👧</span>
              <div>
                <div style={S.title}>家长入口</div>
                <div style={S.subtitle}>选择要管理的孩子档案</div>
              </div>
            </div>
            <a href="#" style={S.backLink}>← 学员端</a>
          </div>

          {snapshots.length === 0 && (
            <div style={S.empty}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🥚</div>
              <div style={{ fontSize: 15, color: '#888', marginBottom: 16 }}>
                还没有任何孩子档案
              </div>
              <a href="#" style={S.primaryLink}>前往学员端开始养成 →</a>
            </div>
          )}

          <div style={S.list}>
            {snapshots.map(s => {
              const pet  = PET_TYPES[s.petType] || PET_TYPES['west-highland']
              const mode = MODE_META[s.appMode]
              const imgUrl = getPetImageUrl(s.petType, s.petStage)
              return (
                <button
                  key={s.id}
                  style={{
                    ...S.profileCard,
                    background: pet.theme,
                    border: `2px solid ${pet.themeAccent}33`,
                  }}
                  onClick={() => pickProfile(s.id)}
                >
                  <img src={imgUrl} alt={s.petName} style={S.avatar} />
                  <div style={S.info}>
                    <div style={S.cardTitle}>
                      {s.childName}
                      <span style={S.cardLabel}>· {s.label}</span>
                    </div>
                    <div style={S.cardLine}>
                      <span style={{ color: pet.themeAccent, fontWeight: 700 }}>{s.petName}</span>
                      <span style={S.expChip}>{s.exp} xp</span>
                      {s.streak > 0 && <span style={S.streakChip}>🔥 {s.streak}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <span style={{
                        ...S.modeChip,
                        background: mode.color + '22',
                        color: mode.color,
                      }}>
                        {mode.icon} {mode.label}
                      </span>
                      {s.classCode && (
                        <span style={S.codeChip}>🏫 {s.classCode}</span>
                      )}
                    </div>
                  </div>
                  <span style={S.arrow}>›</span>
                </button>
              )
            })}
          </div>

          {hasPinCode() && (
            <div style={S.pinHint}>🔒 进入档案需要 PIN 验证</div>
          )}
        </div>

        {/* PIN 弹窗（在卡片选择层时不会渲染，因为还没 picked）*/}
      </div>
    )
  }

  // ── 已选孩子，但 PIN 未通过：保持卡片选择 + PIN 弹窗 ────────
  if (!unlocked) {
    return (
      <div style={S.shell}>
        <div style={{ ...S.card, opacity: 0.5 }}>
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
            等待 PIN 验证…
          </div>
        </div>
        {showPin && (
          <PinModal
            mode="verify"
            onSuccess={() => { setShowPin(false); setUnlocked(true) }}
            onCancel={() => { setShowPin(false); setPicked(null) }}
          />
        )}
      </div>
    )
  }

  // ── 进入完整家长面板 ──────────────────────────────
  return <ParentDashboard profileId={picked} onSwitch={() => { setPicked(null); setUnlocked(false) }} onOpenReport={() => setShowReport(true)} showReport={showReport} onCloseReport={() => setShowReport(false)} />
}

function ParentDashboard({ profileId, onSwitch, onOpenReport, showReport, onCloseReport }) {
  const store = useAppStore(profileId)
  const pet   = PET_TYPES[store.petType] || PET_TYPES['west-highland']
  const mode  = MODE_META[store.appMode]

  function handleExport()    { exportData(store) }
  function handleImport(file) {
    const r = new FileReader()
    r.onload = e => {
      if (importData(e.target.result, profileId)) window.location.reload()
      else alert('导入失败：文件格式不正确')
    }
    r.readAsText(file)
  }

  return (
    <div style={S.shell}>
      <div style={S.card}>
        {/* Header */}
        <div style={{ ...S.dashHeader, background: `linear-gradient(135deg, ${pet.themeAccent}cc, #764ba2)` }}>
          <button style={S.switchBtn} onClick={onSwitch}>← 切换孩子</button>
          <div style={S.dashTitle}>
            {store.appMode === MODE.CAMPUS ? '👁 学习观察' :
             store.appMode === MODE.SCHOOL_HOME ? '🤝 家校联合' : '👨‍👩‍👧 家长管理'}
          </div>
          <span style={{
            ...S.dashMode,
            background: '#ffffff33',
          }}>
            {mode.icon} {store.childName}
          </span>
        </div>

        {/* Body — 复用既有 ParentView，所有 props 跟主 App 同款 */}
        <div style={S.dashBody}>
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>⏳</div>}>
            <ParentView
              state={store}
              todayTasks={store.todayTasks}
              history={store.history}
              onConfirm={store.confirmTask}
              onAddTask={store.addTask}
              onDeleteTask={store.deleteTask}
              onRefreshTasks={store.refreshDailyTasks}
              onRenamePet={store.renamePet}
              onRenameChild={store.renameChild}
              onExport={handleExport}
              onImport={handleImport}
              pinEnabled={false}        /* 已在外层 gate 过，避免重复管理 */
              onSetupPin={() => alert('请在学员 App 内设置 PIN')}
              onChangePin={() => alert('请在学员 App 内修改 PIN')}
              onClearPin={() => alert('请在学员 App 内清除 PIN')}
              onOpenReport={onOpenReport}
              onSetClassCode={store.setClassCode}
              appMode={store.appMode}
              onSetAppMode={store.setAppMode}
            />
          </Suspense>
        </div>
      </div>

      {showReport && (
        <Suspense fallback={null}>
          <MonthlyReport state={store} onClose={onCloseReport} />
        </Suspense>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────
const S = {
  shell: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #d9afd9 0%, #97d9e1 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '20px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    minHeight: 600,
  },

  // ── Profile picker
  header: {
    padding: '22px 22px 14px',
    background: 'linear-gradient(135deg, #f0eaff, #e0f0ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f0f0f0',
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12 },
  titleIcon: { fontSize: 30 },
  title: { fontSize: 18, fontWeight: 800, color: '#1a1a2e' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  backLink: { fontSize: 13, color: '#667eea', textDecoration: 'none', fontWeight: 600 },
  list: { padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 14px 14px 12px',
    borderRadius: 16,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'inherit',
  },
  avatar: {
    width: 64,
    height: 64,
    objectFit: 'contain',
    mixBlendMode: 'multiply',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: 800, color: '#1a1a2e', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  cardLabel: { fontSize: 11, fontWeight: 600, color: '#aaa' },
  cardLine: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 3 },
  expChip: { background: 'rgba(255,255,255,0.7)', padding: '1px 8px', borderRadius: 999, fontSize: 11, color: '#666' },
  streakChip: { background: '#fff7e6', color: '#fa8c16', padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 },
  modeChip: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 },
  codeChip: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#fff', color: '#52c41a', border: '1px solid #b7eb8f', fontFamily: 'monospace', letterSpacing: 1 },
  arrow: { fontSize: 24, color: '#bbb', flexShrink: 0 },
  empty: { padding: '50px 30px', textAlign: 'center' },
  primaryLink: { display: 'inline-block', padding: '10px 20px', background: '#667eea', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 },
  pinHint: { padding: '12px 16px 20px', textAlign: 'center', fontSize: 12, color: '#aaa' },

  // ── Dashboard
  dashHeader: {
    padding: '16px 16px 14px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  switchBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: 999,
    padding: '5px 12px',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  dashTitle: { fontSize: 16, fontWeight: 800, flex: 1, textAlign: 'center' },
  dashMode: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap' },
  dashBody: { padding: '14px 14px 20px', maxHeight: 'calc(100vh - 130px)', overflowY: 'auto' },
}
