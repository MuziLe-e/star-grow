// uniCloud-aliyun/cloudfunctions/confirmExchange/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { exchange_id, confirmed, parent_note } = event

  // 获取兑换记录
  const res = await db.collection('exchanges').doc(exchange_id).get()
  const exchange = res.data[0] || res.data
  if (!exchange) {
    return { success: false, error: '兑换记录不存在' }
  }

  if (confirmed) {
    await db.collection('exchanges').doc(exchange_id).update({
      status: 'confirmed',
      confirmed_at: Date.now(),
      parent_note: parent_note || '',
    })
  } else {
    await db.collection('exchanges').doc(exchange_id).update({
      status: 'cancelled',
      confirmed_at: Date.now(),
    })
    // 退还积分
    await db.collection('members').doc(exchange.child_id).update({
      current_points: db.command.inc(exchange.points_spent),
    })
  }

  return { success: true }
}
