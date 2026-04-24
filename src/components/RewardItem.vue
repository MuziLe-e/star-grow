<!-- 奖励项组件 -->
<template>
  <view class="reward-item">
    <view class="reward-left">
      <text class="reward-icon">{{ reward.icon || '🎁' }}</text>
      <view class="reward-info">
        <text class="reward-title">{{ reward.title }}</text>
        <text class="reward-cost">{{ reward.points_cost }} ⭐</text>
      </view>
    </view>
    <view class="reward-right">
      <view class="exchange-btn" :class="{ disabled: !canAfford }" @click="handleExchange">
        <text v-if="canAfford">兑换</text>
        <text v-else>积分不足</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  reward: { type: Object, required: true },
  userPoints: { type: Number, default: 0 },
})

const emit = defineEmits(['exchange'])

const canAfford = computed(() => props.userPoints >= props.reward.points_cost)

function handleExchange() {
  if (canAfford.value) emit('exchange', props.reward)
}
</script>

<style scoped>
.reward-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-radius: 12px; padding: 14px 16px; margin: 6px 0;
}
.reward-left { display: flex; align-items: center; gap: 12px; }
.reward-icon { font-size: 32px; }
.reward-title { font-size: 15px; font-weight: bold; display: block; }
.reward-cost { font-size: 13px; color: #FF6B6B; }
.exchange-btn {
  padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: #fff;
}
.exchange-btn.disabled { background: #ddd; color: #999; }
.exchange-btn:active { transform: scale(0.95); }
</style>
