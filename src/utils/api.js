// utils/api.js — 云函数调用封装（uniCloud 真实后端）

// CLI 项目需要手动初始化 uniCloud
let _cloudInited = false
function ensureCloudInit() {
  if (_cloudInited) return
  if (typeof uniCloud !== 'undefined' && uniCloud.init) {
    uniCloud.init({
      provider: 'aliyun',
      spaceId: 'mp-8799b3f0-3727-4556-8530-5eb7adfefce9',
      clientSecret: ''
    })
  }
  _cloudInited = true
}

/**
 * 调用云函数
 * @param {string} name 云函数名
 * @param {object} data 参数
 * @returns {object} { success, data }
 */
export async function callFunction(name, data = {}) {
  ensureCloudInit()
  try {
    const res = await uniCloud.callFunction({ name, data })
    return res.result
  } catch (e) {
    console.error(`云函数 ${name} 调用失败:`, e)
    return { success: false, error: e.message || '云函数调用失败' }
  }
}
