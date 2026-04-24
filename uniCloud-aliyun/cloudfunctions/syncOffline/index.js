// uniCloud-aliyun/cloudfunctions/syncOffline/index.js
'use strict'
const { checkBadgesForCheckin, getStreak } = require('./badge-engine')

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { child_id, checkins } = event

  let synced = 0
  let failed = 0
  let conflicts = 0
  let totalPoints = 0
  const newBadges = []

  if (!checkins || !Array.isArray(checkins)) {
    return { success: true, data: { synced: 0, failed: 0, conflicts: 0, total_points_added: 0, new_badges: [] } }
  }

  for (const item of checkins) {
    // 检查冲突
    const existingRes = await db.collection('checkins')
      .where({ plan_id: item.plan_id, child_id, date: item.date })
      .get()

    if (existingRes.data.length > 0) {
      conflicts++
      continue
    }

    // 获取计划积分
    let points = 10
    try {
      const planRes = await db.collection('plans').doc(item.plan_id).get()
      const plan = planRes.data[0] || planRes.data
      if (plan) points = plan.points_per_check || 10
    } catch (e) {
      // plan not found, use default
    }

    const record = {
      plan_id: item.plan_id,
      child_id,
      date: item.date,
      checked_by: item.checked_by || 'parent',
      feeling: item.feeling || '',
      points_earned: points,
      created_at: Date.now(),
    }

    try {
      await db.collection('checkins').add(record)
      totalPoints += points
      synced++
    } catch (e) {
      failed++
    }
  }

  // 更新成员积分
  if (totalPoints > 0) {
    // 使用 upsert 确保成员存在
    try {
      await db.collection('members').doc(child_id).update({
        current_points: db.command.inc(totalPoints),
        total_points: db.command.inc(totalPoints),
      })
    } catch (e) {
      // 如果成员不存在，创建
      await db.collection('members').add({
        nickname: '离线用户',
        role: 'child',
        family_id: 'family_001',
        current_points: totalPoints,
        total_points: totalPoints,
      })
    }
  }

  return {
    success: true,
    data: {
      synced,
      failed,
      conflicts,
      total_points_added: totalPoints,
      new_badges: newBadges,
    }
  }
}
