/**
 * LearnModal —— 学习内容 mini-app
 *
 * 根据 task 自动决定渲染哪种迷你模块：
 *   math    口算 10 题，全对自动 markDone
 *   flash   拼音闪卡 5 张，全对自动 markDone
 *   timer   计时器，到时自动 markDone
 *   confirm 单纯确认按钮（默认）
 */
import { useState, useEffect, useRef } from 'react'
import { pickModule, genMathProblems, genFlashCards } from '../learn-content'
import { hapticSuccess, hapticLight } from '../haptic'

export default function LearnModal({ task, onDone, onCancel }) {
  if (!task) return null
  const moduleSpec = pickModule(task)

  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={S.modal} onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="learn-title">
        <button style={S.closeBtn} onClick={onCancel} aria-label="关闭">✕</button>
        <div id="learn-title" style={S.header}>
          <span style={{ fontSize: 28 }}>{task.icon || '📝'}</span>
          <div>
            <div style={S.title}>{task.name}</div>
            <div style={S.subtitle}>{task.points ? `完成后 +${task.points} 经验` : ''}</div>
          </div>
        </div>

        {moduleSpec.type === 'math' && (
          <MathModule
            count={moduleSpec.count}
            level={moduleSpec.level}
            onComplete={onDone}
          />
        )}
        {moduleSpec.type === 'flash' && (
          <FlashModule count={moduleSpec.count} onComplete={onDone} />
        )}
        {moduleSpec.type === 'timer' && (
          <TimerModule seconds={moduleSpec.seconds} onComplete={onDone} />
        )}
        {moduleSpec.type === 'confirm' && (
          <ConfirmModule onComplete={onDone} />
        )}
      </div>
    </div>
  )
}

// ─── 口算 ─────────────────────────────────────────────
function MathModule({ count, level, onComplete }) {
  const [problems] = useState(() => genMathProblems(count, level))
  const [idx, setIdx]       = useState(0)
  const [input, setInput]   = useState('')
  const [shake, setShake]   = useState(false)
  const [wrong, setWrong]   = useState(0)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [idx])

  if (idx >= problems.length) {
    return (
      <div style={S.done}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <div style={S.doneTitle}>全部做对啦！</div>
        <div style={S.doneSub}>共 {problems.length} 道，错了 {wrong} 次</div>
        <button style={S.bigBtn} onClick={onComplete} aria-label="领取奖励完成任务">
          领取奖励 ✨
        </button>
      </div>
    )
  }
  const cur = problems[idx]

  function submit() {
    if (input.trim() === '') return
    if (Number(input) === cur.answer) {
      hapticLight()
      setIdx(i => i + 1)
      setInput('')
    } else {
      setShake(true)
      setWrong(w => w + 1)
      setTimeout(() => { setShake(false); setInput('') }, 400)
    }
  }

  return (
    <div>
      <div style={S.progressRow}>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${(idx / problems.length) * 100}%` }} />
        </div>
        <div style={S.progressLabel}>{idx + 1} / {problems.length}</div>
      </div>
      <div style={{ ...S.problemCard, animation: shake ? 'shake .4s' : 'none' }}>
        <div style={S.problemText}>
          {cur.a} {cur.op === '*' ? '×' : cur.op} {cur.b} = ?
        </div>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="-?\d*"
          style={S.answerInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          aria-label="答案输入"
        />
        <button style={S.bigBtn} onClick={submit} disabled={!input.trim()}>
          下一题 →
        </button>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
    </div>
  )
}

// ─── 闪卡 ─────────────────────────────────────────────
function FlashModule({ count, onComplete }) {
  const [cards] = useState(() => genFlashCards(count))
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [wrong, setWrong]   = useState(0)

  if (idx >= cards.length) {
    return (
      <div style={S.done}>
        <div style={{ fontSize: 60 }}>🌟</div>
        <div style={S.doneTitle}>认识了 {cards.length} 个字！</div>
        <div style={S.doneSub}>错了 {wrong} 次</div>
        <button style={S.bigBtn} onClick={onComplete}>领取奖励 ✨</button>
      </div>
    )
  }
  const cur = cards[idx]

  function pick(choice) {
    if (picked) return
    setPicked(choice)
    if (choice === cur.correct) {
      hapticLight()
      setTimeout(() => { setIdx(i => i + 1); setPicked(null) }, 600)
    } else {
      setWrong(w => w + 1)
      setTimeout(() => setPicked(null), 600)
    }
  }

  return (
    <div>
      <div style={S.progressRow}>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${(idx / cards.length) * 100}%` }} />
        </div>
        <div style={S.progressLabel}>{idx + 1} / {cards.length}</div>
      </div>
      <div style={S.flashCard}>
        <div style={S.flashChar}>{cur.char}</div>
        <div style={S.flashMeaning}>{cur.meaning}</div>
      </div>
      <div style={S.flashGrid}>
        {cur.choices.map(c => {
          const correct = picked === c && c === cur.correct
          const incorrect = picked === c && c !== cur.correct
          return (
            <button
              key={c}
              style={{
                ...S.flashChoice,
                background: correct ? '#f6ffed' : incorrect ? '#fff1f0' : '#f8f8fc',
                border: correct ? '2px solid #52c41a' : incorrect ? '2px solid #f5222d' : '2px solid #eee',
                color: correct ? '#52c41a' : incorrect ? '#f5222d' : '#1a1a2e',
              }}
              onClick={() => pick(c)}
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 计时器 ───────────────────────────────────────────
function TimerModule({ seconds, onComplete }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    if (left <= 0) { hapticSuccess(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, running])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = (1 - left / seconds) * 100

  if (left <= 0) {
    return (
      <div style={S.done}>
        <div style={{ fontSize: 60 }}>⏰</div>
        <div style={S.doneTitle}>时间到，任务完成！</div>
        <button style={S.bigBtn} onClick={onComplete}>领取奖励 ✨</button>
      </div>
    )
  }
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>请专心完成 {Math.floor(seconds / 60)} 分钟</div>
      <div style={{ fontSize: 56, fontWeight: 800, fontFamily: 'monospace', color: '#667eea', margin: '12px 0', letterSpacing: 2 }}>
        {mm}:{ss}
      </div>
      <div style={{ ...S.progressBar, marginBottom: 20 }}>
        <div style={{ ...S.progressFill, width: `${pct}%` }} />
      </div>
      {!running ? (
        <button style={S.bigBtn} onClick={() => setRunning(true)}>▶️ 开始</button>
      ) : (
        <div style={{ fontSize: 13, color: '#aaa' }}>计时进行中…</div>
      )}
    </div>
  )
}

// ─── 默认：确认按钮 ───────────────────────────────────
function ConfirmModule({ onComplete }) {
  return (
    <div style={S.done}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={S.doneSub}>完成任务后点下方按钮领取奖励</div>
      <button style={S.bigBtn} onClick={onComplete}>我已完成 ✨</button>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(20,20,40,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2200, padding: 18,
  },
  modal: {
    background: '#fff', borderRadius: 22, padding: '24px 22px 22px',
    maxWidth: 420, width: '100%', position: 'relative',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
    fontFamily: 'inherit',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 14,
    background: 'none', border: 'none', fontSize: 18,
    color: '#bbb', cursor: 'pointer',
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 },
  title: { fontSize: 17, fontWeight: 800, color: '#1a1a2e' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  progressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  progressBar: { flex: 1, height: 8, background: '#f0f0f5', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', transition: 'width .3s' },
  progressLabel: { fontSize: 12, fontWeight: 700, color: '#888', whiteSpace: 'nowrap' },
  problemCard: {
    background: '#f8f8fc', borderRadius: 18, padding: '24px 18px',
    textAlign: 'center', marginBottom: 12,
  },
  problemText: { fontSize: 36, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, fontFamily: 'monospace' },
  answerInput: {
    fontSize: 28, fontWeight: 700, textAlign: 'center',
    width: '60%', padding: '10px 14px',
    border: '2px solid #e0e0e8', borderRadius: 12,
    outline: 'none', fontFamily: 'monospace',
    marginBottom: 14,
  },
  bigBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  done: { textAlign: 'center', padding: '20px 0' },
  doneTitle: { fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginTop: 8 },
  doneSub: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 20 },
  flashCard: {
    background: 'linear-gradient(135deg, #f0f4ff, #e8efff)',
    borderRadius: 18, padding: '26px 18px',
    textAlign: 'center', marginBottom: 14,
  },
  flashChar: { fontSize: 64, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 },
  flashMeaning: { fontSize: 13, color: '#888', marginTop: 8 },
  flashGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  flashChoice: {
    padding: '14px 8px', borderRadius: 12,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
  },
}
