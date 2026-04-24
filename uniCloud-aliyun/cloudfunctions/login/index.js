// uniCloud-aliyun/cloudfunctions/login/index.js
'use strict'

// 检查 openId 是否在白名单中
async function isOpenIdInWhitelist(db, openId) {
  if (!openId) return false
  const res = await db.collection('whitelist').where({ openId }).limit(1).get()
  return res.data && res.data.length > 0
}

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { code, nickname, role, memberId, avatarUrl } = event

  let openId = ''

  // 微信小程序登录
  if (code) {
    try {
      const res = await uniCloud.callFunction({
        name: 'uni-id-co',
        data: {
          action: 'loginByWeixin',
          params: { code }
        }
      })
      if (res.result && res.result.openid) {
        openId = res.result.openid
      }
    } catch (e) {
      // uni-id 未配置时，尝试直接用 code2Session
      try {
        const wxRes = await uniCloud.httpclient.request(
          'https://api.weixin.qq.com/sns/jscode2session',
          {
            method: 'GET',
            data: {
              appid: 'wx627a9b9f513b8a4d',
              secret: '0b87393f0b2332e072d1d14e0c2aa112', // 需要在 uniCloud 控制台配置
              js_code: code,
              grant_type: 'authorization_code'
            },
            dataType: 'json'
          }
        )
        if (wxRes.data && wxRes.data.openid) {
          openId = wxRes.data.openid
		  console.log(openId)
        }
      } catch (e2) {
        console.error('微信登录失败:', e2)
      }
    }
  }

  // 白名单校验：审核期间暂时放开，审核通过后再开启
  // if (openId) {
  //   const allowed = await isOpenIdInWhitelist(db, openId)
  //   if (!allowed) {
  //     return { success: false, error: 'whitelist_rejected', message: '该小程序暂未对你开放' }
  //   }
  // }

  // 查找或创建成员
  let member
  if (memberId) {
    const res = await db.collection('members').doc(memberId).get()
    if (res.data && res.data.length > 0) {
      member = res.data[0]
      // 更新信息
      const updateData = {}
      if (nickname) updateData.nickname = nickname
      if (role) updateData.role = role
      if (openId) updateData.openId = openId
      if (avatarUrl) updateData.avatarUrl = avatarUrl
      if (Object.keys(updateData).length > 0) {
        await db.collection('members').doc(memberId).update(updateData)
        Object.assign(member, updateData)
      }
    }
  }

  if (!member && openId) {
    const res = await db.collection('members').where({ openId }).get()
    if (res.data && res.data.length > 0) {
      member = res.data[0]
      // 更新用户信息（昵称、角色、头像可能已变更）
      const updateData = {}
      if (nickname) updateData.nickname = nickname
      if (role) updateData.role = role
      if (avatarUrl) updateData.avatarUrl = avatarUrl
      if (Object.keys(updateData).length > 0) {
        await db.collection('members').doc(member._id).update(updateData)
        Object.assign(member, updateData)
      }
    }
  }

  if (!member) {
    // 新用户：用 openId 生成唯一 family_id，确保多用户数据隔离
    const familyId = openId ? ('family_' + openId.slice(-16)) : 'family_default'
    const newMember = {
      nickname: nickname || '用户',
      role: role || 'child',
      family_id: familyId,
      openId,
      avatarUrl: avatarUrl || '',
      current_points: 0,
      total_points: 0,
    }
    const res = await db.collection('members').add(newMember)
    newMember._id = res.id
    newMember.isNewUser = true  // 标记新用户，前端用来初始化默认数据
    member = newMember
  }

  return { success: true, data: member }
}
