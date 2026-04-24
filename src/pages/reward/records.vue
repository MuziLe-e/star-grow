<!-- 兑换记录 -->
<template>
  <view class="page">
    <view class="header">
      <text class="title">兑换记录</text>
    </view>

    <!-- 家长确认区 -->
    <view v-if="userStore.isParent && pendingList.length > 0" class="pending-section">
      <text class="section-title">待确认</text>
      <view v-for="r in pendingList" :key="r._id" class="record pending">
        <view class="record-left">
          <text class="r-icon">{{ r.reward_icon || '🎁' }}</text>
          <view>
            <text class="r-title">{{ r.reward_title || '奖励' }}</text>
            <text class="r-time">{{ fmt(r.created_at) }} · -{{ r.points_spent }}⭐</text>
          </view>
        </view>
        <view class="r-actions">
          <view class="action-btn confirm" @click="handleConfirm(r, true)">通过</view>
          <view class="action-btn reject" @click="handleConfirm(r, false)">拒绝</view>
        </view>
      </view>
    </view>

    <!-- 已处理记录 -->
    <view class="done-section">
      <text class="section-title" v-if="doneList.length">历史记录</text>
      <view v-for="r in doneList" :key="r._id" class="record">
        <view class="record-left">
          <text class="r-icon">{{ r.reward_icon || '🎁' }}</text>
          <view>
            <text class="r-title">{{ r.reward_title || '奖励' }}</text>
            <text class="r-time">{{ fmt(r.created_at) }} · -{{ r.points_spent }}⭐</text>
          </view>
        </view>
        <text class="r-status" :class="r.status">
          {{ { confirmed: '已确认', cancelled: '已拒绝' }[r.status] || r.status }}
        </text>
      </view>
    </view>

    <view v-if="records.length === 0" class="empty">暂无兑换记录</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user.js'
import { usePointsStore } from '../../stores/points.js'
import { callFunction } from '../../utils/api.js'

const userStore = useUserStore()
const pointsStore = usePointsStore()
const records = ref([])

const pendingList = computed(() => records.value.filter(r => r.status === 'pending'))
const doneList = computed(() => records.value.filter(r => r.status !== 'pending'))

onShow(async () => {
  try {
    const res = await callFunction('getExchanges', { family_id: userStore.familyId })
    if (res.data) records.value = res.data
  } catch (e) {
    console.error('加载兑换记录失败:', e)
  }
})

function fmt(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

async function handleConfirm(record, confirmed) {
  await callFunction('confirmExchange', { exchange_id: record._id, confirmed })
  uni.showToast({ title: confirmed ? '已确认' : '已拒绝', icon: 'none' })
  // 拒绝时云函数会退还积分，前端从云端同步
  if (!confirmed) {
    await pointsStore.syncFromCloud(userStore.memberId)
  }
  // 刷新列表
  const res = await callFunction('getExchanges', { family_id: userStore.familyId })
  if (res.data) records.value = res.data
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.header { padding: 16px; }
.title { font-size: 18px; font-weight: bold; }
.pending-section { padding: 0 16px; margin-bottom: 16px; }
.section-title { font-size: 15px; font-weight: bold; color: #555; margin-bottom: 10px; display: block; }
.done-section { padding: 0 16px; }
.record {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; margin-bottom: 8px; background: #fff; border-radius: 12px;
}
.record.pending { background: #FFF7E6; }
.record-left { display: flex; align-items: center; gap: 10px; }
.r-icon { font-size: 28px; }
.r-title { font-size: 15px; font-weight: bold; display: block; }
.r-time { font-size: 12px; color: #999; }
.r-actions { display: flex; gap: 8px; }
.action-btn { padding: 6px 14px; border-radius: 14px; font-size: 12px; }
.action-btn.confirm { background: #52C41A; color: #fff; }
.action-btn.reject { background: #fff; color: #FF4D4F; border: 1px solid #FF4D4F; }
.r-status { font-size: 13px; padding: 3px 10px; border-radius: 10px; }
.r-status.confirmed { background: #F0FFF0; color: #52C41A; }
.r-status.cancelled { background: #FFF0F0; color: #FF4D4F; }
.empty { text-align: center; color: #ccc; padding: 40px; }
</style>
