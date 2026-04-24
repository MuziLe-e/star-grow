// stores/plans.js — 计划状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
const get = (k) => uni.getStorageSync(k)
const set = (k, v) => uni.setStorageSync(k, v)
import { callFunction } from '../utils/api.js'
import { useUserStore } from './user.js'

export const usePlanStore = defineStore('plans', () => {
  const plans = ref(get('plans_cache') || [])
  const loading = ref(false)

  // 加载计划列表
  async function fetchPlans() {
    loading.value = true
    try {
      const res = await callFunction('getPlans', { family_id: useUserStore().familyId })
      if (res.data) {
        plans.value = res.data
        set('plans_cache', res.data)
      }
    } catch (e) {
      console.error('加载计划失败:', e)
      // 使用本地缓存
    }
    loading.value = false
    return plans.value
  }

  // 保存计划（新建或更新）
  async function savePlan(planData) {
    try {
      const res = await callFunction('savePlan', {
        ...planData,
        family_id: useUserStore().familyId,
      })
      if (res.data) {
        const idx = plans.value.findIndex(p => p._id === planData._id)
        if (idx >= 0) plans.value[idx] = res.data
        else plans.value.push(res.data)
        set('plans_cache', plans.value)
      }
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }

  // 归档计划
  async function archivePlan(planId) {
    try {
      await callFunction('deletePlan', { plan_id: planId, family_id: useUserStore().familyId })
      plans.value = plans.value.filter(p => p._id !== planId)
      set('plans_cache', plans.value)
      return true
    } catch (e) {
      return false
    }
  }

  // 创建默认计划模板
  function getDefaultPlans() {
    return [
      { title: '每天阅读20分钟', category: 'reading', frequency: { type: 'daily', count: 1 }, points_per_check: 10, reminder_time: '19:30' },
      { title: '完成作业', category: 'study', frequency: { type: 'daily', count: 1 }, points_per_check: 15, reminder_time: '17:00' },
      { title: '运动30分钟', category: 'exercise', frequency: { type: 'daily', count: 1 }, points_per_check: 10, reminder_time: '18:00' },
      { title: '整理房间', category: 'life', frequency: { type: 'weekly', count: 3 }, points_per_check: 20, reminder_time: '09:00' },
    ]
  }

  return { plans, loading, fetchPlans, savePlan, archivePlan, getDefaultPlans }
})
