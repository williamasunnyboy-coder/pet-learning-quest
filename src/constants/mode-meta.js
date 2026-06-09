/**
 * 模式展示元数据 —— 三种使用模式的图标/文案/配色/特性表。
 *
 * 从 ModeSelect.jsx 抽离出来，便于 Setup / ParentView / ParentEntry 等多个组件共享，
 * 同时让组件文件只导出组件，保持 Vite Fast Refresh 正常工作。
 */
import { MODE, MODE_LIST } from './modes'

export const MODE_META = {
  [MODE.FAMILY]: {
    id: MODE.FAMILY,
    icon: '🏠',
    label: '家庭模式',
    tagline: '亲子专属空间',
    desc: '家长为孩子布置任务，孩子完成后家长确认，宠物一起成长。简单纯粹，不需要学校参与。',
    color: '#faad14',
    gradient: 'linear-gradient(135deg, #fffbe6, #fff8d0)',
    border: '#ffd666',
    features: ['🐾 家长自定义任务', '✅ 家长一键确认', '📊 家庭成长报告', '🔒 家长 PIN 保护'],
    needs: null,
  },
  [MODE.CAMPUS]: {
    id: MODE.CAMPUS,
    icon: '🏫',
    label: '校园模式',
    tagline: '课堂专用，教师直接带班',
    desc: '教师通过班级码布置作业，学生完成后立即获得奖励，无需家长介入。适合课堂内使用。',
    color: '#667eea',
    gradient: 'linear-gradient(135deg, #f0f4ff, #e8efff)',
    border: '#b0c4ff',
    features: ['📋 教师班级码作业', '⚡ 完成即得奖励', '🏆 班级学习排行', '👁 家长只读观察'],
    needs: 'classCode',
  },
  [MODE.SCHOOL_HOME]: {
    id: MODE.SCHOOL_HOME,
    icon: '🤝',
    label: '家校联合模式',
    tagline: '三方协作，效果最大化',
    desc: '教师布置 + 家长管理 + 孩子完成，进度在家校之间实时流通，全方位守护孩子成长。',
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #f6ffed, #e8f9e0)',
    border: '#95de64',
    features: ['📋 教师作业自动推送', '✅ 家长确认同步教师', '🏠 家长自定义任务', '📢 家校公告联动'],
    needs: 'classCode',
  },
}

export const MODE_ORDER = MODE_LIST
