// stores/checkins.js — 打卡状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { callFunction } from '../utils/api.js'
import { addToSyncQueue } from '../utils/sync.js'
import { useUserStore } from './user.js'
import { usePointsStore } from './points.js'

export const useCheckinStore = defineStore('checkins', () => {
  const todayCheckins = ref([])
  const weekCheckins = ref([])
  const checkedPlanIds = computed(() => todayCheckins.value.map(c => c.plan_id))

  async function fetchTodayCheckins(childId) {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const res = await callFunction('getCheckins', { 
        child_id: childId, 
        date: today,
        family_id: useUserStore().familyId  // 添加 family_id 用于云端权限校验
      })
      if (res.data) todayCheckins.value = res.data
    } catch (e) {
      // 使用本地缓存
      const local = uni.getStorageSync('local_checkins') || {}
      todayCheckins.value = local[today] || []
    }
  }

  async function doCheckin(plan, feeling = '', checkedBy = 'self') {
    const userStore = useUserStore()
    const pointsStore = usePointsStore()
    const today = new Date().toISOString().slice(0, 10)

    const checkinData = {
      plan_id: plan._id,
      child_id: userStore.memberId,
      date: today,
      feeling,
      checked_by: checkedBy,
      family_id: userStore.familyId,  // 添加 family_id 用于云端权限校验
    }

    try {
      const res = await callFunction('checkin', checkinData)
      if (res.success) {
        const data = res.data || {}
        const earned = data.points_earned || plan.points_per_check || 10
        todayCheckins.value.push({
          plan_id: plan._id,
          ...checkinData,
          points_earned: earned,
          bonus_points: data.bonus_points || 0,
          bonus_type: data.bonus_type || null,
        })
        // 云函数已更新数据库积分，前端从云端同步最新值
        await pointsStore.syncFromCloud(userStore.memberId)

        // 本地缓存
        const local = uni.getStorageSync('local_checkins') || {}
        local[today] = todayCheckins.value
        uni.setStorageSync('local_checkins', local)

        const newBadges = data.new_badges || []
        if (newBadges.length) {
          const badgeText = newBadges.map(b => b.icon + ' ' + b.title).join('\n')
          setTimeout(() => {
            uni.showModal({
              title: '🎉 新勋章解锁！',
              content: badgeText,
              showCancel: false,
            })
          }, 500)
        }

        let msg = `打卡成功！+${earned}⭐`
        if (data.bonus_points > 0) msg += `\n连续加成 +${data.bonus_points}⭐`

        return { success: true, points_earned: earned, new_badges: newBadges, message: msg }
      } else {
        return { success: false, error: res.error || '打卡失败' }
      }
    } catch (e) {
      // 离线打卡
      addToSyncQueue(checkinData)
      const earned = plan.points_per_check || 10
      todayCheckins.value.push({ plan_id: plan._id, ...checkinData, synced: false, points_earned: earned })
      const local = uni.getStorageSync('local_checkins') || {}
      if (!local[today]) local[today] = []
      local[today].push({ plan_id: plan._id, ...checkinData, synced: false, points_earned: earned })
      uni.setStorageSync('local_checkins', local)
      pointsStore.addPoints(earned, plan.title + '(待同步)')
      return { success: true, offline: true, points_earned: earned }
    }
  }

  function isChecked(planId) {
    return checkedPlanIds.value.includes(planId)
  }

  // 获取当前连续打卡天数
  async function getStreakInfo(childId) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      const res = await callFunction('getCheckins', { 
        child_id: childId, 
        week_start: weekAgo,
        family_id: useUserStore().familyId  // 添加 family_id 用于云端权限校验
      })
      if (res.data) {
        weekCheckins.value = res.data
        // 简单计算：有打卡的唯一日期数
        const dates = [...new Set(res.data.map(c => c.date))].sort()
        // 计算最长连续天数
        let maxStreak = 0, current = 0
        for (let i = dates.length - 1; i >= 0; i--) {
          if (i === dates.length - 1) {
            const today = new Date().toISOString().slice(0, 10)
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
            if (dates[i] !== today && dates[i] !== yesterday) break
            current = 1
          } else {
            const diff = (new Date(dates[i + 1]) - new Date(dates[i])) / 86400000
            if (diff === 1) current++
            else break
          }
          maxStreak = Math.max(maxStreak, current)
        }
        return maxStreak
      }
    } catch (e) {}
    return 0
  }

  // 取消打卡
  async function cancelCheckin(planId) {
    const userStore = useUserStore()
    const pointsStore = usePointsStore()
    const today = new Date().toISOString().slice(0, 10)

    try {
      const res = await callFunction('cancelCheckin', {
        plan_id: planId,
        child_id: userStore.memberId,
        date: today,
      })
      if (res.success) {
        // 从今日打卡列表移除
        todayCheckins.value = todayCheckins.value.filter(c => c.plan_id !== planId)
        // 更新本地缓存
        const local = uni.getStorageSync('local_checkins') || {}
        if (local[today]) {
          local[today] = local[today].filter(c => c.plan_id !== planId)
          uni.setStorageSync('local_checkins', local)
        }
        // 退还积分：从云端同步最新值
        if (res.data?.refunded) {
          await pointsStore.syncFromCloud(userStore.memberId)
        }
        return { success: true, refunded: res.data?.refunded || 0 }
      }
      return { success: false, error: res.error || '取消失败' }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }

  return { todayCheckins, weekCheckins, checkedPlanIds, fetchTodayCheckins, doCheckin, cancelCheckin, isChecked, getStreakInfo }
})
