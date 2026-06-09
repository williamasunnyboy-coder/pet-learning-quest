import { useState } from 'react'
import { PET_TYPES, getPetImageUrl, isSeasonalActive, seasonalInfo } from '../store'
import { lookupClassCode, DEMO_CLASS_CODE } from '../teacher-store'
import PetImage from './PetImage'
import ModeSelect from './ModeSelect'
import { MODE_META } from '../constants/mode-meta'
import { MODE } from '../constants/modes'

const PET_KEYS = Object.keys(PET_TYPES)

export default function Setup({ onSetup }) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState(MODE.FAMILY)
  const [childName, setChildName] = useState('')
  const [petName, setPetName] = useState('')
  const [petType, setPetType] = useState('west-highland')
  const [classCode, setClassCode] = useState('')
  const [classInfo, setClassInfo] = useState(null)
  const [classErr, setClassErr] = useState('')
  const [classLookingUp, setClassLookingUp] = useState(false)

  const selectedPet = PET_TYPES[petType]
  const modeInfo = MODE_META[mode]
  const needsClass = modeInfo.needs === 'classCode'

  // Step 1 → 2: mode chosen
  function handleModeNext() {
    setStep(2)
  }

  // Step 2 → 3 (or 4): names filled
  function handleNamesNext(e) {
    e.preventDefault()
    if (!childName.trim() || !petName.trim()) return
    if (needsClass) {
      setStep(3)
    } else {
      setStep(4)
    }
  }

  // Step 3: look up class code
  function handleLookup() {
    const code = classCode.trim().toUpperCase()
    if (!code) return
    setClassLookingUp(true)
    setClassErr('')
    setClassInfo(null)
    setTimeout(() => {
      const info = lookupClassCode(code)
      setClassLookingUp(false)
      if (info) {
        setClassInfo(info)
      } else {
        setClassErr('未找到班级，请确认班级码是否正确')
      }
    }, 400)
  }

  // Step 3 → 4
  function handleClassNext() {
    setStep(4)
  }

  // Step 3: skip class code (only school-home allows this)
  function handleSkipClass() {
    setClassInfo(null)
    setClassCode('')
    setStep(4)
  }

  // Final: finish setup
  function handleFinish() {
    const finalCode = classInfo ? classCode.trim().toUpperCase() : null
    onSetup(childName.trim(), petName.trim(), petType, mode, finalCode)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>

        {/* ── Step 1: Mode Selection ── */}
        {step === 1 && (
          <>
            <div style={styles.title}>🥚 宠物学习助手</div>
            <p style={styles.sub}>让孩子通过养宠物爱上学习</p>
            <ModeSelect selected={mode} onChange={setMode} />
            <button
              style={{ ...styles.btn, marginTop: 20, background: `linear-gradient(135deg, ${modeInfo.color}, ${modeInfo.border})` }}
              onClick={handleModeNext}
            >
              选择「{modeInfo.label}」→
            </button>
          </>
        )}

        {/* ── Step 2: Names ── */}
        {step === 2 && (
          <>
            <button style={styles.back} onClick={() => setStep(1)}>← 返回</button>
            {/* Mode badge */}
            <div style={{ ...styles.modeBadge, background: modeInfo.gradient, borderColor: modeInfo.border, color: modeInfo.color }}>
              {modeInfo.icon} {modeInfo.label}
            </div>
            <div style={styles.title}>给小主角命名</div>
            <p style={styles.sub}>孩子的名字和宠物名字</p>
            <form onSubmit={handleNamesNext} style={styles.form}>
              <label style={styles.label}>孩子的名字</label>
              <input
                style={styles.input}
                placeholder="例如：小明"
                value={childName}
                onChange={e => setChildName(e.target.value)}
                autoFocus
              />
              <label style={styles.label}>给宠物取个名字</label>
              <input
                style={styles.input}
                placeholder="例如：小蛋蛋"
                value={petName}
                onChange={e => setPetName(e.target.value)}
              />
              <button
                style={{ ...styles.btn, background: `linear-gradient(135deg, ${modeInfo.color}, #764ba2)` }}
                type="submit"
                disabled={!childName.trim() || !petName.trim()}
              >
                {needsClass ? '下一步：输入班级码 →' : '下一步：选择宠物 →'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: Class Code (campus / school-home only) ── */}
        {step === 3 && (
          <>
            <button style={styles.back} onClick={() => setStep(2)}>← 返回</button>
            <div style={{ ...styles.modeBadge, background: modeInfo.gradient, borderColor: modeInfo.border, color: modeInfo.color }}>
              {modeInfo.icon} {modeInfo.label}
            </div>
            <div style={styles.title}>输入班级码</div>
            <p style={styles.sub}>由老师提供，6位字母数字</p>

            <div style={styles.codeRow}>
              <input
                style={{ ...styles.input, flex: 1, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                placeholder="例如：ABC123"
                maxLength={6}
                value={classCode}
                onChange={e => { setClassCode(e.target.value.toUpperCase()); setClassInfo(null); setClassErr('') }}
              />
              <button
                style={{ ...styles.lookupBtn, background: modeInfo.color }}
                onClick={handleLookup}
                disabled={classCode.trim().length < 4 || classLookingUp}
              >
                {classLookingUp ? '查询…' : '查询'}
              </button>
            </div>

            {/* Demo 班级码快速填入提示 */}
            {!classInfo && classCode !== DEMO_CLASS_CODE && (
              <button
                type="button"
                style={styles.demoHint}
                onClick={() => { setClassCode(DEMO_CLASS_CODE); setClassErr('') }}
              >
                💡 试试演示班级：<strong style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{DEMO_CLASS_CODE}</strong>
              </button>
            )}

            {classErr && <div style={styles.errMsg}>{classErr}</div>}

            {classInfo && (
              <div style={{ ...styles.classFound, borderColor: modeInfo.border, background: modeInfo.gradient }}>
                <div style={{ fontSize: 20 }}>🏫</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: modeInfo.color }}>{classInfo.className}</div>
                <div style={{ fontSize: 13, color: '#666' }}>老师：{classInfo.teacherName}</div>
                <button
                  style={{ ...styles.btn, marginTop: 12, background: `linear-gradient(135deg, ${modeInfo.color}, #764ba2)` }}
                  onClick={handleClassNext}
                >
                  加入班级，选择宠物 →
                </button>
              </div>
            )}

            {/* school-home can skip if code not available yet */}
            {mode === MODE.SCHOOL_HOME && !classInfo && (
              <button style={styles.skipBtn} onClick={handleSkipClass}>
                暂时跳过，之后在设置里绑定
              </button>
            )}
          </>
        )}

        {/* ── Step 4: Pet Selection ── */}
        {step === 4 && (
          <>
            <button style={styles.back} onClick={() => setStep(needsClass ? 3 : 2)}>← 返回</button>
            <div style={styles.title}>选择你的宠物</div>
            <p style={styles.sub}>完成任务让它不断进化成长！</p>

            {/* Preview */}
            <div style={{ ...styles.preview, background: selectedPet.theme }}>
              <PetImage
                src={getPetImageUrl(petType, 0)}
                alt={selectedPet.name}
                style={styles.previewImg}
              />
              <div style={styles.previewName}>{petName} · {selectedPet.name}</div>
              <div style={styles.previewStages}>
                {selectedPet.stages.map((s, i) => (
                  <span key={i} style={styles.stageChip}>
                    {i + 1}. {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Pet selector */}
            <div style={styles.petGrid}>
              {PET_KEYS.map(key => {
                const p = PET_TYPES[key]
                const selected = petType === key
                const info = seasonalInfo(p)
                const seasonActive = info ? isSeasonalActive(p) : false
                return (
                  <button
                    key={key}
                    style={{
                      ...styles.petOption,
                      border: selected
                        ? `2px solid ${p.themeAccent}`
                        : info ? `2px solid ${seasonActive ? '#faad14' : '#d9d9d9'}` : '2px solid #eee',
                      background: selected ? p.theme : '#fafafa',
                      opacity: info && !seasonActive ? 0.65 : 1,
                    }}
                    onClick={() => setPetType(key)}
                  >
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <PetImage
                        src={getPetImageUrl(key, 0)}
                        alt={p.name}
                        style={styles.petOptionImg}
                      />
                      {p.isPremium && <span style={styles.premiumBadge}>💎</span>}
                      {info && (
                        <span style={{
                          ...styles.premiumBadge,
                          background: seasonActive
                            ? 'linear-gradient(135deg, #faad14, #ff6b35)'
                            : 'linear-gradient(135deg, #bbb, #888)',
                        }}>
                          {info.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: selected ? p.themeAccent : '#666' }}>
                      {p.name}
                    </div>
                    {info && (
                      <div style={{ fontSize: 9, color: seasonActive ? '#fa8c16' : '#aaa', marginTop: 1, fontWeight: 600 }}>
                        {info.sub}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              style={{ ...styles.btn, background: `linear-gradient(135deg, ${selectedPet.themeAccent}, #764ba2)` }}
              onClick={handleFinish}
            >
              开始养成 {selectedPet.emoji}
            </button>
          </>
        )}

        {/* Step indicator */}
        <div style={styles.stepDots}>
          {[1, 2, 3, 4].map(n => {
            const visible = n !== 3 || needsClass
            if (!visible) return null
            const active = step === n
            const done = step > n
            return (
              <div
                key={n}
                style={{
                  ...styles.dot,
                  background: active ? modeInfo.color : done ? modeInfo.color + '66' : '#e0e0e0',
                  width: active ? 20 : 8,
                }}
              />
            )
          })}
        </div>

      </div>
    </div>
  )
}

const styles = {
  overlay: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px',
    overflowY: 'auto',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '36px 24px 24px',
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    textAlign: 'center',
    position: 'relative',
  },
  back: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'none',
    border: 'none',
    fontSize: 14,
    color: '#888',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  modeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    padding: '5px 14px',
    borderRadius: 999,
    border: '1.5px solid',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  sub: { color: '#888', marginBottom: 16, fontSize: 13, lineHeight: 1.5 },
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
  btn: {
    marginTop: 4,
    padding: '13px',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'inherit',
  },
  codeRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  },
  lookupBtn: {
    padding: '0 18px',
    borderRadius: 12,
    border: 'none',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  errMsg: {
    color: '#ff4d4f',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoHint: {
    width: '100%',
    background: 'linear-gradient(135deg, #fff8d0, #fffbe6)',
    border: '1.5px dashed #ffd666',
    borderRadius: 10,
    padding: '8px 12px',
    fontSize: 13,
    color: '#8c6a00',
    cursor: 'pointer',
    marginBottom: 10,
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  classFound: {
    borderRadius: 14,
    border: '2px solid',
    padding: '14px',
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: 13,
    cursor: 'pointer',
    marginTop: 6,
    padding: '6px 0',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  preview: {
    borderRadius: 16,
    padding: '16px 12px',
    marginBottom: 14,
    transition: 'background 0.3s',
  },
  previewImg: {
    width: 90,
    height: 90,
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto 8px',
    mixBlendMode: 'multiply',
  },
  previewName: { fontWeight: 700, fontSize: 15, marginBottom: 6 },
  previewStages: { display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' },
  stageChip: {
    fontSize: 11,
    padding: '2px 8px',
    background: 'rgba(0,0,0,0.06)',
    borderRadius: 999,
    color: '#555',
  },
  petGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 14,
  },
  petOption: {
    borderRadius: 12,
    padding: '10px 6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  petOptionImg: {
    width: 52,
    height: 52,
    objectFit: 'contain',
    mixBlendMode: 'multiply',
    display: 'block',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    fontSize: 11,
    background: 'linear-gradient(135deg, #f7931e, #ffd200)',
    borderRadius: 999,
    padding: '1px 5px',
    lineHeight: 1.5,
    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
    pointerEvents: 'none',
  },
  stepDots: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    height: 8,
    borderRadius: 999,
    transition: 'all 0.25s',
  },
}
