// uniCloud-aliyun/cloudfunctions/saveReward/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { reward_id, title, description, points_cost, icon, category, stock, family_id } = event

  if (reward_id) {
    // 更新
    const updateData = { title, description, points_cost, icon, category, stock }
    await db.collection('rewards').doc(reward_id).update(updateData)
    const res = await db.collection('rewards').doc(reward_id).get()
    return { success: true, data: res.data[0] || res.data }
  }

  // 新建
  const reward = {
    title,
    description: description || '',
    icon: icon || '',
    points_cost: points_cost || 0,
    category: category || 'experience',
    status: 'active',
    stock: stock !== undefined ? stock : -1,
    family_id: family_id || '',
    created_at: Date.now(),
  }
  const res = await db.collection('rewards').add(reward)
  reward._id = res.id
  return { success: true, data: reward }
}
