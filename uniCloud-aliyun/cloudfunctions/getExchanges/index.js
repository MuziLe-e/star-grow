// uniCloud-aliyun/cloudfunctions/getExchanges/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { child_id, status, family_id } = event

  let query = {}
  if (child_id) query.child_id = child_id
  if (status) query.status = status
  if (family_id) query.family_id = family_id

  const res = await db.collection('exchanges')
    .where(query)
    .orderBy('created_at', 'desc')
    .get()

  return { success: true, data: res.data }
}
