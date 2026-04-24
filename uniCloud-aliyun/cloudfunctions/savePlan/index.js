// uniCloud-aliyun/cloudfunctions/savePlan/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { _id, title, description, family_id, points_per_check, category, icon, frequency, reminder_time } = event

  if (_id) {
    // 更新
    const updateData = { title, description, points_per_check, category, icon, frequency, reminder_time }
    await db.collection('plans').doc(_id).update(updateData)
    const res = await db.collection('plans').doc(_id).get()
    return { success: true, data: res.data[0] || res.data }
  }

  // 新建
  const plan = {
    title,
    description: description || '',
    family_id,
    points_per_check: points_per_check || 10,
    category: category || 'other',
    icon: icon || '',
    frequency: frequency || { type: 'daily', count: 1 },
    reminder_time: reminder_time || '',
    status: 'active',
    created_at: Date.now(),
  }
  const res = await db.collection('plans').add(plan)
  plan._id = res.id
  return { success: true, data: plan }
}
