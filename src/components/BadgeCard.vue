<!-- 勋章卡片组件 -->
<template>
  <view class="badge-card" :class="{ unlocked, locked: !unlocked }">
    <view class="badge-icon">{{ badge.icon || '🔒' }}</view>
    <text class="badge-title">{{ badge.title }}</text>
    <text class="badge-date" v-if="unlocked">{{ formatDate(badge.unlocked_at) }}</text>
    <text class="badge-desc" v-else>{{ badge.desc || '继续努力' }}</text>
  </view>
</template>

<script setup>
defineProps({
  badge: { type: Object, required: true },
  unlocked: { type: Boolean, default: false },
})

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.badge-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 8px; border-radius: 16px; margin: 6px;
}
.badge-card.unlocked { background: linear-gradient(135deg, #FFF5E6, #FFE8D6); }
.badge-card.locked { background: #f5f5f5; }
.badge-icon { font-size: 40px; margin-bottom: 8px; }
.badge-card.locked .badge-icon { filter: grayscale(1); opacity: 0.4; }
.badge-title { font-size: 13px; font-weight: bold; color: #333; }
.badge-card.locked .badge-title { color: #bbb; }
.badge-date, .badge-desc { font-size: 11px; color: #999; margin-top: 4px; }
</style>
