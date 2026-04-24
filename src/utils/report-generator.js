/**
 * 周报生成工具
 * 每周汇总孩子打卡数据生成报告
 */
import { callFunction } from './api.js'

// 家长指南 - 按周阶段
const PARENT_GUIDES = {
  1: { phase: '第1-2周', title: '建立微习惯', tips: [
    '把学习任务拆成10分钟小目标',
    '让孩子自己选择先做什么',
    '"就做5分钟"降低启动门槛',
  ]},
  2: { phase: '第1-2周', title: '建立微习惯', tips: [
    '保持每日打卡节奏',
    '表扬具体行为而非结果',
    '用积分系统建立成就感',
  ]},
  3: { phase: '第3-4周', title: '给掌控感+少催多问', tips: [
    '让孩子参与制定计划',
    '把"快点写"换成"你打算什么时候开始？"',
    '接受偶尔的倒退，不要急',
  ]},
  4: { phase: '第3-4周', title: '给掌控感+少催多问', tips: [
    '鼓励孩子自己安排顺序',
    '让自然后果发挥作用',
    '关注进步而非完美',
  ]},
  5: { phase: '第5-6周', title: '同伴效应+自然后果', tips: [
    '可以找学习伙伴一起打卡',
    '完全放手让孩子自主开始',
    '只做观察者和鼓励者',
  ]},
  6: { phase: '第5-6周', title: '同伴效应+自然后果', tips: [
    '让孩子教别人（费曼学习法）',
    '庆祝坚持下来的成果',
    '适当提高挑战难度',
  ]},
}

/**
 * 生成周报数据
 * @param {string} childId
 * @param {string} weekStart 'YYYY-MM-DD'
 */
export async function generateWeeklyReport(childId, weekStart) {
  const result = await callFunction('getCheckins', {
    child_id: childId,
    week_start: weekStart,
  })

  const checkins = result.data || []
  const stats = {
    total_checks: checkins.length,
    completion_rate: 0,
    points_earned: checkins.reduce((sum, c) => sum + (c.points_earned || 0), 0),
    self_checks: checkins.filter(c => c.checked_by === 'self').length,
  }

  // 获取阶段指南
  const weekNum = getWeekNumber()
  const guide = PARENT_GUIDES[weekNum] || PARENT_GUIDES[1]

  return { stats, guide, weekStart, childId }
}

function getWeekNumber() {
  // 简单按使用后的周数计算（可改为从首次打卡算起）
  const start = new Date('2026-04-16')
  const now = new Date()
  const weeks = Math.ceil((now - start) / (7 * 24 * 60 * 60 * 1000))
  return Math.min(weeks, 8) // 最多8周
}
