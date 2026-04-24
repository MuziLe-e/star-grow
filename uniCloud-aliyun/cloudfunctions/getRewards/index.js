// uniCloud-aliyun/cloudfunctions/getRewards/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { family_id } = event

  const query = { status: 'active' }
  if (family_id) query.family_id = family_id

  const res = await db.collection('rewards')
    .where(query)
    .orderBy('created_at', 'desc')
    .get()

  return { success: true, data: res.data }
}
