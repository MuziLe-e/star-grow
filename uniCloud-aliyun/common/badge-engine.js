// uniCloud-aliyun/common/badge-engine.js
const { STREAK_BONUS, BADGE_DEFS } = require('./const')

/**
 * 计算连续打卡天数
 */
async function getStreak(db, childId, planId) {
  const records = await db.collection('checkins')
    .where({ plan_id: planId, child_id: childId })
    .field({ date: true })
    .orderBy('date', 'asc')
    .get()

  const dates = records.data.map(c => c.date)
  if (!dates.length) return 0

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const last = dates[dates.length - 1]
  if (last !== today && last !== yesterday) return 0

  let streak = 1
  for (let i = dates.length - 2; i >= 0; i--) {
    const prev = new Date(dates[i])
    const next = new Date(dates[i + 1])
    const diff = (next - prev) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

/**
 * 获取连续打卡加成
 */
function getStreakBonus(streak) {
  let bonus = 0
  let bonusType = null
  for (const [days, points] of Object.entries(STREAK_BONUS).sort((a, b) => b[0] - a[0])) {
    if (streak >= parseInt(days)) {
      bonus = points
      bonusType = `streak_${days}`
      break
    }
  }
  return { bonus, bonusType }
}

/**
 * 检查并颁发勋章
 */
async function checkBadgesForCheckin(db, childId, planId, checkinData, streak) {
  const newBadges = []

  // 获取已有勋章
  const existingRes = await db.collection('badges')
    .where({ child_id: childId })
    .field({ badge_type: true })
    .get()
  const existing = existingRes.data.map(b => b.badge_type)

  // 连续打卡勋章
  const streakMap = { 1: 'first_checkin', 3: 'streak_3', 7: 'streak_7', 14: 'streak_14', 30: 'streak_30' }
  if (streakMap[streak] && !existing.includes(streakMap[streak])) {
    const type = streakMap[streak]
    newBadges.push({ badge_type: type, ...BADGE_DEFS[type] })
  }

  // 自主打卡
  if (checkinData.checked_by === 'self' && !existing.includes('first_self')) {
    newBadges.push({ badge_type: 'first_self', ...BADGE_DEFS.first_self })
  }

  // 心情记录员：连续5天写了感受
  if (checkinData.feeling) {
    const feelRes = await db.collection('checkins')
      .where({ child_id: childId, feeling: db.command.neq(null) })
      .field({ date: true })
      .orderBy('date', 'asc')
      .get()
    const uniqueDates = [...new Set(feelRes.data.map(c => c.date))]
    let feelStreak = 1
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const diff = (new Date(uniqueDates[i + 1]) - new Date(uniqueDates[i])) / 86400000
      if (diff === 1) feelStreak++
      else break
    }
    if (feelStreak >= 5 && !existing.includes('mood_recorder')) {
      newBadges.push({ badge_type: 'mood_recorder', ...BADGE_DEFS.mood_recorder })
    }
  }

  // 全能之星：一周内所有分类都有打卡
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const weekCheckins = await db.collection('checkins')
    .where({ child_id: childId, date: db.command.gte(weekAgo) })
    .field({ plan_id: true })
    .get()
  const weekPlanIds = [...new Set(weekCheckins.data.map(c => c.plan_id))]
  if (weekPlanIds.length > 0) {
    const plans = await db.collection('plans')
      .where({ _id: db.command.in(weekPlanIds) })
      .field({ category: true })
      .get()
    const categories = new Set(plans.data.map(p => p.category))
    if (categories.size >= 4 && !existing.includes('all_category')) {
      newBadges.push({ badge_type: 'all_category', ...BADGE_DEFS.all_category })
    }
  }

  // 保存新勋章
  if (newBadges.length > 0) {
    const docs = newBadges.map(b => ({
      ...b,
      child_id: childId,
      unlocked_at: Date.now(),
    }))
    await db.collection('badges').add(docs)
  }

  return newBadges
}

module.exports = { getStreak, getStreakBonus, checkBadgesForCheckin }
