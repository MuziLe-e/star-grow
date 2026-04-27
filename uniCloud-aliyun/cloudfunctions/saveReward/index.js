// uniCloud-aliyun/cloudfunctions/saveReward/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { reward_id, title, description, points_cost, icon, category, stock, family_id } = event

  // 校验 family_id 必须存在，防止数据混乱
  if (!family_id) {
    return { success: false, error: '缺少 family_id 参数' }
  }

  if (reward_id) {
    // 更新：校验奖励属于该家庭，防止越权修改
    const rewardRes = await db.collection('rewards').doc(reward_id).get()
    const reward = rewardRes.data[0] || rewardRes.data
    if (!reward || reward.family_id !== family_id) {
      return { success: false, error: '无权修改该奖励' }
    }
    
    const updateData = { title, description, points_cost, icon, category, stock }
    await db.collection('rewards').doc(reward_id).update(updateData)
    const res = await db.collection('rewards').doc(reward_id).get()
    return { success: true, data: res.data[0] || res.data }
  }

  // 新建：确保 family_id 正确设置
  const reward = {
    title,
    description: description || '',
    icon: icon || '',
    points_cost: points_cost || 0,
    category: category || 'experience',
    status: 'active',
    stock: stock !== undefined ? stock : -1,
    family_id: family_id,
    created_at: Date.now(),
  }
  const res = await db.collection('rewards').add(reward)
  reward._id = res.id
  return { success: true, data: reward }
}
