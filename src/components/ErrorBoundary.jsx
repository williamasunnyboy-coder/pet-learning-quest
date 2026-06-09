import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[宠物助手] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <div style={styles.emoji}>😵</div>
            <div style={styles.title}>哎呀，出错了</div>
            <div style={styles.msg}>
              {String(this.state.error?.message || this.state.error || '未知错误')}
            </div>
            <div style={styles.sub}>你的学习记录仍然安全，刷新即可恢复。</div>
            <button style={styles.btn} onClick={() => window.location.reload()}>
              🔄 重新加载
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const styles = {
  overlay: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '40px 28px',
    maxWidth: 360,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  emoji: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 },
  msg: {
    fontSize: 13,
    color: '#f5222d',
    background: '#fff1f0',
    border: '1px solid #ffa39e',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 12,
    wordBreak: 'break-all',
    textAlign: 'left',
  },
  sub: { fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.6 },
  btn: {
    padding: '13px 32px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
}
