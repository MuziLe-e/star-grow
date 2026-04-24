<!-- 奖励管理（家长端） -->
<template>
  <view class="page">
    <view class="header">
      <text class="title">奖励管理</text>
      <view class="add-btn" @click="showForm = !showForm">
        <text>{{ showForm ? '收起' : '+ 新奖励' }}</text>
      </view>
    </view>

    <!-- 新建表单 -->
    <view class="form-card" v-if="showForm">
      <view class="form-group">
        <text class="form-label">奖励名称</text>
        <view class="inp-wrap">
          <input v-model="form.title" placeholder="如：看一集动画片" />
        </view>
      </view>
      <view class="form-group">
        <text class="form-label">简单描述（选填）</text>
        <view class="inp-wrap">
          <input v-model="form.description" placeholder="奖励说明" />
        </view>
      </view>
      <view class="form-row">
        <view class="form-group flex1">
          <text class="form-label">所需积分</text>
          <view class="inp-wrap">
            <input v-model.number="form.points_cost" type="number" placeholder="30" />
          </view>
        </view>
        <view class="form-group" style="width:90px;flex-shrink:0">
          <text class="form-label">图标</text>
          <view class="inp-wrap" style="text-align:center">
            <input v-model="form.icon" placeholder="🎪" style="text-align:center" />
          </view>
        </view>
      </view>
      <view class="form-group">
        <text class="form-label">分类</text>
        <view class="cat-row">
          <view class="cat" :class="{ active: form.category === 'experience' }" @click="form.category = 'experience'">体验类</view>
          <view class="cat" :class="{ active: form.category === 'material' }" @click="form.category = 'material'">物质类</view>
        </view>
      </view>
      <view class="form-group">
        <text class="form-label">库存（-1为无限）</text>
        <view class="inp-wrap" style="width:140px">
          <input v-model.number="form.stock" type="number" placeholder="-1" />
        </view>
      </view>
      <view class="btn-row">
        <view class="btn-primary" @click="save"><text>{{ editingId ? '更新' : '保存' }}</text></view>
        <view class="btn-cancel" @click="resetForm"><text>取消</text></view>
      </view>
    </view>

    <!-- 待确认的兑换 -->
    <view v-if="pendingExchanges.length > 0" class="section">
      <text class="section-title">待确认兑换 ({{ pendingExchanges.length }})</text>
      <view v-for="ex in pendingExchanges" :key="ex._id" class="exchange-item">
        <view class="ex-left">
          <text class="ex-icon">{{ ex.reward_icon || '🎁' }}</text>
          <view>
            <text class="ex-title">{{ ex.reward_title }}</text>
            <text class="ex-cost">-{{ ex.points_spent }}⭐</text>
          </view>
        </view>
        <view class="ex-actions">
          <view class="ex-btn confirm" @click.stop="confirmExchange(ex, true)">确认</view>
          <view class="ex-btn reject" @click.stop="confirmExchange(ex, false)">拒绝</view>
        </view>
      </view>
    </view>

    <!-- 奖励列表 -->
    <view v-for="r in rewards" :key="r._id" class="reward-row" @click="editReward(r)">
      <text class="r-icon">{{ r.icon || '🎁' }}</text>
      <view class="r-info">
        <text class="r-title">{{ r.title }}</text>
        <text class="r-cost">{{ r.points_cost }}⭐ · {{ r.category === 'experience' ? '体验' : '物质' }} · {{ r.stock === -1 ? '无限' : '库存' + r.stock }}</text>
        <text class="r-desc" v-if="r.description">{{ r.description }}</text>
      </view>
      <view class="r-edit" @click.stop="editReward(r)"><text>✏️</text></view>
      <view class="r-delete" @click.stop="deleteReward(r)">
        <text>🗑️</text>
      </view>
    </view>

    <view v-if="rewards.length === 0" class="empty">
      <text>还没有奖励，点击上方添加</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callFunction } from '../../utils/api.js'
import { useUserStore } from '../../stores/user.js'
import { usePointsStore } from '../../stores/points.js'

const userStore = useUserStore()
const pointsStore = usePointsStore()
const rewards = ref([])
const pendingExchanges = ref([])
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ title: '', description: '', points_cost: 30, icon: '🎁', category: 'experience', stock: -1 })

onShow(async () => {
  await loadRewards()
  await loadPendingExchanges()
})

async function loadRewards() {
  const res = await callFunction('getRewards', { family_id: userStore.familyId })
  if (res.data) rewards.value = res.data
}

async function loadPendingExchanges() {
  const res = await callFunction('getExchanges', { status: 'pending', family_id: userStore.familyId })
  if (res.data) pendingExchanges.value = res.data
}

function editReward(r) {
  editingId.value = r._id
  form.value = { title: r.title, description: r.description || '', points_cost: r.points_cost, icon: r.icon || '🎁', category: r.category, stock: r.stock }
  showForm.value = true
}

async function save() {
  if (!form.value.title) return uni.showToast({ title: '请输入名称', icon: 'none' })
  if (!form.value.points_cost || form.value.points_cost <= 0) return uni.showToast({ title: '积分要大于0', icon: 'none' })

  try {
    const res = await callFunction('saveReward', {
      ...form.value,
      family_id: userStore.familyId,
      reward_id: editingId.value || undefined,
    })
    if (res.success) {
      if (editingId.value) {
        const idx = rewards.value.findIndex(r => r._id === editingId.value)
        if (idx !== -1) rewards.value[idx] = res.data
        uni.showToast({ title: '已更新' })
      } else {
        rewards.value.push(res.data)
        uni.showToast({ title: '已添加' })
      }
      resetForm()
    }
  } catch (e) {
    uni.showToast({ title: editingId.value ? '更新失败' : '添加失败', icon: 'none' })
  }
}

function resetForm() {
  showForm.value = false
  editingId.value = null
  form.value = { title: '', description: '', points_cost: 30, icon: '🎁', category: 'experience', stock: -1 }
}

function deleteReward(reward) {
  uni.showModal({
    title: '确认删除',
    content: `确定删除「${reward.title}」吗？`,
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (!res.confirm) return
      await callFunction('deleteReward', { reward_id: reward._id, family_id: userStore.familyId })
      rewards.value = rewards.value.filter(r => r._id !== reward._id)
      uni.showToast({ title: '已删除' })
    }
  })
}

async function confirmExchange(exchange, confirmed) {
  const action = confirmed ? '确认' : '拒绝'
  uni.showModal({
    title: `${action}兑换`,
    content: `确定${action}「${exchange.reward_title}」的兑换请求？${confirmed ? '' : '\n积分将退还给孩子。'}`,
    confirmColor: confirmed ? '#52C41A' : '#FF4D4F',
    confirmText: confirmed ? '确认' : '拒绝',
    success: async (modalRes) => {
      if (!modalRes.confirm) return

      try {
        const result = await callFunction('confirmExchange', {
          exchange_id: exchange._id,
          confirmed: confirmed,
        })
        if (result.success !== false) {
          uni.showToast({ title: `已${action}` })
          // 拒绝时云函数会退还积分，前端从云端同步
          if (!confirmed) {
            await pointsStore.syncFromCloud(userStore.memberId)
          }
          // 从待确认列表移除
          pendingExchanges.value = pendingExchanges.value.filter(e => e._id !== exchange._id)
        } else {
          uni.showToast({ title: result.error || '操作失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
.title { font-size: 18px; font-weight: bold; }
.add-btn { background: #FF6B6B; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 14px; }
.form-card { margin: 0 16px 16px; background: #fff; border-radius: 16px; padding: 16px; }
.form-group { margin-bottom: 14px; }
.form-label { font-size: 13px; color: #666; margin-bottom: 6px; display: block; }
.inp-wrap {
  border: 1px solid #eee; border-radius: 10px; padding: 10px 14px;
  font-size: 14px; background: #FAFAFA; box-sizing: border-box;
}
.inp-wrap input { font-size: 14px; width: 100%; }
.form-row { display: flex; gap: 12px; }
.flex1 { flex: 1; }
.cat-row { display: flex; gap: 10px; }
.cat { padding: 8px 20px; border-radius: 16px; font-size: 13px; background: #f5f5f5; }
.cat.active { background: #FF6B6B; color: #fff; }
.btn-row { display: flex; gap: 10px; margin-top: 6px; }
.btn-primary { flex: 1; text-align: center; padding: 10px; border-radius: 20px; background: #FF6B6B; color: #fff; font-size: 14px; }
.btn-cancel { flex: 1; text-align: center; padding: 10px; border-radius: 20px; background: #f5f5f5; color: #999; font-size: 14px; }
.section { padding: 0 16px; margin-bottom: 8px; }
.section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; display: block; }
.exchange-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #FFF7E6; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px;
}
.ex-left { display: flex; align-items: center; gap: 10px; flex: 1; }
.ex-icon { font-size: 24px; }
.ex-title { font-size: 14px; font-weight: bold; display: block; }
.ex-cost { font-size: 12px; color: #E67E22; }
.ex-actions { display: flex; gap: 8px; }
.ex-btn { padding: 6px 14px; border-radius: 14px; font-size: 12px; }
.ex-btn.confirm { background: #52C41A; color: #fff; }
.ex-btn.reject { background: #fff; color: #FF4D4F; border: 1px solid #FF4D4F; }
.reward-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin: 6px 12px; background: #fff; border-radius: 12px; }
.r-icon { font-size: 28px; }
.r-info { flex: 1; }
.r-title { font-size: 15px; font-weight: bold; display: block; }
.r-cost { font-size: 12px; color: #999; }
.r-desc { font-size: 12px; color: #bbb; margin-top: 2px; display: block; }
.r-edit { padding: 8px; font-size: 18px; }
.r-delete { padding: 8px; font-size: 18px; }
.empty { text-align: center; color: #ccc; padding: 40px; }
</style>
