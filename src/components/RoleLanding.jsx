/**
 * RoleLanding —— 角色选择落地页
 *
 * 第一次访问根路径时，弹出"我是学生 / 我是家长 / 我是老师"。
 * 选择后路由到对应入口：
 *   - 学生 → 继续在 `/`，进入 Setup
 *   - 家长 → 跳转到 `/#parent`
 *   - 老师 → 跳转到 `/#teacher`
 *
 * 选完会写一个 cookie/localStorage 记号，下次直接进默认入口。
 * 老用户（已经 setup 过 = state.initialized）不会看到本页面。
 */

const ROLE_KEY = 'petPreferredRole'

export function getPreferredRole() {
  try { return localStorage.getItem(ROLE_KEY) } catch { return null }
}
export function setPreferredRole(role) {
  try { localStorage.setItem(ROLE_KEY, role) } catch {}
}

export default function RoleLanding({ onRoleSelect }) {
  function pick(role) {
    setPreferredRole(role)
    if (role === 'parent')  { window.location.hash = '#parent'; return }
    if (role === 'teacher') { window.location.hash = '#teacher'; return }
    // student → 留在当前 URL，回调由 App 处理
    onRoleSelect?.(role)
  }

  return (
    <div style={S.shell}>
      <div style={S.bgBubbles}>
        {/* 装饰背景气泡 */}
        <div style={{ ...S.bubble, top: '8%', left: '10%', background: '#fce4ff', width: 120, height: 120 }} />
        <div style={{ ...S.bubble, top: '60%', right: '12%', background: '#e0f7fa', width: 180, height: 180 }} />
        <div style={{ ...S.bubble, bottom: '5%', left: '20%', background: '#fff8e1', width: 140, height: 140 }} />
      </div>

      <div style={S.container}>
        <header style={S.header}>
          <div style={S.logo}>🐾</div>
          <h1 style={S.title}>宠物学习助手</h1>
          <p style={S.subtitle}>请选择你的身份 — 三种角色，三套界面</p>
        </header>

        <div style={S.cards}>
          {/* 学生卡片 */}
          <button
            style={{ ...S.card, ...S.cardStudent }}
            onClick={() => pick('student')}
            aria-label="我是学生，进入孩子端"
          >
            <div style={S.cardIcon} aria-hidden="true">🥚</div>
            <div style={S.cardTitle}>我是学生</div>
            <div style={S.cardSubtitle}>完成任务，养大我的宠物</div>
            <ul style={S.cardFeatures}>
              <li>📝 每日任务打卡</li>
              <li>🐣 宠物 4 阶段进化</li>
              <li>🌟 解锁专属服饰</li>
              <li>🌳 班级花园看同学</li>
            </ul>
            <div style={{ ...S.cardBtn, background: '#ffd666' }}>进入孩子端 →</div>
          </button>

          {/* 家长卡片 */}
          <button
            style={{ ...S.card, ...S.cardParent }}
            onClick={() => pick('parent')}
            aria-label="我是家长，进入家长端"
          >
            <div style={S.cardIcon} aria-hidden="true">👨‍👩‍👧</div>
            <div style={S.cardTitle}>我是家长</div>
            <div style={S.cardSubtitle}>布置任务、确认完成、查看报告</div>
            <ul style={S.cardFeatures}>
              <li>✅ 任务确认 + 加分</li>
              <li>📊 月度成长报告</li>
              <li>🏫 绑定教师班级码</li>
              <li>🔒 PIN 保护管理界面</li>
            </ul>
            <div style={{ ...S.cardBtn, background: '#fa8c16', color: '#fff' }}>进入家长端 →</div>
          </button>

          {/* 老师卡片 */}
          <button
            style={{ ...S.card, ...S.cardTeacher }}
            onClick={() => pick('teacher')}
            aria-label="我是老师，进入教师 Web 端"
          >
            <div style={S.cardIcon} aria-hidden="true">🏫</div>
            <div style={S.cardTitle}>我是老师</div>
            <div style={S.cardSubtitle}>课堂管理 Web · 适合电脑/平板</div>
            <ul style={S.cardFeatures}>
              <li>👥 班级学生名册</li>
              <li>📋 在线布置作业</li>
              <li>🐾 全班宠物墙</li>
              <li>📊 完成率统计排行</li>
            </ul>
            <div style={{ ...S.cardBtn, background: '#52c41a', color: '#fff' }}>进入教师端 →</div>
          </button>
        </div>

        <footer style={S.footer}>
          <div style={S.footerHint}>💡 三种模式适配不同场景</div>
          <div style={S.modeRow}>
            <span style={{ ...S.modeChip, background: '#fff8d0', color: '#8c6a00' }}>🏠 家庭模式：学生 + 家长</span>
            <span style={{ ...S.modeChip, background: '#e8efff', color: '#3a4ad9' }}>🏫 校园模式：学生 + 老师</span>
            <span style={{ ...S.modeChip, background: '#e8f9e0', color: '#389e0d' }}>🤝 家校联合：学生 + 家长 + 老师</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

const S = {
  shell: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f8f6ff 0%, #e9f6ff 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    padding: '24px 16px',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  },
  bgBubbles: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  bubble: { position: 'absolute', borderRadius: '50%', opacity: 0.6, filter: 'blur(20px)' },

  container: {
    position: 'relative', zIndex: 1,
    maxWidth: 1200, width: '100%',
    padding: '40px 20px 60px',
  },
  header: { textAlign: 'center', marginBottom: 36 },
  logo: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 900, color: '#1a1a2e', margin: 0, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8 },

  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 22,
    marginBottom: 30,
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '28px 24px 24px',
    border: '2.5px solid transparent',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
    fontFamily: 'inherit',
  },
  cardStudent: { borderColor: '#ffd666' },
  cardParent:  { borderColor: '#ffc069' },
  cardTeacher: { borderColor: '#95de64' },
  cardIcon: { fontSize: 56, marginBottom: 6, lineHeight: 1 },
  cardTitle: { fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '8px 0 4px' },
  cardSubtitle: { fontSize: 13, color: '#888', marginBottom: 14 },
  cardFeatures: {
    listStyle: 'none', padding: 0, margin: '0 0 18px',
    display: 'flex', flexDirection: 'column', gap: 6,
    textAlign: 'left',
    background: '#fafafa', borderRadius: 12,
    padding: '14px 18px',
    fontSize: 13, color: '#555', lineHeight: 1.7,
  },
  cardBtn: {
    padding: '12px',
    borderRadius: 12,
    fontSize: 14, fontWeight: 800,
    color: '#1a1a2e',
    transition: 'all 0.2s',
  },

  footer: {
    textAlign: 'center',
    padding: 20,
    background: 'rgba(255,255,255,0.6)',
    borderRadius: 18,
    backdropFilter: 'blur(8px)',
  },
  footerHint: { fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 10 },
  modeRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  modeChip: {
    fontSize: 12, fontWeight: 700,
    padding: '6px 14px',
    borderRadius: 999,
  },
}
