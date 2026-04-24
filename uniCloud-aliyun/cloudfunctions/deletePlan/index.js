// uniCloud-aliyun/cloudfunctions/deletePlan/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { plan_id, family_id } = event

  // 校验计划属于该家庭，防止越权删除
  if (family_id) {
    const planRes = await db.collection('plans').doc(plan_id).get()
    const plan = planRes.data[0] || planRes.data
    if (!plan || plan.family_id !== family_id) {
      return { success: false, error: '无权删除该计划' }
    }
  }

  // 删除计划
  await db.collection('plans').doc(plan_id).remove()

  // 删除该计划下的打卡记录
  await db.collection('checkins').where({ plan_id }).remove()

  return { success: true }
}
