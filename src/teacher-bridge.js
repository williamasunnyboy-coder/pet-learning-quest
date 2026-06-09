/**
 * 教师桥接层 —— store.js 与 teacher-store.js 之间的解耦层
 *
 * store.js 不再静态 import teacher-store。
 * 调用方（学员 App）在 mount 前通过 registerTeacherBridge() 注入，
 * 纯家庭模式（不绑定班级）下根本不会触发，可被 tree-shake / lazy 化。
 */

const noop = () => {}
const empty = () => []

let bridge = {
  getTasks: empty,           // (classCode) => Assignment[]
  reportDone: noop,          // (classCode, profileId, assignmentId) => void
  lookup: () => null,        // (classCode) => ClassLink | null
  publishPresence: noop,     // (classCode, profileId, snapshot) => void
  getPeers: () => ({}),      // (classCode) => { profileId: PeerSnapshot }
}

export function registerTeacherBridge(impl) {
  if (!impl) return
  bridge = {
    getTasks: impl.getTasks || empty,
    reportDone: impl.reportDone || noop,
    lookup: impl.lookup || (() => null),
    publishPresence: impl.publishPresence || noop,
    getPeers: impl.getPeers || (() => ({})),
  }
}

export function getTeacherBridge() {
  return bridge
}

// 便捷调用（语义化）
export function bridgeGetTasks(code) {
  return bridge.getTasks(code) || []
}
export function bridgeReportDone(code, profileId, assignmentId) {
  return bridge.reportDone(code, profileId, assignmentId)
}
export function bridgePublishPresence(code, profileId, snapshot) {
  return bridge.publishPresence(code, profileId, snapshot)
}
export function bridgeGetPeers(code) {
  return bridge.getPeers(code) || {}
}
