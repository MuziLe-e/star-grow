// uniCloud-aliyun/cloudfunctions/exchangeReward/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { reward_id, child_id, family_id } = event

  // 校验 family_id 必须存在
  if (!family_id) {
    return { success: false, error: '缺少 family_id 参数' }
  }

  // 获取奖励信息并校验权限
  const rewardRes = await db.collection('rewards').doc(reward_id).get()
  const reward = rewardRes.data[0] || rewardRes.data
  if (!reward) {
    return { success: false, error: '奖励不存在' }
  }
  
  // 校验奖励属于该家庭，防止越权兑换
  if (reward.family_id !== family_id) {
    return { success: false, error: '无权兑换该奖励' }
  }

  // 获取成员积分并校验权限
  const memberRes = await db.collection('members').doc(child_id).get()
  const member = memberRes.data[0] || memberRes.data
  if (!member || member.family_id !== family_id) {
    return { success: false, error: '无权操作该用户' }
  }
  
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
