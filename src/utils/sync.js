/**
 * 离线同步工具
 * 优先离线：打卡操作直接写入本地 Storage，不阻塞用户
 * 静默同步：每次打开 App / 切换前台时，检查本地未同步队列，批量上传
 * 冲突处理：以云端数据为准，本地已存在的打卡跳过（幂等设计）
 */
const SYNC_KEY = 'pending_sync'
const LAST_SYNC_KEY = 'last_sync_at'

/**
 * 添加到同步队列
 */
export function addToSyncQueue(checkinData) {
  const queue = uni.getStorageSync(SYNC_KEY) || []
  // 检查是否已在队列中（同天同计划）
  const exists = queue.find(q => q.plan_id === checkinData.plan_id && q.date === checkinData.date)
  if (exists) return // 避免重复
  queue.push({ ...checkinData, timestamp: Date.now() })
  uni.setStorageSync(SYNC_KEY, queue)
}

/**
 * 批量同步离线数据
 */
export async function flushSyncQueue() {
  const queue = uni.getStorageSync(SYNC_KEY) || []
  if (!queue.length) return { synced: 0 }

  try {
    const { callFunction } = await import('./api.js')

    // 按日期排序
    queue.sort((a, b) => new Date(a.date) - new Date(b.date))

    const result = await callFunction('syncOffline', {
      child_id: uni.getStorageSync('memberId'),
      checkins: queue
    })

    if (result.success !== false) {
      // 同步成功，清空队列
      const data = result.data || {}
      const synced = data.synced || 0
      if (synced > 0) {
        // 移除已同步的记录
        uni.setStorageSync(SYNC_KEY, [])
      }
      uni.setStorageSync(LAST_SYNC_KEY, Date.now())
      return data
    }
    return { synced: 0, error: result.error }
  } catch (e) {
    console.error('同步失败:', e)
    return { synced: 0, error: e.message }
  }
}

/**
 * 获取待同步数量
 */
export function getPendingCount() {
  return (uni.getStorageSync(SYNC_KEY) || []).length
}

/**
 * 获取上次同步时间
 */
export function getLastSyncTime() {
  return uni.getStorageSync(LAST_SYNC_KEY) || 0
}

/**
 * 检查网络状态
 */
export function getNetworkType() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => resolve(res.networkType),
      fail: () => resolve('none'),
    })
  })
}

/**
 * 智能同步：有网络且有待同步数据时才执行
 */
export async function smartSync() {
  const count = getPendingCount()
  if (count === 0) return null

  const networkType = await getNetworkType()
  if (networkType === 'none') {
    console.log('当前无网络，跳过同步')
    return null
  }

  return flushSyncQueue()
}
