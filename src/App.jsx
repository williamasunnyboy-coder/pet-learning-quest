import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import Setup from './components/Setup'
import PetView from './components/PetView'
import ParentView from './components/ParentView'
import EvolutionModal from './components/EvolutionModal'
import PinModal from './components/PinModal'
import RoleLanding from './components/RoleLanding'
import { getPreferredRole } from './role-prefs'
const DecorationModal = lazy(() => import('./components/DecorationModal'))
const MonthlyReport   = lazy(() => import('./components/MonthlyReport'))
const ProfileCompare  = lazy(() => import('./components/ProfileCompare'))
import {
  useAppStore, PET_TYPES,
  getProfiles, getCurrentProfileId, setCurrentProfileId,
  createProfile, deleteProfile,
  hasPinCode, clearPinCode,
  exportData, importData,
  getEarnedAchievements,
  getProfileSnapshot,
} from './store'
import { MODE } from './constants/modes'
import { getUnlockedDecorations } from './decorations'
import { getSoundEnabled, setSoundEnabled } from './sounds'
import { showPetNotification } from './notifications'
import { startWeeklyPushDaemon } from './weekly-push'
import './App.css'

const AdminPanel   = lazy(() => import('./components/AdminPanel'))
const TeacherPanel = lazy(() => import('./components/TeacherPanel'))
const ParentEntry  = lazy(() => import('./components/ParentEntry'))
const WatchView    = lazy(() => import('./components/WatchView'))

const SPINNER = <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:32 }}>⏳</div>

function AppRouter() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  if (hash === '#admin')   return <Suspense fallback={SPINNER}><AdminPanel /></Suspense>
  if (hash === '#teacher') return <Suspense fallback={SPINNER}><TeacherPanel /></Suspense>
  if (hash === '#parent')  return <Suspense fallback={SPINNER}><ParentEntry /></Suspense>
  if (hash === '#watch')   return <Suspense fallback={SPINNER}><WatchView /></Suspense>
  return <App />
}

export default AppRouter

function App() {
  const [mode, setMode]                 = useState('child')
  const [showEvolution, setShowEvolution] = useState(false)
  const [profileId, setProfileId]       = useState(getCurrentProfileId)
  const [profiles, setProfiles]         = useState(getProfiles)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [parentUnlocked, setParentUnlocked]   = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinMode, setPinMode]           = useState('verify')
  const [pinActive, setPinActive]       = useState(hasPinCode)
  const [showDecoModal, setShowDecoModal] = useState(false)
  const [showReport, setShowReport]     = useState(false)
  const prevStageRef  = useRef(null)
  const bonusShownRef = useRef(false)
  const store = useAppStore(profileId)
  const [soundOn, setSoundOn]       = useState(getSoundEnabled)
  const [showCompare, setShowCompare] = useState(false)
  const [loginToast, setLoginToast]   = useState(false)
  const [profileAddInput, setProfileAddInput] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const deleteConfirmTimerRef = useRef(null)

  const petDef = PET_TYPES[store.petType] || PET_TYPES['west-highland']

  // Detect evolution
  useEffect(() => {
    if (prevStageRef.current === null) {
      prevStageRef.current = store.petStage
      return
    }
    if (store.petStage > prevStageRef.current) {
      setShowEvolution(true)
      store.recordEvolution(store.petStage, store.pet.name)
    }
    prevStageRef.current = store.petStage
    // 仅在进化阶段变化时触发；引入整个 store 会造成不必要的重跑
  }, [store.petStage]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Daily login bonus toast ───────────────────────
  useEffect(() => {
    if (store._dailyBonusToday && !bonusShownRef.current) {
      bonusShownRef.current = true
      setLoginToast(true)
      const t = setTimeout(() => setLoginToast(false), 3000)
      return () => clearTimeout(t)
    }
  }, [store._dailyBonusToday])

  // ── Pet hunger notification on app resume ─────────
  useEffect(() => {
    if (!store.initialized) return
    const petName   = store.pet?.name
    const petHunger = store.pet?.hunger
    const onVis = () => {
      if (document.visibilityState === 'visible' && petHunger < 30) {
        showPetNotification(
          `${petName} 需要你！`,
          `${petName} 已经很久没吃东西了，快去完成任务喂食吧！`
        )
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [store.initialized, store.pet?.hunger, store.pet?.name])

  // ── Weekly growth report push（周日晚 8 点） ────────
  useEffect(() => {
    if (!store.initialized) return
    return startWeeklyPushDaemon(profileId)
  }, [store.initialized, profileId])

  // ── Profile helpers ──────────────────────────────
  function switchProfile(id) {
    setCurrentProfileId(id)
    setProfileId(id)
    setShowProfileMenu(false)
    setMode('child')
    setParentUnlocked(false)
    prevStageRef.current = null
  }

  function handleAddProfile() {
    if (!profileAddInput.trim()) return
    const id = createProfile(profileAddInput.trim())
    setProfiles(getProfiles())
    setProfileAddInput('')
    switchProfile(id)
  }

  function handleDeleteProfile(id) {
    if (deleteConfirmId === id) {
      // 二次确认通过 → 真正删除
      clearTimeout(deleteConfirmTimerRef.current)
      setDeleteConfirmId(null)
      deleteProfile(id)
      const updated = getProfiles()
      setProfiles(updated)
      if (profileId === id) switchProfile('default')
    } else {
      // 第一次点击 → 进入待确认状态，3秒后自动取消
      setDeleteConfirmId(id)
      clearTimeout(deleteConfirmTimerRef.current)
      deleteConfirmTimerRef.current = setTimeout(() => setDeleteConfirmId(null), 3000)
    }
  }

  // ── Parent tab click ─────────────────────────────
  function handleParentTabClick() {
    if (mode === 'parent') return
    if (pinActive && !parentUnlocked) {
      setPinMode('verify')
      setShowPinModal(true)
    } else {
      setMode('parent')
      setParentUnlocked(true)
    }
  }

  function handleChildTabClick() {
    setMode('child')
    setParentUnlocked(false)
  }

  // ── PIN modal callbacks ───────────────────────────
  function onPinSuccess() {
    setShowPinModal(false)
    if (pinMode === 'verify') {
      setMode('parent')
      setParentUnlocked(true)
    } else {
      // setup or change — PIN was saved inside PinModal
      setPinActive(true)
    }
  }

  function onPinCancel() {
    setShowPinModal(false)
  }

  // ── Export / Import ───────────────────────────────
  function handleExport() {
    exportData(store)
  }

  function handleImport(file) {
    const reader = new FileReader()
    reader.onload = e => {
      if (importData(e.target.result, profileId)) {
        window.location.reload()
      } else {
        alert('导入失败：文件格式不正确，请检查后重试')
      }
    }
    reader.readAsText(file)
  }

  // ── Sound toggle ──────────────────────────────────
  function handleSoundToggle() {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
  }

  // ── PIN management passthrough ────────────────────
  function handleSetupPin()  { setPinMode('setup');  setShowPinModal(true) }
  function handleChangePin() { setPinMode('change'); setShowPinModal(true) }
  function handleClearPin()  {
    clearPinCode()
    setPinActive(false)
    setParentUnlocked(false)
  }

  // ── Computed ──────────────────────────────────────
  const achievements  = getEarnedAchievements(store)
  const decorations   = getUnlockedDecorations(store)
  const currentProfileLabel = profiles.find(p => p.id === profileId)?.label || '档案 1'

  // ── 角色选择 Landing：未初始化 + 未选过角色时显示 ───
  const [roleConfirmed, setRoleConfirmed] = useState(() => !!getPreferredRole())
  if (!store.initialized && !roleConfirmed) {
    return <RoleLanding onRoleSelect={() => setRoleConfirmed(true)} />
  }

  if (!store.initialized) {
    return <Setup onSetup={store.setup} />
  }

  return (
    <div style={styles.shell}>
      <div style={styles.phone}>
        {/* Header */}
        <div style={{ ...styles.header, background: `linear-gradient(135deg, ${petDef.themeAccent}cc, #764ba2)` }}>
          <div style={styles.headerTop}>
            <div style={styles.headerTitle}>
              {mode === 'child'
                ? `${store.childName}的宠物`
                : store.appMode === MODE.CAMPUS ? '学习观察'
                : store.appMode === MODE.SCHOOL_HOME ? '家校联合管理台'
                : '家长管理台'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {store.streak > 0 && mode === 'child' && (
                <div style={styles.headerStreak}>🔥 {store.streak}</div>
              )}
              {/* Sound toggle */}
              <button
                style={styles.soundBtn}
                onClick={handleSoundToggle}
                title={soundOn ? '关闭音效' : '开启音效'}
                aria-label={soundOn ? '关闭音效' : '开启音效'}
                aria-pressed={soundOn}
              >
                <span aria-hidden="true">{soundOn ? '🔊' : '🔇'}</span>
              </button>
              {/* Profile switcher chip */}
              <button
                style={styles.profileChip}
                onClick={() => setShowProfileMenu(true)}
                aria-label={`切换档案，当前 ${currentProfileLabel}`}
                aria-haspopup="dialog"
              >
                <span aria-hidden="true">👤</span> {currentProfileLabel}
              </button>
            </div>
          </div>
          <div style={styles.tabRow} role="tablist" aria-label="切换孩子端/家长端">
            <button
              style={{ ...styles.tab, ...(mode === 'child' ? styles.tabActive : {}) }}
              onClick={handleChildTabClick}
              role="tab"
              aria-selected={mode === 'child'}
            >
              <span aria-hidden="true">{petDef.emoji}</span> 孩子端
            </button>
            <button
              style={{ ...styles.tab, ...(mode === 'parent' ? styles.tabActive : {}) }}
              onClick={handleParentTabClick}
              role="tab"
              aria-selected={mode === 'parent'}
              aria-label={pinActive && !parentUnlocked ? '家长端，需要 PIN 解锁' : '家长端'}
            >
              <span aria-hidden="true">
                {store.appMode === MODE.CAMPUS ? '👁' : '👨‍👩‍👧'}
              </span>{' '}
              {store.appMode === MODE.CAMPUS ? '观察' : '家长端'}
              {pinActive && !parentUnlocked ? ' 🔒' : ''}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {mode === 'child' ? (
            <PetView
              pet={store.pet}
              petType={store.petType}
              petStage={store.petStage}
              streak={store.streak}
              todayTasks={store.todayTasks}
              onMarkDone={store.markDone}
              streakBonus={store.streakBonus}
              latestExpMilestones={store.latestExpMilestones}
              clearStreakBonus={store.clearStreakBonus}
              clearExpMilestones={store.clearExpMilestones}
              achievements={achievements}
              equippedItems={store.equippedItems}
              decorations={decorations}
              onOpenDecoration={() => setShowDecoModal(true)}
              tasks={store.tasks}
              weeklyChallenge={store.weeklyChallenge}
              onClaimWeekly={store.claimWeeklyChallenge}
              appMode={store.appMode}
              classCode={store.classCode}
              profileId={profileId}
            />
          ) : (
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
              pinEnabled={pinActive}
              onSetupPin={handleSetupPin}
              onChangePin={handleChangePin}
              onClearPin={handleClearPin}
              onOpenReport={() => setShowReport(true)}
              onSetClassCode={store.setClassCode}
              appMode={store.appMode}
              onSetAppMode={store.setAppMode}
            />
          )}
        </div>
      </div>

      {/* Evolution modal */}
      {showEvolution && (
        <EvolutionModal
          petType={store.petType}
          petStage={store.petStage}
          petName={store.pet.name}
          onClose={() => setShowEvolution(false)}
        />
      )}

      {/* Decoration modal */}
      {showDecoModal && (
        <Suspense fallback={null}>
          <DecorationModal
            decorations={decorations}
            equippedItems={store.equippedItems}
            onEquip={store.equipItem}
            onClose={() => setShowDecoModal(false)}
          />
        </Suspense>
      )}

      {/* Monthly report */}
      {showReport && (
        <Suspense fallback={null}>
          <MonthlyReport
            state={store}
            onClose={() => setShowReport(false)}
          />
        </Suspense>
      )}

      {/* PIN modal */}
      {showPinModal && (
        <PinModal
          mode={pinMode}
          onSuccess={onPinSuccess}
          onCancel={onPinCancel}
        />
      )}

      {/* Profile compare modal */}
      {showCompare && (
        <Suspense fallback={null}>
          <ProfileCompare
            snapshots={profiles.map(p => getProfileSnapshot(p.id)).filter(Boolean)}
            onClose={() => setShowCompare(false)}
          />
        </Suspense>
      )}

      {/* Daily login bonus toast */}
      {loginToast && (
        <div style={styles.loginToast} className="toast-slide">
          🌞 每日登录奖励 +5 经验！
        </div>
      )}

      {/* Profile switcher menu */}
      {showProfileMenu && (
        <div style={styles.menuOverlay} onClick={() => setShowProfileMenu(false)}>
          <div style={styles.profileMenu} onClick={e => e.stopPropagation()}>
            <div style={styles.menuTitle}>切换档案</div>
            {profiles.map(p => (
              <div key={p.id} style={styles.profileRow}>
                <button
                  style={{
                    ...styles.profileOption,
                    background: p.id === profileId ? '#667eea' : '#f5f5f7',
                    color: p.id === profileId ? '#fff' : '#333',
                  }}
                  onClick={() => switchProfile(p.id)}
                >
                  {p.label} {p.id === profileId && '✓'}
                </button>
                {p.id !== 'default' && (
                  <button
                    style={{
                      ...styles.profileDeleteBtn,
                      background: deleteConfirmId === p.id ? '#f5222d' : '#fff1f0',
                      color: deleteConfirmId === p.id ? '#fff' : '#f5222d',
                    }}
                    onClick={() => handleDeleteProfile(p.id)}
                    title={deleteConfirmId === p.id ? '再次点击确认删除' : '删除档案'}
                  >
                    {deleteConfirmId === p.id ? '确认' : '✕'}
                  </button>
                )}
              </div>
            ))}
            {profiles.length > 1 && (
              <button style={styles.compareBtn} onClick={() => { setShowCompare(true); setShowProfileMenu(false) }}>
                📊 对比档案
              </button>
            )}
            {profiles.length < 4 && (
              <div style={styles.profileAddRow}>
                <input
                  style={styles.profileAddInput}
                  placeholder="新档案名称（如：小明）"
                  value={profileAddInput}
                  onChange={e => setProfileAddInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddProfile()}
                />
                <button style={styles.profileAddBtn} onClick={handleAddProfile}>➕</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  phone: {
    background: '#f8f8fc',
    borderRadius: 32,
    maxWidth: 420,
    width: '100%',
    height: 'calc(100vh - 32px)',
    maxHeight: 850,
    minHeight: 600,
    boxShadow: '0 24px 80px rgba(102,126,234,0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '20px 20px 0',
    color: '#fff',
    transition: 'background 0.5s ease',
  },
  headerTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: 700 },
  headerStreak: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    padding: '4px 12px',
    fontSize: 15,
    fontWeight: 700,
  },
  profileChip: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: 999,
    padding: '4px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabRow: { display: 'flex', gap: 0 },
  tab: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: '12px 12px 0 0',
    transition: 'all 0.2s',
  },
  tabActive: { background: '#f8f8fc', color: '#444' },
  content: { flex: 1, padding: '0 16px 20px', overflowY: 'auto' },

  // Profile menu overlay
  menuOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,10,30,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
    padding: 20,
  },
  profileMenu: {
    background: '#fff',
    borderRadius: 20,
    padding: '20px 20px 16px',
    maxWidth: 300,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#1a1a2e',
    marginBottom: 14,
    textAlign: 'center',
  },
  profileRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  profileOption: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  profileDeleteBtn: {
    background: '#fff1f0',
    border: '1px solid #ffa39e',
    color: '#f5222d',
    borderRadius: 8,
    padding: '8px 10px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  profileAddRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  profileAddInput: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: 10,
    border: '1.5px solid #e8e8e8',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  profileAddBtn: {
    padding: '9px 14px',
    background: 'linear-gradient(135deg, #667eea22, #764ba222)',
    border: '1.5px solid #667eea',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    color: '#667eea',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  compareBtn: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #eb2f9618, #764ba218)',
    border: '1.5px solid #eb2f96',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    color: '#eb2f96',
    cursor: 'pointer',
    marginTop: 4,
    marginBottom: 4,
  },
  soundBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 16,
    cursor: 'pointer',
    color: '#fff',
  },
  loginToast: {
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    border: '2px solid #52c41a',
    borderRadius: 14,
    padding: '10px 22px',
    fontSize: 14,
    fontWeight: 700,
    color: '#389e0d',
    whiteSpace: 'nowrap',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    zIndex: 3000,
    pointerEvents: 'none',
  },
}
