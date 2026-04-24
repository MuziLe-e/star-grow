// uniCloud-aliyun/cloudfunctions/getBadges/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { child_id } = event

  const res = await db.collection('badges')
    .where({ child_id })
    .orderBy('unlocked_at', 'desc')
    .get()

  return { success: true, data: res.data }
}
