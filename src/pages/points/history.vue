<!-- 积分明细 -->
<template>
  <view class="page">
    <view class="header"><text class="title">积分明细</text></view>

    <view v-if="!userStore.isLoggedIn" class="empty">
      <text>登录后可查看积分明细</text>
      <view class="login-btn" @click="goLogin"><text>去登录</text></view>
    </view>

    <view v-else v-for="(item, i) in pointsStore.history" :key="i" class="item">
      <view><text class="source">{{ item.source }}</text><text class="time">{{ fmt(item.timestamp) }}</text></view>
      <text :class="item.type === 'spend' ? 'amount-spend' : 'amount'">{{ item.amount > 0 ? '+' : '' }}{{ item.amount }} ⭐</text>
    </view>
    <view v-if="userStore.isLoggedIn && !pointsStore.history.length" class="empty">暂无记录</view>
  </view>
</template>
<script setup>
import { onShow } from '@dcloudio/uni-app'
import { usePointsStore } from '../../stores/points.js'
import { useUserStore } from '../../stores/user.js'
const pointsStore = usePointsStore()
const userStore = useUserStore()
onShow(async () => {
  if (!userStore.isLoggedIn) {
    pointsStore.reset()
    return
  }
  await pointsStore.fetchPoints(userStore.memberId)
})
function fmt(ts) { if (!ts) return ''; const d = new Date(ts); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
function goLogin() { uni.navigateTo({ url: '/pages/login/index' }) }
</script>
<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.header { padding: 16px; }
.title { font-size: 18px; font-weight: bold; }
.item { display: flex; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; }
.source { font-size: 15px; display: block; }
.time { font-size: 12px; color: #ccc; }
.amount { color: #FF6B6B; font-weight: bold; }
.amount-spend { color: #999; font-weight: bold; }
.empty { text-align: center; color: #ccc; padding: 40px; }
.login-btn {
  margin: 16px auto 0;
  display: inline-block;
  padding: 10px 22px;
  border-radius: 22px;
  background: #FF6B6B;
  color: #fff;
  font-size: 14px;
}
</style>
