<!-- 积分总览 -->
<template>
  <view class="page">
    <view v-if="!userStore.isLoggedIn" class="guest-box">
      <text class="guest-title">当前为游客模式</text>
      <text class="guest-desc">登录后可查看积分和明细</text>
      <view class="guest-btn" @click="goLogin"><text>去登录</text></view>
    </view>

    <view v-else class="points-hero">
      <text class="points-label">我的积分</text>
      <view class="points-big">
        <text class="star">⭐</text>
        <text class="num">{{ pointsStore.current }}</text>
      </view>
      <text class="points-sub">累计获得 {{ pointsStore.total }} ⭐</text>
    </view>

    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-num">{{ todayEarned }}</text>
        <text class="stat-label">今日获得</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ weekEarned }}</text>
        <text class="stat-label">本周获得</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ streakDays }}</text>
        <text class="stat-label">连续打卡</text>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">积分明细</text>
        <text class="more" @click="goHistory">查看全部 ›</text>
      </view>
      <view v-for="(item, i) in recentHistory" :key="i" class="history-item">
        <view class="history-left">
          <text class="history-source">{{ item.source }}</text>
          <text class="history-time">{{ formatTime(item.timestamp) }}</text>
        </view>
        <text :class="item.type === 'spend' ? 'history-amount-spend' : 'history-amount'">{{ item.amount > 0 ? '+' : '' }}{{ item.amount }} ⭐</text>
      </view>
      <view v-if="recentHistory.length === 0" class="empty">还没有积分记录哦~</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { usePointsStore } from '../../stores/points.js'
import { useCheckinStore } from '../../stores/checkins.js'
import { useUserStore } from '../../stores/user.js'

const pointsStore = usePointsStore()
const checkinStore = useCheckinStore()
const userStore = useUserStore()
const streakDays = ref(0)

const todayEarned = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return pointsStore.history.filter(h => h.date === today && h.type !== 'spend').reduce((s, h) => s + h.amount, 0)
})

const weekEarned = computed(() => {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
  return pointsStore.history.filter(h => (h.timestamp || 0) > weekAgo && h.type !== 'spend').reduce((s, h) => s + h.amount, 0)
})

const recentHistory = computed(() => pointsStore.history.slice(0, 10))

onShow(async () => {
  if (!userStore.isLoggedIn) {
    pointsStore.reset()
    streakDays.value = 0
    return
  }
  await pointsStore.fetchPoints(userStore.memberId)
  streakDays.value = await checkinStore.getStreakInfo(userStore.memberId)
})

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function goHistory() {
  uni.navigateTo({ url: '/pages/points/history' })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.guest-box {
  margin: 20px 16px;
  padding: 24px 16px;
  background: #fff;
  border-radius: 16px;
  text-align: center;
}
.guest-title { display: block; font-size: 18px; font-weight: bold; color: #333; }
.guest-desc { display: block; margin-top: 10px; color: #999; font-size: 14px; }
.guest-btn {
  margin-top: 16px;
  display: inline-block;
  padding: 10px 22px;
  border-radius: 22px;
  background: #FF6B6B;
  color: #fff;
  font-size: 14px;
}
.points-hero {
  text-align: center; padding: 40px 0 24px;
  background: linear-gradient(135deg, #FFE8D6, #FFF0E6); border-radius: 0 0 30px 30px;
}
.points-label { font-size: 15px; color: #999; }
.points-big { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 12px 0; }
.star { font-size: 40px; }
.num { font-size: 52px; font-weight: bold; color: #FF6B6B; }
.points-sub { font-size: 14px; color: #999; }
.stats-row { display: flex; padding: 16px; gap: 10px; margin-top: -15px; }
.stat-card {
  flex: 1; text-align: center; background: #fff; border-radius: 12px;
  padding: 16px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.stat-num { font-size: 24px; font-weight: bold; color: #FF6B6B; display: block; }
.stat-label { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.section { padding: 16px; }
.section-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.section-title { font-size: 17px; font-weight: bold; }
.more { font-size: 13px; color: #FF6B6B; }
.history-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid #f5f5f5;
}
.history-source { font-size: 15px; display: block; }
.history-time { font-size: 12px; color: #ccc; }
.history-amount { font-size: 15px; font-weight: bold; color: #FF6B6B; }
.history-amount-spend { font-size: 15px; font-weight: bold; color: #999; }
.empty { text-align: center; color: #ccc; padding: 30px 0; }
</style>
