import { useState, useEffect, useRef } from 'react'
import { PET_TYPES, getPetImageUrl, getPetNextThreshold, EXP_MILESTONES } from '../store'
import { getDailyStory, fillStory, fillChapter, getOverflowChapter, PET_PHRASES } from '../stories'
import { playMarkDone, playTapPet } from '../sounds'
import { hapticLight, hapticSuccess } from '../haptic'
import { MODE } from '../constants/modes'
import CelebrationEffect from './CelebrationEffect'
import WeeklyChallenge from './WeeklyChallenge'
import PetImage from './PetImage'
import { lazy, Suspense } from 'react'
const LearnModal  = lazy(() => import('./LearnModal'))
const ClassGarden = lazy(() => import('./ClassGarden'))

export default function PetView({ pet, petType, petStage, todayTasks, streak, onMarkDone,
  streakBonus, latestExpMilestones, clearStreakBonus, clearExpMilestones, achievements,
  equippedItems, decorations, onOpenDecoration,
  tasks, weeklyChallenge, onClaimWeekly, appMode = MODE.FAMILY,
  classCode, profileId }) {
  const [feeding, setFeeding]       = useState(false)
  const [feedMsg, setFeedMsg]       = useState('')
  const [petSpeech, setPetSpeech]   = useState('')
  const [toast, setToast]           = useState(null)
  const [celebrating, setCelebrating] = useState(false)
  const [activeLearnTask, setActiveLearnTask] = useState(null)
  const [showGarden, setShowGarden] = useState(false)

  // Streak bonus toast
  useEffect(() => {
    if (!streakBonus) return
    // 派生 UI：把外部传入的 streakBonus 转成一次性 toast，随后清空来源
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToast({
      icon: '🔥', color: '#ff6b35',
      title: `连续打卡 ${streakBonus.streak} 天！`,
      msg: `奖励 +${streakBonus.bonus} 经验已到账！`,
    })
    clearStreakBonus?.()
  }, [streakBonus]) // eslint-disable-line react-hooks/exhaustive-deps

  // EXP milestone toast
  useEffect(() => {
    if (!latestExpMilestones?.length) return
    const top = EXP_MILESTONES.filter(m => latestExpMilestones.includes(m.exp)).pop()
    // 派生 UI：经验里程碑 → 一次性 toast
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (top) setToast({
      icon: '⭐', color: '#faad14',
      title: top.title,
      msg: top.msg.replace('{petName}', pet.name),
    })
    clearExpMilestones?.()
  }, [latestExpMilestones?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss toast after 3.5 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const petDef = PET_TYPES[petType] || PET_TYPES['west-highland']
  const effectivePetType = petDef.baseType || petType  // seasonal pets fall back to base art/stories
  const stageDef = petDef.stages[petStage]
  const imgUrl = getPetImageUrl(petType, petStage)

  // Equipped decoration emojis
  const hatItem = decorations?.find(d => d.id === equippedItems?.hat)
  const accItem = decorations?.find(d => d.id === equippedItems?.acc)
  const unlockedCount = decorations?.filter(d => d.unlocked).length ?? 0

  const hungerPct = Math.round(pet.hunger)
  const nextExp = getPetNextThreshold(pet.exp)

  const hungerState =
    hungerPct > 70 ? 'happy' :
    hungerPct > 40 ? 'normal' :
    hungerPct > 20 ? 'hungry' : 'starving'

  const hungerColor =
    hungerState === 'happy' ? '#52c41a' :
    hungerState === 'normal' ? '#faad14' :
    hungerState === 'hungry' ? '#ff7a45' : '#f5222d'

  const moodText = { happy: '开心 😊', normal: '一般 😐', hungry: '饿了 😢', starving: '非常饿 😭' }

  // CSS filter based on hunger
  const imgFilter =
    hungerState === 'starving' ? 'grayscale(70%) brightness(0.85)' :
    hungerState === 'hungry' ? 'grayscale(30%) brightness(0.92)' :
    hungerState === 'happy' ? 'brightness(1.05) saturate(1.1)' : 'none'

  const petAnimation =
    hungerState === 'starving' ? 'hungerShake 0.55s ease-in-out infinite' :
    feeding ? 'jump 0.4s ease infinite alternate' :
    'float 3s ease-in-out infinite'

  // 任务点击：先弹学习模块（口算 / 闪卡 / 计时），完成后才正式打卡
  function startTask(task) {
    setActiveLearnTask(task)
  }

  function handleLearnComplete() {
    if (!activeLearnTask) return
    const taskId = activeLearnTask.id
    setActiveLearnTask(null)
    playMarkDone()
    hapticSuccess()
    onMarkDone(taskId)
    setFeeding(true)
    setCelebrating(true)
    setFeedMsg(appMode === MODE.CAMPUS
      ? '✨ 任务完成！宠物吃饱啦~'
      : '✨ 已打卡！等家长确认后宠物就能吃饱啦~')
    setTimeout(() => { setFeeding(false); setFeedMsg('') }, 2200)
  }

  function handlePetTap() {
    playTapPet()
    hapticLight()
    const phrases = PET_PHRASES[effectivePetType]?.[hungerState] || PET_PHRASES['west-highland'][hungerState]
    const msg = phrases[Math.floor(Math.random() * phrases.length)]
    setPetSpeech(msg)
    setTimeout(() => setPetSpeech(''), 2500)
  }

  const doneCount = todayTasks.filter(t => t.status !== 'pending').length
  const allDone = todayTasks.length > 0 && todayTasks.every(t => t.status === 'confirmed')

  return (
    <div style={styles.wrap}>
      {/* Milestone toast */}
      {toast && (
        <div key={toast.title} style={{ ...styles.toastBanner, borderColor: toast.color }} className="toast-slide">
          <span style={{ fontSize: 22, flexShrink: 0 }}>{toast.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: toast.color }}>{toast.title}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2, lineHeight: 1.4 }}>{toast.msg}</div>
          </div>
        </div>
      )}

      {/* Streak banner */}
      {streak > 0 && (
        <div style={styles.streakBanner}>
          <span style={styles.streakFire}>🔥</span>
          <div>
            <div style={styles.streakNum}>{streak} 天连续打卡</div>
            <div style={styles.streakSub}>坚持就是胜利！继续保持~</div>
          </div>
          {streak >= 7 && <span style={styles.streakBadge}>🏆</span>}
        </div>
      )}

      {/* All done banner */}
      {allDone && (
        <div style={styles.allDoneBanner}>
          🎉 今日任务全部完成！{pet.name} 超级开心！
        </div>
      )}

      {/* Pet card */}
      <div style={{ ...styles.petCard, background: petDef.theme, position: 'relative', overflow: 'visible' }}>
        {celebrating && <CelebrationEffect onEnd={() => setCelebrating(false)} />}
        <div style={styles.stageLabel}>
          {stageDef.name} · 阶段 {petStage + 1}/{petDef.stages.length}
        </div>

        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={handlePetTap}>
          {/* Hat decoration — above the pet */}
          {hatItem && (
            <div style={styles.hatOverlay}>{hatItem.emoji}</div>
          )}
          <PetImage
            src={imgUrl}
            alt={pet.name}
            style={{ ...styles.petImg, filter: imgFilter, animation: petAnimation }}
          />
          {/* Accessory decoration — bottom-right of pet */}
          {accItem && (
            <div style={styles.accOverlay}>{accItem.emoji}</div>
          )}
          {petSpeech && (
            <div style={styles.speechBubble} className="speech-pop">{petSpeech}</div>
          )}
          {!petSpeech && hungerState === 'starving' && (
            <div style={styles.hungerBubble}>好饿… 😭</div>
          )}
          {!petSpeech && hungerState === 'hungry' && (
            <div style={{ ...styles.hungerBubble, background: '#fff7e6', color: '#d46b08', borderColor: '#ffd591' }}>肚子咕咕叫 😢</div>
          )}
        </div>

        <div style={styles.petName}>{pet.name}</div>
        <div style={styles.petMood}>心情：{moodText[hungerState]}</div>
        {/* Decoration quick-access */}
        {onOpenDecoration && (
          <button style={styles.decoBtn} onClick={onOpenDecoration}>
            🎀 换装{unlockedCount > 0 ? ` · ${unlockedCount}件可用` : ''}
          </button>
        )}

        {/* Hunger bar */}
        <div style={styles.barWrap}>
          <div style={styles.barLabel}>
            <span>🍖 饱食度</span>
            <span style={{ color: hungerColor, fontWeight: 700 }}>{hungerPct}%</span>
          </div>
          <div style={styles.barBg}>
            <div
              style={{ ...styles.barFill, width: `${hungerPct}%`, background: hungerColor }}
              className={hungerPct < 40 ? 'bar-pulse' : ''}
            />
          </div>
        </div>

        {/* Exp bar */}
        {nextExp ? (
          <div style={styles.barWrap}>
            <div style={styles.barLabel}>
              <span>⭐ 经验值</span>
              <span>{pet.exp}/{nextExp}</span>
            </div>
            <div style={styles.barBg}>
              <div style={{
                ...styles.barFill,
                width: `${Math.min(100, (pet.exp / nextExp) * 100)}%`,
                background: petDef.themeAccent,
              }} />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: petDef.themeAccent }}>
            🎉 已达到最终进化！经验 {pet.exp}
          </div>
        )}
      </div>

      {/* Weekly challenge */}
      {tasks && (
        <WeeklyChallenge
          tasks={tasks}
          weeklyChallenge={weeklyChallenge}
          onClaim={onClaimWeekly}
        />
      )}

      {/* Feed message */}
      {feedMsg && <div style={styles.feedMsg}>{feedMsg}</div>}

      {/* Story */}
      <StoryCard
        story={getDailyStory(effectivePetType)}
        tasks={todayTasks}
        petName={pet.name}
        petType={effectivePetType}
      />

      {/* Tasks */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          今日任务
          <span style={{ ...styles.badge, background: petDef.themeAccent }}>
            {doneCount}/{todayTasks.length}
          </span>
          {appMode !== MODE.FAMILY && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: appMode === MODE.CAMPUS ? '#667eea22' : '#52c41a22',
              color: appMode === MODE.CAMPUS ? '#667eea' : '#52c41a',
              marginLeft: 6, verticalAlign: 'middle',
            }}>
              {appMode === MODE.CAMPUS ? '🏫 校园' : '🤝 家校'}
            </span>
          )}
          {classCode && (
            <button
              style={{
                marginLeft: 'auto', float: 'right',
                background: 'linear-gradient(135deg, #f6ffed, #d9f7be)',
                border: '1.5px solid #95de64',
                color: '#389e0d',
                fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 999,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              onClick={() => setShowGarden(true)}
              aria-label="打开班级花园看同学的宠物"
            >
              🌳 班级花园
            </button>
          )}
        </div>
        {todayTasks.length === 0 && (
          <div style={styles.empty}>
            {appMode === MODE.FAMILY ? '今日暂无任务，等家长来布置吧～' : '今日暂无任务，等老师布置吧～'}
          </div>
        )}
        {todayTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            accent={petDef.themeAccent}
            onDone={() => startTask(task)}
            appMode={appMode}
          />
        ))}
      </div>

      {/* Achievement gallery */}
      {achievements && achievements.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            🏆 成就
            <span style={{ ...styles.badge, background: '#faad14' }}>
              {achievements.filter(a => a.earned).length}/{achievements.length}
            </span>
          </div>
          <div style={styles.achGrid}>
            {achievements.map(a => (
              <div
                key={a.id}
                title={a.desc}
                style={{
                  ...styles.achItem,
                  opacity: a.earned ? 1 : 0.35,
                  background: a.earned ? 'linear-gradient(135deg, #fffbe6, #fff8e1)' : '#f5f5f5',
                  border: a.earned ? '1.5px solid #ffe58f' : '1.5px solid #f0f0f0',
                }}
              >
                <div style={styles.achEmoji}>{a.emoji}</div>
                <div style={styles.achName}>{a.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hungerState !== 'happy' && (
        <div style={styles.tip}>
          💡 {pet.name}正在等你完成任务来喂食哦！
        </div>
      )}

      {/* 学习内容 mini-app 弹层 */}
      {activeLearnTask && (
        <Suspense fallback={null}>
          <LearnModal
            task={activeLearnTask}
            onDone={handleLearnComplete}
            onCancel={() => setActiveLearnTask(null)}
          />
        </Suspense>
      )}

      {/* 班级花园 */}
      {showGarden && classCode && (
        <Suspense fallback={null}>
          <ClassGarden
            classCode={classCode}
            currentProfileId={profileId}
            onClose={() => setShowGarden(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

function StoryCard({ story, tasks, petName, petType }) {
  const fill = text => fillStory(text, petName)
  const confirmedCount = tasks.filter(t => t.status === 'confirmed').length
  const allDone = tasks.length > 0 && confirmedCount >= tasks.length

  // ── 章节解锁动画：检测新确认的任务 ──
  const prevConfirmedRef = useRef(new Set())
  const [newlyUnlocked, setNewlyUnlocked] = useState(new Set())
  useEffect(() => {
    const currentConfirmed = new Set(tasks.filter(t => t.status === 'confirmed').map(t => t.id))
    const fresh = [...currentConfirmed].filter(id => !prevConfirmedRef.current.has(id))
    if (fresh.length > 0) {
      setNewlyUnlocked(new Set(fresh))
      const timer = setTimeout(() => setNewlyUnlocked(new Set()), 1400)
      prevConfirmedRef.current = currentConfirmed
      return () => clearTimeout(timer)
    }
    prevConfirmedRef.current = currentConfirmed
  }, [tasks])

  return (
    <div style={storyStyles.wrap}>
      <div style={storyStyles.header}>
        <span style={storyStyles.title}>{story.title}</span>
        <span style={storyStyles.badge}>{confirmedCount}/{tasks.length} 解锁</span>
      </div>
      <p style={storyStyles.intro}>{fill(story.intro)}</p>

      <div style={storyStyles.chapters}>
        {tasks.map((task, i) => {
          const unlocked = task.status === 'confirmed'
          const isDone  = task.status === 'done'   // submitted, awaiting confirm
          const isNew   = newlyUnlocked.has(task.id)
          const text = story.chapters[i]
            ? fillChapter(story.chapters[i], petName, task.name)
            : getOverflowChapter(petType, task.name, petName, i)
          return (
            <div key={task.id}
              style={{ ...storyStyles.chapter, ...(unlocked ? storyStyles.unlocked : storyStyles.locked) }}
              className={isNew ? 'chapter-unlock' : ''}
            >
              {unlocked ? (
                <>
                  <span style={storyStyles.chapterNum}>第{i + 1}章 · ✅ {task.name}</span>
                  <span style={storyStyles.chapterText}>{text}</span>
                </>
              ) : (
                <div style={storyStyles.lockedRow}>
                  <span style={storyStyles.lockIcon}>{isDone ? '⏳' : '🔒'}</span>
                  <div>
                    <div style={storyStyles.lockedText}>
                      {isDone ? '等待家长确认……第 ' : '完成后解锁第 '}{i + 1} 章
                    </div>
                    <div style={storyStyles.lockedTask}>{task.icon} {task.name}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {allDone && (
        <div style={storyStyles.ending}>
          <div style={storyStyles.endingLabel}>✨ 今日结局</div>
          {fill(story.ending)}
        </div>
      )}
    </div>
  )
}

const storyStyles = {
  wrap: {
    background: 'linear-gradient(135deg, #fffdf0, #fff8e1)',
    border: '1.5px solid #ffe082',
    borderRadius: 18,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: 800, color: '#5d4037' },
  badge: {
    fontSize: 12,
    background: '#ff8f00',
    color: '#fff',
    borderRadius: 999,
    padding: '2px 10px',
    fontWeight: 700,
  },
  intro: { fontSize: 13, color: '#6d4c41', lineHeight: 1.6, margin: 0 },
  chapters: { display: 'flex', flexDirection: 'column', gap: 6 },
  chapter: {
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 13,
    lineHeight: 1.55,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  unlocked: { background: 'rgba(255,255,255,0.85)', border: '1px solid #ffe0b2' },
  locked: { background: 'rgba(0,0,0,0.04)', border: '1px dashed #e0d0a0' },
  chapterNum: { fontSize: 11, fontWeight: 800, color: '#ff8f00', marginBottom: 2 },
  chapterText: { color: '#4e342e' },
  lockedRow: { display: 'flex', alignItems: 'center', gap: 8 },
  lockIcon: { fontSize: 18, flexShrink: 0 },
  lockedText: { color: '#bdbdbd', fontSize: 11, marginBottom: 2 },
  lockedTask: { color: '#aaa', fontSize: 12, fontWeight: 600 },
  ending: {
    background: 'linear-gradient(135deg, #fff9c4, #ffe082)',
    border: '1.5px solid #ffc107',
    borderRadius: 12,
    padding: '12px',
    fontSize: 13,
    color: '#4e342e',
    lineHeight: 1.6,
  },
  endingLabel: { fontWeight: 800, fontSize: 12, color: '#e65100', marginBottom: 4 },
}

function TaskItem({ task, accent, onDone, appMode = MODE.FAMILY }) {
  const isCampus = appMode === MODE.CAMPUS
  const s = {
    pending: { label: isCampus ? '完成！' : '去完成', clickable: true },
    done: { label: '等待确认 ⏳', clickable: false },
    confirmed: { label: isCampus ? '✅ 已完成' : '✅ 已确认', clickable: false },
  }[task.status]

  return (
    <div style={styles.taskRow}>
      <span style={styles.taskIcon}>{task.icon}</span>
      <div style={styles.taskInfo}>
        <div style={{ ...styles.taskName, textDecoration: task.status === 'confirmed' ? 'line-through' : 'none', color: task.status === 'confirmed' ? '#aaa' : '#1a1a2e' }}>
          {task.name}
        </div>
        <div style={{ fontSize: 12, color: '#777' }}>+{task.points} 经验</div>
      </div>
      <button
        style={{
          ...styles.taskBtn,
          background: s.clickable ? accent : task.status === 'confirmed' ? '#f6ffed' : '#f5f5f5',
          color: s.clickable ? '#fff' : task.status === 'confirmed' ? '#52c41a' : '#faad14',
          cursor: s.clickable ? 'pointer' : 'default',
        }}
        onClick={s.clickable ? onDone : undefined}
        disabled={!s.clickable}
      >
        {s.label}
      </button>
    </div>
  )
}

const styles = {
  wrap: { padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 },
  streakBanner: {
    background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
    borderRadius: 14,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#fff',
  },
  streakFire: { fontSize: 28 },
  streakNum: { fontWeight: 800, fontSize: 16 },
  streakSub: { fontSize: 12, opacity: 0.85 },
  streakBadge: { fontSize: 24, marginLeft: 'auto' },
  allDoneBanner: {
    background: 'linear-gradient(135deg, #52c41a, #389e0d)',
    color: '#fff',
    borderRadius: 14,
    padding: '12px 16px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 15,
    animation: 'pulse 2s ease-in-out infinite',
  },
  petCard: {
    borderRadius: 20,
    padding: '20px 16px',
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    transition: 'background 0.4s',
  },
  stageLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
  hatOverlay: {
    position: 'absolute', top: -22, left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 28, lineHeight: 1,
    pointerEvents: 'none', zIndex: 5,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
  },
  accOverlay: {
    position: 'absolute', bottom: 4, right: -10,
    fontSize: 24, lineHeight: 1,
    pointerEvents: 'none', zIndex: 5,
    animation: 'float 2.5s ease-in-out infinite',
    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
  },
  decoBtn: {
    margin: '6px auto 0',
    padding: '5px 14px',
    background: 'rgba(255,255,255,0.7)',
    border: '1.5px solid rgba(0,0,0,0.1)',
    borderRadius: 999,
    fontSize: 12, fontWeight: 700,
    color: '#555', cursor: 'pointer',
    display: 'block',
  },
  petImg: {
    width: 140,
    height: 140,
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
    transition: 'filter 0.5s ease',
    mixBlendMode: 'multiply',
  },
  speechBubble: {
    position: 'absolute',
    top: -14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    color: '#333',
    border: '1.5px solid #e8e8e8',
    borderRadius: 14,
    fontSize: 13,
    padding: '6px 14px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  hungerBubble: {
    position: 'absolute',
    top: -8,
    right: -12,
    background: '#fff1f0',
    color: '#cf1322',
    border: '1px solid #ffa39e',
    borderRadius: 999,
    fontSize: 12,
    padding: '3px 10px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  petName: { fontSize: 20, fontWeight: 800, marginTop: 8 },
  petMood: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 4 },
  barWrap: { marginTop: 10 },
  barLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, fontWeight: 600 },
  barBg: { background: '#e8e8e8', borderRadius: 999, height: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, transition: 'width 0.6s ease' },
  feedMsg: {
    background: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    color: '#389e0d',
    textAlign: 'center',
    fontWeight: 600,
  },
  section: { background: '#fff', borderRadius: 16, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  badge: { color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 13 },
  empty: { color: '#bbb', textAlign: 'center', padding: '20px 0', fontSize: 14 },
  taskRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  taskIcon: { fontSize: 24, flexShrink: 0 },
  taskInfo: { flex: 1, minWidth: 0 },
  taskName: { fontWeight: 600, fontSize: 15 },
  taskBtn: { minHeight: 44, padding: '10px 18px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  tip: { background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#ad6800' },
  achGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  achItem: {
    borderRadius: 12,
    padding: '10px 4px 8px',
    textAlign: 'center',
    cursor: 'default',
    transition: 'opacity 0.3s',
  },
  achEmoji: { fontSize: 22, marginBottom: 4 },
  achName: { fontSize: 10, fontWeight: 700, color: '#555', lineHeight: 1.2 },
  toastBanner: {
    background: '#fff',
    border: '2px solid',
    borderRadius: 14,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
  },
}
