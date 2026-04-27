// uniCloud-aliyun/cloudfunctions/getCheckins/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { child_id, date, week_start, family_id } = event

  // 如果有 family_id，校验用户属于该家庭
  if (family_id && child_id) {
    const memberRes = await db.collection('members').doc(child_id).get()
    const member = memberRes.data[0] || memberRes.data
    if (!member || member.family_id !== family_id) {
      return { success: false, error: '无权查看该用户的打卡记录' }
    }
  }

  let query = { child_id }
  if (date) query.date = date
  if (week_start) query.date = db.command.gte(week_start)

  const res = await db.collection('checkins')
    .where(query)
    .orderBy('created_at', 'desc')
    .get()

  return { success: true, data: res.data }
}
