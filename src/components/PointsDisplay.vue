<!-- 积分展示组件 -->
<!-- 大号数字+星星图标，支持简单动画 -->
<template>
  <view class="points-display">
    <text class="star-icon">⭐</text>
    <view class="points-content">
      <text class="points-number" :class="{ pop: animated }">{{ points }}</text>
      <text class="points-label">可用积分</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  points: { type: Number, default: 0 },
  animated: { type: Boolean, default: false },
})
</script>

<style scoped>
.points-display { display: flex; align-items: center; justify-content: center; gap: 10px; }
.star-icon { font-size: 40px; }
.points-number { font-size: 48px; font-weight: bold; color: #FF6B6B; }
.points-label { font-size: 14px; color: #999; display: block; text-align: center; }
.pop { animation: popIn 0.4s ease; }
@keyframes popIn {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
</style>
