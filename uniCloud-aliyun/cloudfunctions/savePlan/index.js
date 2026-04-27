// uniCloud-aliyun/cloudfunctions/savePlan/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { _id, title, description, family_id, points_per_check, category, icon, frequency, reminder_time } = event

  // 校验 family_id 必须存在，防止数据混乱
  if (!family_id) {
    return { success: false, error: '缺少 family_id 参数' }
  }

  if (_id) {
    // 更新：校验计划属于该家庭，防止越权修改
    const planRes = await db.collection('plans').doc(_id).get()
    const plan = planRes.data[0] || planRes.data
    if (!plan || plan.family_id !== family_id) {
      return { success: false, error: '无权修改该计划' }
    }
    
    const updateData = { title, description, points_per_check, category, icon, frequency, reminder_time }
    await db.collection('plans').doc(_id).update(updateData)
    const res = await db.collection('plans').doc(_id).get()
    return { success: true, data: res.data[0] || res.data }
  }

  // 新建：确保 family_id 正确设置
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
