<!-- 计划列表 -->
<template>
  <view class="page">
    <view v-if="!userStore.isLoggedIn" class="guest-box">
      <text class="guest-title">当前为游客模式</text>
      <text class="guest-desc">登录后才可以查看和管理计划</text>
      <view class="guest-btn" @click="goLogin"><text>去登录</text></view>
    </view>

    <view v-else>
    <view class="header">
      <text class="title">我的计划</text>
      <view class="add-btn" @click="goAdd"><text>+ 新建</text></view>
    </view>
    <view v-if="activePlans.length === 0" class="empty">
      <text>还没有计划，点击上方新建</text>
    </view>
    <view
      v-for="plan in activePlans"
      :key="plan._id"
      class="plan-card"
      @click="goEdit(plan)"
      @longpress="showActions(plan)"
    >
      <text class="plan-icon">{{ catIcon(plan.category) }}</text>
      <view class="plan-info">
        <text class="plan-name">{{ plan.title }}</text>
        <text class="plan-meta">{{ plan.frequency?.type === 'daily' ? '每天' : '每周' }}{{ plan.frequency?.count > 1 ? plan.frequency.count + '次' : '' }} · +{{ plan.points_per_check }}⭐</text>
      </view>
      <text class="status" :class="plan.status">{{ plan.status === 'active' ? '进行中' : '已归档' }}</text>
    </view>

    <!-- 操作弹窗 -->
    <view class="modal-mask" v-if="showModal" @click="showModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">{{ selectedPlan?.title }}</text>
        <view class="modal-actions">
          <view class="modal-btn edit" @click="goEdit(selectedPlan)">
            <text>✏️ 编辑计划</text>
          </view>
          <view class="modal-btn delete" @click="deletePlan">
            <text>🗑️ 删除计划</text>
          </view>
          <view class="modal-btn cancel" @click="showModal = false">
            <text>取消</text>
          </view>
        </view>
      </view>
    </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { usePlanStore } from '../../stores/plans.js'
import { useUserStore } from '../../stores/user.js'

const planStore = usePlanStore()
const userStore = useUserStore()
const showModal = ref(false)
const selectedPlan = ref(null)
const activePlans = computed(() => planStore.plans.filter(p => p.status !== 'archived'))

const catIcon = (c) => ({ reading:'📚', study:'📝', exercise:'🏃', life:'🏠', custom:'🎯' })[c] || '🎯'

onShow(() => {
  if (!userStore.isLoggedIn) {
    planStore.reset()
    return
  }
  planStore.fetchPlans()
})

function showActions(plan) {
  selectedPlan.value = plan
  showModal.value = true
}

function goAdd() { uni.navigateTo({ url: '/pages/plan/edit' }) }

function goEdit(plan) {
  showModal.value = false
  if (plan) uni.navigateTo({ url: '/pages/plan/edit?id=' + plan._id })
}

async function deletePlan() {
  showModal.value = false
  if (!selectedPlan.value) return
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定删除「${selectedPlan.value.title}」吗？\n删除后该计划的打卡记录也会被清除，且不可恢复。`,
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '删除中...' })
      const result = await planStore.archivePlan(selectedPlan.value._id)
      uni.hideLoading()
      if (result) {
        uni.showToast({ title: '已删除' })
      } else {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
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
.header { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
.title { font-size: 18px; font-weight: bold; }
.add-btn { background: #FF6B6B; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 14px; }
.empty { text-align: center; color: #ccc; padding: 40px 0; }
.plan-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; margin: 6px 12px; background: #fff; border-radius: 12px;
}
.plan-icon { font-size: 28px; }
.plan-name { font-size: 15px; font-weight: bold; display: block; }
.plan-meta { font-size: 12px; color: #999; }
.status { font-size: 12px; color: #52C41A; margin-left: auto; }

/* 弹窗 */
.modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 999;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  width: 70%; background: #fff; border-radius: 16px; padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.modal-title {
  font-size: 17px; font-weight: bold; text-align: center;
  display: block; margin-bottom: 20px;
}
.modal-actions { display: flex; flex-direction: column; gap: 10px; }
.modal-btn {
  text-align: center; padding: 14px; border-radius: 12px; font-size: 15px;
}
.modal-btn.edit { background: #F0F7FF; color: #1890FF; }
.modal-btn.delete { background: #FFF0F0; color: #FF4D4F; }
.modal-btn.cancel { background: #f5f5f5; color: #999; margin-top: 4px; }
</style>
