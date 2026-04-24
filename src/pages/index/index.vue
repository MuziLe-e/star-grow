<!-- 首页：今日打卡 -->
<template>
  <view class="page">
    <!-- 顶部背景 -->
    <view class="header-bg">
      <view class="header-content">
        <view class="top-row">
          <view>
            <text class="greeting">{{ greetingText }}</text>
            <text class="date-text">{{ dateText }}</text>
          </view>
          <view class="streak-badge" v-if="streakDays > 0">
            <text>🔥 {{ streakDays }}天</text>
          </view>
        </view>
        <view class="points-row">
          <text class="points-icon">⭐</text>
          <text class="points-num">{{ pointsStore.current }}</text>
        </view>
      </view>
    </view>

    <!-- 今日任务 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">今日任务</text>
        <text class="section-sub">{{ checkedCount }}/{{ plans.length }} 已完成</text>
      </view>

      <!-- 打卡进度条 -->
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>

      <!-- 打卡列表 -->
      <view v-if="plans.length === 0" class="empty-tip">
        <text class="empty-icon">📝</text>
        <text class="empty-text">还没有计划，快去创建吧~</text>
        <view class="btn-primary small" @click="goPlan"><text>创建计划</text></view>
      </view>

      <!-- 全部完成 -->
      <view v-else-if="checkedCount === plans.length" class="all-done">
        <text class="done-icon">🎉</text>
        <text class="done-text">今日任务全部完成！太棒了！</text>
      </view>

      <CheckInCard
        v-for="plan in plans"
        :key="plan._id || plan.title"
        :plan="plan"
        :is-checked="checkinStore.isChecked(plan._id)"
        @checkin="handleCheckin"
        @unclick="handleUnclick"
      />
    </view>

    <!-- 离线同步提示 -->
    <view class="offline-tip" v-if="offlineStore.pendingCount > 0" @click="doSync">
      <text>📶 {{ offlineStore.pendingCount }}条记录待同步，点击同步</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user.js'
import { usePlanStore } from '../../stores/plans.js'
import { useCheckinStore } from '../../stores/checkins.js'
import { useOfflineStore } from '../../stores/offline.js'
import { usePointsStore } from '../../stores/points.js'
import CheckInCard from '../../components/CheckInCard.vue'

const userStore = useUserStore()
const planStore = usePlanStore()
const checkinStore = useCheckinStore()
const offlineStore = useOfflineStore()
const pointsStore = usePointsStore()

const streakDays = ref(0)

const plans = computed(() => planStore.plans.filter(p => p.status !== 'archived'))
const checkedCount = computed(() => plans.value.filter(p => checkinStore.isChecked(p._id)).length)
const progressPercent = computed(() => plans.value.length ? Math.round(checkedCount.value / plans.value.length * 100) : 0)

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '☀️ 早上好'
  if (h < 14) return '🌞 中午好'
  if (h < 18) return '🌤️ 下午好'
  return '🌙 晚上好'
})

const dateText = computed(() => {
  const d = new Date()
  const days = ['日','一','二','三','四','五','六']
  return `${d.getMonth()+1}月${d.getDate()}日 星期${days[d.getDay()]}`
})

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/index' })
    return
  }
  loadData()
})

async function loadData() {
  // 每次都从云端获取最新计划
  await planStore.fetchPlans()
  // 仅首次登录（没有任何计划记录）时自动创建默认计划
  // 不再每次 plans 为空就创建，否则删完又自动生成
  await checkinStore.fetchTodayCheckins(userStore.memberId)
  streakDays.value = await checkinStore.getStreakInfo(userStore.memberId)
  offlineStore.refreshCount()
  // 从云端同步积分
  await pointsStore.fetchPoints(userStore.memberId)
}

async function handleCheckin(plan) {
  if (checkinStore.isChecked(plan._id)) return
  const result = await checkinStore.doCheckin(plan)
  if (result.success) {
    uni.showToast({ title: result.message || (result.offline ? '已记录，联网后同步 ⏳' : `打卡成功！+${result.points_earned}⭐`), icon: 'none' })
    streakDays.value = await checkinStore.getStreakInfo(userStore.memberId)
  } else {
    uni.showToast({ title: result.error || '打卡失败', icon: 'none' })
  }
}

function handleUnclick(plan) {
  uni.showModal({
    title: '撤销打卡',
    content: `确定撤销「${plan.title}」的打卡吗？\n积分将退回。`,
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (!res.confirm) return
      const result = await checkinStore.cancelCheckin(plan._id)
      if (result.success) {
        uni.showToast({ title: `已撤销，退回 ${result.refunded}⭐`, icon: 'none' })
        streakDays.value = await checkinStore.getStreakInfo(userStore.memberId)
      } else {
        uni.showToast({ title: result.error || '撤销失败', icon: 'none' })
      }
    }
  })
}

async function doSync() {
  uni.showLoading({ title: '同步中...' })
  await offlineStore.sync()
  uni.hideLoading()
  uni.showToast({ title: '同步完成' })
  await loadData()
}

function goPlan() {
  uni.navigateTo({ url: '/pages/plan/edit' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.header-bg {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  padding: 50px 20px 30px; border-radius: 0 0 30px 30px;
}
.top-row { display: flex; justify-content: space-between; align-items: flex-start; }
.greeting { color: #fff; font-size: 24px; font-weight: bold; display: block; }
.date-text { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 4px; display: block; }
.streak-badge {
  background: rgba(255,255,255,0.2); border-radius: 20px;
  padding: 6px 14px; color: #fff; font-size: 14px; font-weight: bold;
}
.points-row { display: flex; align-items: center; gap: 6px; margin-top: 12px; }
.points-icon { font-size: 20px; }
.points-num { color: #fff; font-size: 22px; font-weight: bold; }
.section { padding: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { font-size: 17px; font-weight: bold; }
.section-sub { font-size: 13px; color: #999; }
.progress-bar { height: 8px; background: #f0f0f0; border-radius: 4px; margin-bottom: 16px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #FF6B6B, #FFD93D); border-radius: 4px; transition: width 0.5s; }
.empty-tip { text-align: center; padding: 40px 0; color: #999; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.empty-text { display: block; margin-bottom: 16px; }
.empty-tip .btn-primary { margin-top: 8px; }
.small { padding: 10px 24px; font-size: 14px; display: inline-block; }
.all-done { text-align: center; padding: 20px 0; }
.done-icon { font-size: 40px; display: block; }
.done-text { display: block; margin-top: 8px; color: #52C41A; font-weight: bold; font-size: 16px; }
.offline-tip {
  text-align: center; padding: 12px; color: #E67E22; font-size: 13px;
  background: #FFF7E6; margin: 0 16px 16px; border-radius: 12px;
}
</style>
