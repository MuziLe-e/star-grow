// uniCloud-aliyun/cloudfunctions/getWeeklyReport/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { child_id, family_id, week_start } = event

  const weekAgo = week_start || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  // 获取本周打卡记录
  const checkinsRes = await db.collection('checkins')
    .where({ child_id, date: db.command.gte(weekAgo) })
    .get()
  const checkins = checkinsRes.data

  const selfChecks = checkins.filter(c => c.checked_by === 'self').length
  const totalPoints = checkins.reduce((s, c) => s + (c.points_earned || 0), 0)

  // 获取活跃计划数
  const plansRes = await db.collection('plans')
    .where({ family_id, status: 'active' })
    .get()
  const totalPlans = plansRes.data.length

  const completionRate = totalPlans > 0
    ? Math.min(100, Math.round(checkins.length / (totalPlans * 7) * 100))
    : 0

  const selfCheckRate = checkins.length > 0
    ? Math.round(selfChecks / checkins.length * 100)
    : 0

  return {
    success: true,
    data: {
      stats: {
        total_checks: checkins.length,
        completion_rate: completionRate,
        points_earned: totalPoints,
        self_check_rate: selfCheckRate,
      },
      parent_tip: '坚持就是胜利！每天一小步，成长一大步~',
    }
  }
}
