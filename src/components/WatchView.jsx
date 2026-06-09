import { useState } from 'react'
import {
  useAppStore, PET_TYPES, getPetImageUrl,
  getPetNextThreshold, getCurrentProfileId,
} from '../store'
import { MODE } from '../constants/modes'
import PetImage from './PetImage'

/**
 * WatchView —— 手表端演示（#watch）
 *
 * 儿童智能手表场景：戴在手腕上，随手查看宠物、一键完成今日任务。
 * 复用主 store 状态（与孩子端 / 家长端实时同源同步），按手表小屏重排：
 *   深色 OLED 风、超大点按目标、信息极简、可滚动。
 */
export default function WatchView() {
  const profileId = getCurrentProfileId()
  const store = useAppStore(profileId)
  const [flash, setFlash] = useState(null)   // 完成任务后的「+经验」反馈

  const petDef = PET_TYPES[store.petType] || PET_TYPES['west-highland']
  const accent = petDef.themeAccent
  const stageDef = petDef.stages[store.petStage] || petDef.stages[0]
  const imgUrl = getPetImageUrl(store.petType, store.petStage)
  const nextExp = getPetNextThreshold(store.pet?.exp || 0)
  const autoConfirm = store.appMode === MODE.CAMPUS

  const today = store.todayTasks || []
  const doneCount = today.filter(t => t.status === 'confirmed').length
  const pending = today.filter(t => t.status === 'pending')

  function complete(task) {
    store.markDone(task.id)
    setFlash(`+${task.points} ⭐`)
    setTimeout(() => setFlash(null), 1400)
  }

  function taskLabel(t) {
    if (t.status === 'confirmed') return '✓ 已确认'
    if (t.status === 'done') return autoConfirm ? '✓ 已确认' : '⏳ 待确认'
    return '完成 ✓'
  }

  return (
    <div style={S.page}>
      <div style={S.watch}>
        {/* 表冠 */}
        <div style={S.crown} aria-hidden="true" />
        {/* 表带 */}
        <div style={{ ...S.band, ...S.bandTop }} aria-hidden="true" />
        <div style={{ ...S.band, ...S.bandBottom }} aria-hidden="true" />

        {/* 表盘屏幕 */}
        <div style={S.screen}>
          {!store.initialized ? (
            <div style={S.empty}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🐾</div>
              <div style={S.emptyText}>请先在手机上<br />设置宠物</div>
            </div>
          ) : (
            <div style={S.scroll}>
              {/* 状态行 */}
              <div style={S.statusRow}>
                <span style={S.time}>9:41</span>
                <span style={{ color: '#ff7a45' }}>🔥{store.streak}</span>
                <span style={{ color: '#ff5c8a' }}>❤️{Math.round(store.pet?.hunger ?? 0)}</span>
              </div>

              {/* 宠物 */}
              <div style={{ position: 'relative', textAlign: 'center', marginTop: 2 }}>
                <div style={{ ...S.petGlow, background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)` }} />
                <PetImage src={imgUrl} alt={store.pet?.name} style={S.petImg} />
                {flash && <div style={S.flash} className="speech-pop">{flash}</div>}
              </div>
              <div style={S.petName}>{store.pet?.name}</div>
              <div style={{ ...S.stageChip, color: accent, borderColor: accent + '66' }}>
                {stageDef.name} · {store.petStage + 1}/{petDef.stages.length}
              </div>

              {/* 经验迷你条 */}
              <div style={S.expWrap}>
                <div style={{
                  ...S.expFill,
                  width: nextExp ? `${Math.min(100, ((store.pet?.exp || 0) / nextExp) * 100)}%` : '100%',
                  background: accent,
                }} />
              </div>

              {/* 今日任务 */}
              <div style={S.todayRow}>
                <span>今日任务</span>
                <span style={{ color: accent, fontWeight: 800 }}>{doneCount}/{today.length}</span>
              </div>

              {pending.length === 0 ? (
                <div style={S.allDone}>🎉 今天全部完成！</div>
              ) : (
                pending.map(t => (
                  <button key={t.id} style={{ ...S.taskBtn, background: accent }} onClick={() => complete(t)}>
                    <span style={S.taskIcon}>{t.icon}</span>
                    <span style={S.taskName}>{t.name}</span>
                    <span style={S.taskGo}>{taskLabel(t)}</span>
                  </button>
                ))
              )}

              {/* 已完成（折叠为简单条目） */}
              {today.filter(t => t.status !== 'pending').map(t => (
                <div key={t.id} style={S.doneRow}>
                  <span style={{ opacity: 0.6 }}>{t.icon} {t.name}</span>
                  <span style={{ color: t.status === 'confirmed' ? '#52c41a' : '#faad14' }}>{taskLabel(t)}</span>
                </div>
              ))}

              <div style={S.footHint}>⌚ 手表端 · 与手机实时同步</div>
            </div>
          )}
        </div>
      </div>
      <div style={S.caption}>手表端演示 — 在手腕上完成任务、养成宠物</div>
    </div>
  )
}

const SCREEN_W = 224
const SCREEN_H = 272

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #2a2342 0%, #1a1a2e 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 20,
  },
  watch: {
    position: 'relative',
    width: SCREEN_W + 28,
    height: SCREEN_H + 28,
    background: 'linear-gradient(145deg, #3a3a3a, #111)',
    borderRadius: 56,
    boxShadow: '0 24px 60px rgba(0,0,0,0.55), inset 0 0 0 2px #000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  crown: {
    position: 'absolute', right: -7, top: '42%',
    width: 8, height: 40, borderRadius: 4,
    background: 'linear-gradient(90deg, #555, #888)',
  },
  band: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    width: SCREEN_W - 20, height: 60,
    background: 'linear-gradient(180deg, #4a4458, #2c2838)',
    zIndex: -1,
  },
  bandTop: { top: -42, borderRadius: '24px 24px 8px 8px' },
  bandBottom: { bottom: -42, borderRadius: '8px 8px 24px 24px' },
  screen: {
    width: SCREEN_W, height: SCREEN_H,
    borderRadius: 44,
    background: 'radial-gradient(circle at 50% 30%, #15151f, #08080d)',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 0 3px #000',
  },
  scroll: {
    width: '100%', height: '100%',
    overflowY: 'auto',
    padding: '12px 14px 14px',
    color: '#fff',
  },
  statusRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 12, fontWeight: 700,
  },
  time: { color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' },
  petGlow: {
    position: 'absolute', left: '50%', top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 96, height: 96, borderRadius: '50%',
  },
  petImg: {
    width: 72, height: 72, objectFit: 'contain',
    display: 'block', margin: '4px auto 0',
    position: 'relative', zIndex: 1,
  },
  flash: {
    position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
    background: '#fff', color: '#1a1a2e', fontWeight: 800, fontSize: 13,
    padding: '2px 10px', borderRadius: 999, zIndex: 2,
  },
  petName: { textAlign: 'center', fontSize: 15, fontWeight: 800, marginTop: 2 },
  stageChip: {
    display: 'block', margin: '4px auto 0', width: 'fit-content',
    fontSize: 10, fontWeight: 700,
    padding: '2px 10px', borderRadius: 999,
    border: '1px solid', background: 'rgba(255,255,255,0.06)',
  },
  expWrap: {
    height: 5, background: 'rgba(255,255,255,0.12)',
    borderRadius: 999, overflow: 'hidden', margin: '10px 2px 0',
  },
  expFill: { height: '100%', borderRadius: 999, transition: 'width 0.4s' },
  todayRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
    margin: '14px 0 8px',
  },
  taskBtn: {
    width: '100%', minHeight: 46,
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', marginBottom: 8,
    border: 'none', borderRadius: 16,
    color: '#fff', cursor: 'pointer', textAlign: 'left',
  },
  taskIcon: { fontSize: 20, flexShrink: 0 },
  taskName: { flex: 1, fontSize: 13, fontWeight: 700, lineHeight: 1.2 },
  taskGo: { fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', opacity: 0.95 },
  doneRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 11, padding: '5px 4px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)',
  },
  allDone: {
    textAlign: 'center', fontSize: 13, fontWeight: 700,
    color: '#52c41a', padding: '14px 0',
  },
  footHint: {
    textAlign: 'center', fontSize: 9,
    color: 'rgba(255,255,255,0.35)', marginTop: 12,
  },
  empty: {
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center',
  },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 },
  caption: { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center' },
}
