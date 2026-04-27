// uniCloud-aliyun/cloudfunctions/getInviteCode/index.js
'use strict'

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { family_id } = event

  if (!family_id) {
    return { success: false, error: '缺少 family_id 参数' }
  }

  // 获取家庭信息
  const familyRes = await db.collection('families').doc(family_id).get()
  if (!familyRes.data || familyRes.data.length === 0) {
    return { success: false, error: '家庭不存在' }
  }

  const family = familyRes.data[0]

  return {
    success: true,
    data: {
      invite_code: family.invite_code
    }
  }
}
