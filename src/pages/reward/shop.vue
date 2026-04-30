<!-- 奖励商店（孩子端） -->
<template>
  <view class="page">
    <view v-if="!userStore.isLoggedIn" class="guest-box">
      <text class="guest-title">当前为游客模式</text>
      <text class="guest-desc">登录后可查看奖励商店</text>
      <view class="guest-btn" @click="goLogin"><text>去登录</text></view>
    </view>

    <view v-if="userStore.isLoggedIn" class="shop-wrap">
    <view class="shop-header">
      <view class="my-points">
        <text class="points-label">我的积分</text>
        <view class="points-row">
          <text class="star">⭐</text>
          <text class="highlight">{{ pointsStore.current }}</text>
        </view>
      </view>
    </view>

    <!-- 分类切换 -->
    <view class="category-tabs">
      <view class="tab" :class="{ active: currentCat === 'all' }" @click="currentCat = 'all'">全部</view>
      <view class="tab" :class="{ active: currentCat === 'experience' }" @click="currentCat = 'experience'">体验</view>
      <view class="tab" :class="{ active: currentCat === 'material' }" @click="currentCat = 'material'">物质</view>
    </view>

    <view class="reward-list">
      <RewardItem
        v-for="reward in filteredRewards"
        :key="reward._id"
        :reward="reward"
        :user-points="pointsStore.current"
        @exchange="handleExchange"
      />
    </view>

    <view v-if="filteredRewards.length === 0" class="empty">
      <text>暂无奖励~</text>
    </view>

    <!-- 家长入口 -->
    <view v-if="userStore.isParent" class="manage-entry" @click="goManage">
      <text>⚙️ 管理奖励</text>
    </view>
    <view class="manage-entry" @click="goRecords">
      <text>📋 兑换记录</text>
    </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user.js'
import { usePointsStore } from '../../stores/points.js'
import { callFunction } from '../../utils/api.js'
import RewardItem from '../../components/RewardItem.vue'

const userStore = useUserStore()
const pointsStore = usePointsStore()

const rewards = ref([])
const currentCat = ref('all')

const filteredRewards = computed(() => {
  if (currentCat.value === 'all') return rewards.value
  return rewards.value.filter(r => r.category === currentCat.value)
})

async function loadRewards() {
  try {
    const res = await callFunction('getRewards', { family_id: userStore.familyId })
    if (res.data) rewards.value = res.data
  } catch (e) {
    console.error('加载奖励失败:', e)
  }
}

onShow(async () => {
  if (!userStore.isLoggedIn) {
    rewards.value = []
    pointsStore.reset()
    return
  }

  await pointsStore.fetchPoints(userStore.memberId)
  await loadRewards()
})

async function handleExchange(reward) {
  if (!reward || pointsStore.current < reward.points_cost) {
    return uni.showToast({ title: '积分不足', icon: 'none' })
  }

  uni.showModal({
    title: '确认兑换',
    content: `用 ${reward.points_cost} ⭐ 兑换「${reward.title}」？\n${reward.description || ''}`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await callFunction('exchangeReward', {
          reward_id: reward._id,
          child_id: userStore.memberId,
          family_id: userStore.familyId,
        })
        if (result.success) {
          // 云函数已扣减数据库积分，前端从云端同步最新值
          await pointsStore.syncFromCloud(userStore.memberId)
          uni.showToast({ title: '兑换成功，等家长确认~', icon: 'none' })
        } else {
          uni.showToast({ title: result.error || '兑换失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '兑换失败', icon: 'none' })
      }
    }
  })
}

function goManage() { uni.navigateTo({ url: '/pages/reward/manage' }) }
function goRecords() { uni.navigateTo({ url: '/pages/reward/records' }) }
function goLogin() { uni.navigateTo({ url: '/pages/login/index' }) }
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
.shop-header {
  padding: 20px 16px; background: linear-gradient(135deg, #FFE8D6, #FFF0E6);
  border-radius: 0 0 20px 20px;
}
.shop-wrap {}
.points-label { font-size: 13px; color: #999; display: block; }
.points-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.star { font-size: 24px; }
.highlight { font-size: 28px; font-weight: bold; color: #FF6B6B; }
.category-tabs {
  display: flex; padding: 12px 16px; gap: 10px; background: #fff;
}
.tab {
  padding: 6px 20px; border-radius: 16px; font-size: 14px;
  background: #f5f5f5; color: #666;
}
.tab.active { background: #FF6B6B; color: #fff; }
.reward-list { padding: 8px 16px; }
.empty { text-align: center; color: #ccc; padding: 40px; }
.manage-entry {
  text-align: center; padding: 14px; color: #999; font-size: 14px;
  border-top: 1px solid #f0f0f0;
}
</style>
