// uniCloud-aliyun/cloudfunctions/getPoints/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { member_id } = event

  const res = await db.collection('members').doc(member_id).get()
  const member = res.data[0] || res.data

  // 构建积分明细：从 checkins 获取获得记录
  const history = []

  // 获取最近 50 条打卡记录（积分获得）
  const checkinsRes = await db.collection('checkins')
    .where({ child_id: member_id })
    .orderBy('created_at', 'desc')
    .limit(50)
    .get()

  // 获取打卡对应的计划名称
  const planIds = [...new Set(checkinsRes.data.map(c => c.plan_id).filter(Boolean))]
  const planMap = {}
  if (planIds.length > 0) {
    const plansRes = await db.collection('plans')
      .where({ _id: db.command.in(planIds) })
      .field({ title: true })
      .get()
    plansRes.data.forEach(p => { planMap[p._id] = p.title })
  }

  for (const c of checkinsRes.data) {
    const planTitle = planMap[c.plan_id] || '打卡'
    history.push({
      source: `${planTitle}打卡`,
      amount: c.points_earned || 10,
      timestamp: c.created_at,
      date: c.date,
      type: 'earn'
    })
  }

  // 获取最近 20 条兑换记录（积分消耗）
  try {
    const exchangesRes = await db.collection('exchanges')
      .where({ child_id: member_id, status: 'confirmed' })
      .orderBy('created_at', 'desc')
      .limit(20)
      .get()
    for (const e of exchangesRes.data) {
      history.push({
        source: `兑换: ${e.reward_title || '奖励'}`,
        amount: -(e.points_spent || e.points_cost || 0),
        timestamp: e.created_at,
        date: new Date(e.created_at).toISOString().slice(0, 10),
        type: 'spend'
      })
    }
  } catch (e) {
    // exchanges 集合可能不存在
  }

  // 按时间倒序排列
  history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  return {
    success: true,
    data: {
      current_points: member ? (member.current_points || 0) : 0,
      total_points: member ? (member.total_points || 0) : 0,
      history: history.slice(0, 50)
    }
  }
}
