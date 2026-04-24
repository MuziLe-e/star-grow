// uniCloud-aliyun/cloudfunctions/getCheckins/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { child_id, date, week_start } = event

  let query = { child_id }
  if (date) query.date = date
  if (week_start) query.date = db.command.gte(week_start)

  const res = await db.collection('checkins')
    .where(query)
    .orderBy('created_at', 'desc')
    .get()

  return { success: true, data: res.data }
}
