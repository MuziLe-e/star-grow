// stores/points.js — 积分状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { callFunction } from '../utils/api.js'
import { useUserStore } from './user.js'

const get = (k) => uni.getStorageSync(k)
const set = (k, v) => uni.setStorageSync(k, v)

export const usePointsStore = defineStore('points', () => {
  const current = ref(get('current_points') || 0)
  const total = ref(get('total_points') || 0)
  const history = ref(get('points_history') || [])

  // 从云端获取最新积分数据
  async function fetchPoints(memberId) {
    try {
      const res = await callFunction('getPoints', { 
        member_id: memberId,
        family_id: useUserStore().familyId  // 添加 family_id 用于云端权限校验
      })
      if (res.data) {
        current.value = res.data.current_points || 0
        total.value = res.data.total_points || 0
        set('current_points', current.value)
        set('total_points', total.value)
        // 同步积分明细
        if (res.data.history && res.data.history.length > 0) {
          history.value = res.data.history
          set('points_history', history.value)
        }
      }
    } catch (e) {
      console.error('获取积分失败:', e)
    }
  }

  // 本地临时加积分（打卡成功后云函数已更新数据库，这里只是前端即时反馈）
  function addPoints(amount, source = '打卡') {
    current.value += amount
    total.value += amount
    set('current_points', current.value)
    set('total_points', total.value)
    history.value.unshift({ source, amount, timestamp: Date.now(), date: new Date().toISOString().slice(0, 10) })
    set('points_history', history.value.slice(0, 200))
  }

  // 本地临时扣积分（兑换后云函数已更新数据库）
  function deductPoints(amount) {
    if (current.value < amount) return false
    current.value -= amount
    set('current_points', current.value)
    return true
  }

  // 从云端同步积分（覆盖本地值）
  async function syncFromCloud(memberId) {
    await fetchPoints(memberId)
  }

  // 退出登录时清空积分状态，避免展示上一位用户数据
  function reset() {
    current.value = 0
    total.value = 0
    history.value = []
    set('current_points', 0)
    set('total_points', 0)
    set('points_history', [])
  }

  return { current, total, history, fetchPoints, addPoints, deductPoints, syncFromCloud, reset }
})
