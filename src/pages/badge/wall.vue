<!-- 勋章墙 -->
<template>
  <view class="page">
    <view v-if="!userStore.isLoggedIn" class="guest-box">
      <text class="guest-title">当前为游客模式</text>
      <text class="guest-desc">登录后才可以查看勋章墙</text>
      <view class="guest-btn" @click="goLogin"><text>去登录</text></view>
    </view>

    <view v-else>
      <view class="header">
        <text class="title">🏆 我的勋章</text>
        <text class="count">{{ unlockedCount }}/{{ allBadges.length }}</text>
      </view>

      <!-- 进度 -->
      <view class="progress-section">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">收集进度 {{ progressPercent }}%</text>
      </view>

      <view class="badge-grid">
        <BadgeCard
          v-for="badge in allBadges"
          :key="badge.badge_type"
          :badge="badge"
          :unlocked="isUnlocked(badge.badge_type)"
        />
      </view>

      <view class="tip" v-if="unlockedCount < allBadges.length">
        <text>坚持打卡，解锁更多勋章！💪</text>
      </view>
      <view class="tip complete" v-else>
        <text>🎉 太厉害了！你已经收集了所有勋章！</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user.js'
import { callFunction } from '../../utils/api.js'
import { BADGE_DEFS } from '../../utils/badge-engine.js'
import BadgeCard from '../../components/BadgeCard.vue'

const userStore = useUserStore()
const myBadges = ref([])

const allBadges = computed(() => Object.entries(BADGE_DEFS).map(([type, def]) => ({
  badge_type: type, ...def,
})))

const unlockedTypes = computed(() => myBadges.value.map(b => b.badge_type))
const unlockedCount = computed(() => unlockedTypes.value.length)
const progressPercent = computed(() => allBadges.value.length ? Math.round(unlockedCount.value / allBadges.value.length * 100) : 0)

function isUnlocked(type) {
  return unlockedTypes.value.includes(type)
}

onShow(async () => {
  if (!userStore.isLoggedIn) {
    myBadges.value = []
    return
  }
  try {
    const res = await callFunction('getBadges', { child_id: userStore.memberId })
    if (res.data) myBadges.value = res.data
  } catch (e) {
    console.error('加载勋章失败:', e)
  }
})

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
.header { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
.title { font-size: 18px; font-weight: bold; }
.count { font-size: 14px; color: #999; }
.progress-section { padding: 0 16px 16px; }
.progress-bar { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #FFD93D, #FF6B6B); border-radius: 3px; transition: width 0.5s; }
.progress-text { font-size: 12px; color: #999; margin-top: 4px; display: block; text-align: center; }
.badge-grid { display: flex; flex-wrap: wrap; padding: 0 12px; }
.badge-grid > view { width: 50%; box-sizing: border-box; }
.tip { text-align: center; padding: 20px; color: #ccc; font-size: 13px; }
.tip.complete { color: #FF6B6B; font-weight: bold; font-size: 15px; }
</style>
