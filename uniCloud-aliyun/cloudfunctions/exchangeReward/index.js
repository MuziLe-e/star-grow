// uniCloud-aliyun/cloudfunctions/exchangeReward/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { reward_id, child_id, family_id } = event

  // 获取奖励信息
  const rewardRes = await db.collection('rewards').doc(reward_id).get()
  const reward = rewardRes.data[0] || rewardRes.data
  if (!reward) {
    return { success: false, error: '奖励不存在' }
  }

  // 获取成员积分
  const memberRes = await db.collection('members').doc(child_id).get()
  const member = memberRes.data[0] || memberRes.data
  const currentPoints = member ? (member.current_points || 0) : 0

  if (currentPoints < reward.points_cost) {
    return { success: false, error: '积分不足' }
  }

  // 扣减积分
  await db.collection('members').doc(child_id).update({
    current_points: db.command.inc(-reward.points_cost),
  })

  // 检查库存
  if (reward.stock !== undefined && reward.stock !== -1 && reward.stock > 0) {
    const newStock = reward.stock - 1
    const updateData = { stock: newStock }
    if (newStock <= 0) updateData.status = 'archived'
    await db.collection('rewards').doc(reward_id).update(updateData)
  }

  // 创建兑换记录
  const exchange = {
    reward_id,
    reward_title: reward.title,
    reward_icon: reward.icon || '',
    child_id,
    family_id: family_id || '',
    points_spent: reward.points_cost,
    status: 'pending',
    created_at: Date.now(),
  }
  const exRes = await db.collection('exchanges').add(exchange)
  exchange._id = exRes.id

  return { success: true, data: exchange }
}
