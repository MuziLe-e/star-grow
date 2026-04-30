<!-- 本周周报 -->
<template>
  <view class="page">
    <view class="hero">
      <text class="hero-title">📊 本周周报</text>
      <text class="hero-date">{{ weekRange }}</text>
    </view>

    <view class="stats">
      <view class="stat">
        <text class="stat-num">{{ stats.completion_rate }}%</text>
        <text class="stat-label">完成率</text>
      </view>
      <view class="stat">
        <text class="stat-num">{{ stats.points_earned }}</text>
        <text class="stat-label">获得积分</text>
      </view>
      <view class="stat">
        <text class="stat-num">{{ stats.total_checks }}</text>
        <text class="stat-label">打卡次数</text>
      </view>
    </view>

    <!-- 自主率 -->
    <view class="self-rate-card" v-if="stats.self_check_rate !== undefined">
      <text class="rate-label">自主完成率</text>
      <view class="rate-bar">
        <view class="rate-fill" :style="{ width: stats.self_check_rate + '%' }"></view>
      </view>
      <text class="rate-num">{{ stats.self_check_rate }}%</text>
    </view>

    <!-- 本周感受 -->
    <view class="section">
      <text class="section-title">本周感受</text>
      <textarea
        v-model="reflection"
        placeholder="这周最棒的事是..."
        class="textarea"
        maxlength="200"
      />
      <view class="btn-primary" @click="saveReflection">
        <text>保存感受</text>
      </view>
    </view>

    <!-- 家长指南 -->
    <view class="tip-card" v-if="parentTip">
      <text class="tip-title">💡 本周家长指南</text>
      <text class="tip-content">{{ parentTip }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user.js'
import { callFunction } from '../../utils/api.js'

const userStore = useUserStore()
const isParent = computed(() => userStore.isParent)
const reflection = ref('')
const stats = ref({ completion_rate: 0, points_earned: 0, total_checks: 0 })
const parentTip = ref('')

const weekRange = computed(() => {
  const d = new Date(), day = d.getDay() || 7
  const mon = new Date(d); mon.setDate(d.getDate() - day + 1)
  return `${mon.getMonth()+1}/${mon.getDate()} - ${d.getMonth()+1}/${d.getDate()}`
})

onShow(async () => {
  if (!userStore.isLoggedIn) {
    stats.value = { completion_rate: 0, points_earned: 0, total_checks: 0 }
    parentTip.value = ''
    reflection.value = ''
    return
  }
  try {
    const res = await callFunction('getWeeklyReport', {
      child_id: userStore.memberId,
      family_id: userStore.familyId,
      week_start: getMonday(),
    })
    if (res.data) {
      stats.value = res.data.stats || {}
      parentTip.value = res.data.parent_tip || ''
    }
  } catch (e) {
    console.error('加载周报失败:', e)
  }
  // 加载保存的感受
  const saved = uni.getStorageSync('weekly_reflection_' + getMonday())
  if (saved) reflection.value = saved
})

function getMonday() {
  const d = new Date(), day = d.getDay() || 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - day + 1)
  return mon.toISOString().slice(0, 10)
}

function saveReflection() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/index' })
    }, 400)
    return
  }
  uni.setStorageSync('weekly_reflection_' + getMonday(), reflection.value)
  uni.showToast({ title: '已保存', icon: 'none' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.hero { text-align: center; padding: 30px 0 20px; background: linear-gradient(135deg, #4ECDC4, #44B09E); border-radius: 0 0 30px 30px; }
.hero-title { color: #fff; font-size: 20px; font-weight: bold; }
.hero-date { color: rgba(255,255,255,0.8); font-size: 13px; }
.stats { display: flex; padding: 16px; gap: 10px; margin-top: -15px; }
.stat { flex: 1; text-align: center; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.stat-num { font-size: 24px; font-weight: bold; color: #4ECDC4; display: block; }
.stat-label { font-size: 12px; color: #999; margin-top: 4px; }
.self-rate-card {
  margin: 0 16px 16px; padding: 14px 16px; background: #fff; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.rate-label { font-size: 14px; color: #555; margin-bottom: 8px; display: block; }
.rate-bar { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.rate-fill { height: 100%; background: linear-gradient(90deg, #4ECDC4, #2ECC71); border-radius: 4px; transition: width 0.5s; }
.rate-num { font-size: 13px; color: #4ECDC4; font-weight: bold; margin-top: 4px; display: block; text-align: right; }
.section { padding: 0 16px 16px; }
.section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; display: block; }
.textarea { width: 100%; border: 1px solid #eee; border-radius: 12px; padding: 12px; font-size: 14px; min-height: 80px; background: #fff; box-sizing: border-box; }
.btn-primary { margin-top: 10px; text-align: center; padding: 12px; border-radius: 25px; background: #4ECDC4; color: #fff; font-weight: bold; }
.tip-card { margin: 0 16px 16px; background: #FFF7E6; border-radius: 12px; padding: 16px; }
.tip-title { font-size: 15px; font-weight: bold; display: block; margin-bottom: 6px; }
.tip-content { font-size: 13px; color: #666; line-height: 1.6; }
</style>
