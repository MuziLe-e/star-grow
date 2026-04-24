// uniCloud-aliyun/cloudfunctions/getPlans/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { family_id } = event

  const res = await db.collection('plans')
    .where({ family_id })
    .orderBy('created_at', 'desc')
    .get()

  return { success: true, data: res.data }
}
