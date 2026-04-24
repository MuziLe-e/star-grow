// uniCloud-aliyun/cloudfunctions/deleteReward/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { reward_id, family_id } = event

  // 校验奖励属于该家庭，防止越权删除
  if (family_id) {
    const rewardRes = await db.collection('rewards').doc(reward_id).get()
    const reward = rewardRes.data[0] || rewardRes.data
    if (!reward || reward.family_id !== family_id) {
      return { success: false, error: '无权删除该奖励' }
    }
  }

  await db.collection('rewards').doc(reward_id).remove()

  return { success: true }
}
