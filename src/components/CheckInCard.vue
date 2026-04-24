<!-- 打卡卡片组件 -->
<template>
  <view class="checkin-card" :class="{ checked: isChecked }">
    <view class="card-left">
      <text class="category-icon">{{ categoryIcon }}</text>
      <view class="card-info">
        <text class="plan-name">{{ plan.title }}</text>
        <text class="plan-meta">{{ plan.frequency?.type === 'daily' ? '每天' : '每周' }} · +{{ plan.points_per_check }}⭐</text>
      </view>
    </view>
    <view class="card-right">
      <view class="checkin-btn" :class="{ done: isChecked }" @click="handleClick">
        <text v-if="isChecked">✓</text>
        <text v-else>打卡</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  plan: { type: Object, required: true },
  isToday: { type: Boolean, default: true },
  isChecked: { type: Boolean, default: false },
})

const emit = defineEmits(['checkin', 'unclick'])

const categoryIcon = computed(() => {
  const icons = { reading: '📚', study: '📝', exercise: '🏃', life: '🏠', custom: '🎯' }
  return icons[props.plan.category] || '🎯'
})

function handleClick() {
  if (props.isChecked) {
    emit('unclick', props.plan)
  } else {
    emit('checkin', props.plan)
  }
}
</script>

<style scoped>
.checkin-card {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-radius: 16px; padding: 16px 20px;
  margin: 8px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.checkin-card.checked { background: #f0faf0; }
.card-left { display: flex; align-items: center; gap: 12px; }
.category-icon { font-size: 28px; }
.plan-name { font-size: 16px; font-weight: bold; color: #333; display: block; }
.plan-meta { font-size: 13px; color: #999; }
.checkin-btn {
  width: 72px; height: 72px; border-radius: 36px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: #fff; font-size: 16px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(255,107,107,0.3);
}
.checkin-btn:active { transform: scale(0.9); }
.checkin-btn.done { background: #52C41A; box-shadow: 0 4px 12px rgba(82,196,26,0.3); }
.checkin-btn.done text { font-size: 28px; }
</style>
