import { useState } from 'react'
import { verifyPinCode, setPinCode } from '../store'
import { playPinKey, playPinError } from '../sounds'

/**
 * mode: 'verify'  — ask existing PIN, call onSuccess() if correct
 *       'setup'   — choose new PIN (no verification step)
 *       'change'  — verify old PIN first, then choose new PIN
 */
export default function PinModal({ onSuccess, onCancel, mode = 'verify' }) {
  const [step, setStep] = useState(mode === 'setup' ? 'new' : 'verify')
  const [pin, setPin]     = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')

  function handleDigit(d) {
    if (pin.length >= 4) return
    playPinKey()
    const next = pin + d
    setPin(next)
    setError('')
    if (next.length === 4) setTimeout(() => handleComplete(next), 150)
  }

  function handleBack() {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  async function handleComplete(code) {
    if (step === 'verify') {
      const ok = await verifyPinCode(code)
      if (ok) {
        if (mode === 'change') {
          setStep('new')
          setPin('')
        } else {
          onSuccess()
        }
      } else {
        playPinError()
        setError('PIN 码错误，请重试')
        setPin('')
      }
    } else if (step === 'new') {
      setNewPin(code)
      setStep('confirm')
      setPin('')
    } else if (step === 'confirm') {
      if (code === newPin) {
        await setPinCode(code)
        onSuccess()
      } else {
        playPinError()
        setError('两次输入不一致，请重新输入')
        setNewPin('')
        setStep('new')
        setPin('')
      }
    }
  }

  const titles = {
    verify: '请输入家长 PIN 码',
    new: mode === 'setup' ? '设置 PIN 码（4位数字）' : '输入新 PIN 码',
    confirm: '请再次确认 PIN 码',
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.title}>{titles[step]}</div>

        {/* PIN dot indicators */}
        <div style={S.dots}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                ...S.dot,
                background: i < pin.length ? '#667eea' : '#e8e8e8',
                transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <div style={S.errorRow}>{error}</div>

        {/* Number pad */}
        <div style={S.numpad}>
          {KEYS.map((k, i) =>
            k === '' ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                style={S.key}
                onClick={() => k === '⌫' ? handleBack() : handleDigit(k)}
              >
                {k}
              </button>
            )
          )}
        </div>

        <button style={S.cancelBtn} onClick={onCancel}>取消</button>
      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,10,30,0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 20,
  },
  modal: {
    background: '#fff',
    borderRadius: 24,
    padding: '32px 28px 24px',
    maxWidth: 320,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 28,
    lineHeight: 1.4,
  },
  dots: {
    display: 'flex',
    gap: 18,
    justifyContent: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  },
  errorRow: {
    color: '#f5222d',
    fontSize: 13,
    minHeight: 22,
    marginBottom: 8,
  },
  numpad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 18,
  },
  key: {
    padding: '15px 0',
    fontSize: 22,
    fontWeight: 700,
    border: 'none',
    background: '#f5f5f7',
    borderRadius: 14,
    cursor: 'pointer',
    color: '#1a1a2e',
    transition: 'background 0.12s',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: 15,
    cursor: 'pointer',
    padding: '8px 24px',
  },
}
