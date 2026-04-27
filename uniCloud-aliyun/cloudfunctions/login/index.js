// uniCloud-aliyun/cloudfunctions/login/index.js
'use strict'

// 检查 openId 是否在白名单中
async function isOpenIdInWhitelist(db, openId) {
  if (!openId) return false
  const res = await db.collection('whitelist').where({ openId }).limit(1).get()
  return res.data && res.data.length > 0
}

// 生成6位数字邀请码（确保唯一性）
async function generateUniqueInviteCode(db) {
  let inviteCode
  let isUnique = false
  let attempts = 0
  const maxAttempts = 10

  while (!isUnique && attempts < maxAttempts) {
    inviteCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 检查是否已存在
    const existing = await db.collection('families').where({ invite_code: inviteCode }).get()
    if (!existing.data || existing.data.length === 0) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique) {
    // 如果多次尝试都重复，使用时间戳后6位作为备选方案
    inviteCode = String(Date.now()).slice(-6)
  }

  return inviteCode
}

exports.main = async (event, context) => {
  const db = uniCloud.database()
  const { code, nickname, role, memberId, avatarUrl, inviteCode } = event

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
              appid: process.env.WECHAT_APPID || 'wx627a9b9f513b8a4d',
              secret: process.env.WECHAT_SECRET, // 必须在 uniCloud 控制台配置环境变量
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
  // 注意：正式上线前必须开启此校验！
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
    let familyId
    // 如果有邀请码,尝试查找对应的家庭
    if (inviteCode) {
      const familyRes = await db.collection('families').where({ invite_code: inviteCode, status: 'active' }).get()
      if (familyRes.data && familyRes.data.length > 0) {
        familyId = familyRes.data[0]._id
      } else {
        return { success: false, error: 'invalid_invite_code', message: '邀请码无效或已过期' }
      }
    } else {
      // 新用户:用 openId 生成唯一 family_id,确保多用户数据隔离
      if (openId) {
        familyId = 'family_' + openId.slice(-16)
      } else {
        // 如果没有 openId(非微信登录),使用时间戳确保唯一性
        familyId = 'family_' + Date.now()
      }
        
      // 创建家庭记录并生成唯一邀请码
      const inviteCode = await generateUniqueInviteCode(db)
      await db.collection('families').add({
        _id: familyId,
        invite_code: inviteCode,
        status: 'active',
        created_at: Date.now(),
      })
    }
    
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
    member = newMember
  }

  return { success: true, data: member }
}
