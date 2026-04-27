// uniCloud-aliyun/cloudfunctions/checkin/index.js
'use strict'
const { getStreak, getStreakBonus, checkBadgesForCheckin } = require('./badge-engine')

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { plan_id, child_id, date, checked_by, feeling, family_id } = event

  // 获取计划信息并校验权限
  const planRes = await db.collection('plans').doc(plan_id).get()
  const plan = planRes.data[0] || planRes.data
  if (!plan) {
    return { success: false, error: '计划不存在' }
  }
  
  // 校验计划属于该家庭，防止越权打卡
  if (family_id && plan.family_id !== family_id) {
    return { success: false, error: '无权操作该计划' }
  }
  
  // 校验用户属于该家庭
  if (family_id) {
    const memberRes = await db.collection('members').doc(child_id).get()
    const member = memberRes.data[0] || memberRes.data
    if (!member || member.family_id !== family_id) {
      return { success: false, error: '无权操作该用户' }
    }
  }
  
  const basePoints = plan ? (plan.points_per_check || 10) : 10

  // 检查是否已打卡
  const existingRes = await db.collection('checkins')
    .where({ plan_id, child_id, date })
    .get()
  if (existingRes.data.length > 0) {
    return { success: false, error: '今天已打卡' }
  }

  // 创建打卡记录
  let totalEarned = basePoints
  let bonus = 0
  let bonusType = null

  // 计算连续打卡（先插入再计算，包含当天）
  const checkinData = {
    plan_id,
    child_id,
    date,
    checked_by: checked_by || 'parent',
    feeling: feeling || '',
    points_earned: basePoints,
    created_at: Date.now(),
  }

  await db.collection('checkins').add(checkinData)

  // 计算连续打卡
  const streak = await getStreak(db, child_id, plan_id)
  const bonusResult = getStreakBonus(streak)
  bonus = bonusResult.bonus
  bonusType = bonusResult.bonusType

  if (bonus > 0) {
    totalEarned = basePoints + bonus
    // 更新打卡记录的积分
    const ciRes = await db.collection('checkins')
      .where({ plan_id, child_id, date })
      .get()
    if (ciRes.data.length > 0) {
      await db.collection('checkins').doc(ciRes.data[0]._id).update({
        bonus_points: bonus,
        bonus_type: bonusType,
        points_earned: totalEarned,
      })
    }
  }

  // 更新成员积分
  await db.collection('members').doc(child_id).update({
    current_points: db.command.inc(totalEarned),
    total_points: db.command.inc(totalEarned),
  })

  // 检查勋章
  const newBadges = await checkBadgesForCheckin(db, child_id, plan_id, checkinData, streak)

  return {
    success: true,
    data: {
      checkin_id: `ci_${Date.now()}`,
      points_earned: totalEarned,
      bonus_points: bonus,
      bonus_type: bonusType,
      total_today: basePoints + bonus,
      new_badges: newBadges,
      current_streak: streak,
    }
  }
}
