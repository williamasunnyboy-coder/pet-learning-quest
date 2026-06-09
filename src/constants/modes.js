/**
 * 使用模式常量
 * 三种 ID 在全项目所有地方都从这里引用，禁止再用裸字符串。
 */
export const MODE = Object.freeze({
  FAMILY: 'family',
  CAMPUS: 'campus',
  SCHOOL_HOME: 'school-home',
})

export const MODE_LIST = Object.freeze(Object.values(MODE))

export function isValidMode(m) {
  return MODE_LIST.includes(m)
}

export function needsClassCode(mode) {
  return mode === MODE.CAMPUS || mode === MODE.SCHOOL_HOME
}

// 校园模式：家长不参与确认（孩子做完即结算）
export function isAutoConfirmMode(mode) {
  return mode === MODE.CAMPUS
}
