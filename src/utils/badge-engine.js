/**
 * 勋章检测引擎
 * 每次打卡后调用，检查是否触发新勋章
 */

// 勋章定义
export const BADGE_DEFS = {
  // 里程碑类
  first_checkin: { title: '初出茅庐', icon: '🌱', desc: '首次完成打卡' },
  // 连续类
  streak_3:      { title: '三连击', icon: '🔥', desc: '同一计划连续打卡3天' },
  streak_7:      { title: '一周坚持', icon: '⚡', desc: '同一计划连续打卡7天' },
  streak_14:     { title: '两周达人', icon: '💎', desc: '同一计划连续打卡14天' },
  streak_30:     { title: '月度冠军', icon: '👑', desc: '同一计划连续打卡30天' },
  // 特殊类
  first_self:    { title: '自主小达人', icon: '🦸', desc: '首次自主打卡（非家长代打）' },
  all_category:  { title: '全能之星', icon: '🌈', desc: '一周内所有分类都有打卡' },
  self_week:     { title: '自律之星', icon: '🌟', desc: '一周内所有打卡都是自主完成' },
  // 累计/习惯类
  mood_recorder: { title: '心情记录员', icon: '📝', desc: '连续5天打卡都写了感受' },
  reading_100:   { title: '阅读百分钟', icon: '📖', desc: '阅读类打卡累计100次' },
}

/**
 * 客户端勋章检查（简单版本，与云函数保持一致）
 * @param {string} childId - 孩子ID
 * @param {string} planId - 计划ID
 * @param {object} checkin - 本次打卡记录
 * @param {object} context - 上下文
 * @param {Array} context.existingBadges - 已有的勋章类型列表
 * @param {number} context.streak - 当前连续打卡天数
 * @param {Array} context.weekCheckins - 本周所有打卡记录
 * @param {Array} context.allPlans - 家庭所有活跃计划
 * @returns {Array} 新解锁的勋章列表
 */
export function checkBadges(childId, planId, checkin, context = {}) {
  const {
    existingBadges = [],
    streak = 0,
    weekCheckins = [],
    allPlans = [],
  } = context

  const newBadges = []

  // 1. 首次打卡
  if (!existingBadges.includes('first_checkin')) {
    newBadges.push({ badge_type: 'first_checkin', ...BADGE_DEFS.first_checkin })
  }

  // 2. 连续打卡类
  const streakMap = [
    [3, 'streak_3'],
    [7, 'streak_7'],
    [14, 'streak_14'],
    [30, 'streak_30'],
  ]
  for (const [days, type] of streakMap) {
    if (streak >= days && !existingBadges.includes(type)) {
      newBadges.push({ badge_type: type, ...BADGE_DEFS[type] })
    }
  }

  // 3. 首次自主打卡
  if (checkin.checked_by === 'self' && !existingBadges.includes('first_self')) {
    newBadges.push({ badge_type: 'first_self', ...BADGE_DEFS.first_self })
  }

  // 4. 全能之星：一周内所有分类都有打卡
  if (weekCheckins.length > 0 && !existingBadges.includes('all_category')) {
    const weekPlanIds = [...new Set(weekCheckins.map(c => c.plan_id))]
    const categories = new Set()
    weekPlanIds.forEach(pid => {
      const plan = allPlans.find(p => p._id === pid)
      if (plan) categories.add(plan.category)
    })
    // 至少覆盖4个分类（reading/study/exercise/life/custom中4个）
    if (categories.size >= 4) {
      newBadges.push({ badge_type: 'all_category', ...BADGE_DEFS.all_category })
    }
  }

  // 5. 自律之星：一周内所有打卡都是自主完成
  if (weekCheckins.length >= 5 && !existingBadges.includes('self_week')) {
    const allSelf = weekCheckins.every(c => c.checked_by === 'self')
    if (allSelf) {
      newBadges.push({ badge_type: 'self_week', ...BADGE_DEFS.self_week })
    }
  }

  // 6. 心情记录员：连续5天打卡都写了感受
  if (checkin.feeling && !existingBadges.includes('mood_recorder')) {
    const feelingDates = weekCheckins
      .filter(c => c.feeling && c.feeling.trim())
      .map(c => c.date)
    const uniqueDates = [...new Set(feelingDates)].sort()
    let feelStreak = 1
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const diff = (new Date(uniqueDates[i + 1]) - new Date(uniqueDates[i])) / 86400000
      if (diff === 1) feelStreak++
      else break
    }
    if (feelStreak >= 5) {
      newBadges.push({ badge_type: 'mood_recorder', ...BADGE_DEFS.mood_recorder })
    }
  }

  // 7. 阅读百分钟：阅读类打卡累计100次
  if (!existingBadges.includes('reading_100')) {
    const readingCheckins = weekCheckins.filter(c => {
      const plan = allPlans.find(p => p._id === c.plan_id)
      return plan && plan.category === 'reading'
    })
    // 这个需要全局数据，客户端只能检查本地已有记录
    // 完整检查在云函数中进行
  }

  return newBadges
}
