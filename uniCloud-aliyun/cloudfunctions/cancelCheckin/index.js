// uniCloud-aliyun/cloudfunctions/cancelCheckin/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { plan_id, child_id, date } = event

  // 查找打卡记录
  const res = await db.collection('checkins')
    .where({ plan_id, child_id, date })
    .get()

  if (!res.data || res.data.length === 0) {
    return { success: false, error: '未找到打卡记录' }
  }

  const record = res.data[0]
  const refund = record.points_earned || 0

  // 删除打卡记录
  await db.collection('checkins').doc(record._id).remove()

  // 退还积分
  if (refund > 0) {
    await db.collection('members').doc(child_id).update({
      current_points: db.command.inc(-refund),
      // total_points 是累计获得值，取消打卡不应回退
    })
  }

  return { success: true, data: { refunded: refund } }
}
