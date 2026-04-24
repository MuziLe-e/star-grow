<!-- 家长指南 -->
<template>
  <view class="page">
    <view class="hero"><text class="title">📖 家长指南</text><text class="subtitle">科学培养孩子内驱力</text></view>
    <view v-for="(week, i) in guides" :key="i" class="guide-card">
      <view class="week-tag">{{ week.phase }}</view>
      <text class="guide-title">{{ week.title }}</text>
      <view v-for="(tip, j) in week.tips" :key="j" class="tip-item"><text>{{ tip }}</text></view>
    </view>
  </view>
</template>
<script setup>
const guides = [
  { phase: '第1-2周', title: '建立微习惯', tips: ['把学习任务拆成10分钟小目标','"就做5分钟，不想做了可以停"','完成即时小正反馈','用打卡积分建立成就感'] },
  { phase: '第3-4周', title: '给掌控感 + 少催多问', tips: ['让孩子参与制定计划','"你打算什么时候开始？"替代"快点写"','让孩子自己决定顺序','接受偶尔倒退，不焦虑'] },
  { phase: '第5-6周', title: '同伴效应 + 自然后果', tips: ['找学习伙伴一起打卡','完全放手让孩子自主开始','让自然后果发挥作用','适当提高挑战难度'] },
  { phase: '第7-8周', title: '回顾调整，固化习惯', tips: ['一起回顾进步和收获','庆祝坚持下来的成果','固化已成型的习惯','为下阶段设定新目标'] },
]
</script>
<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.hero { text-align: center; padding: 30px 0 20px; background: linear-gradient(135deg, #667EEA, #764BA2); border-radius: 0 0 30px 30px; }
.title { color: #fff; font-size: 22px; font-weight: bold; }
.subtitle { color: rgba(255,255,255,0.8); font-size: 14px; }
.guide-card { margin: 16px; background: #fff; border-radius: 16px; padding: 16px; }
.week-tag { display: inline-block; background: #667EEA; color: #fff; padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.guide-title { font-size: 17px; font-weight: bold; margin: 8px 0 12px; display: block; }
.tip-item { padding: 6px 0; font-size: 14px; color: #555; border-bottom: 1px solid #f5f5f5; }
</style>
