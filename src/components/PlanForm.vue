<!-- 计划表单组件 -->
<!-- 创建/编辑计划时使用 -->
<template>
  <view class="plan-form">
    <view class="form-item">
      <text class="form-label">计划名称</text>
      <input v-model="form.title" placeholder="例如：每天阅读" class="form-input" />
    </view>

    <view class="form-item">
      <text class="form-label">分类</text>
      <view class="category-grid">
        <view v-for="cat in categories" :key="cat.value"
          class="category-item" :class="{ active: form.category === cat.value }"
          @click="form.category = cat.value">
          <text>{{ cat.icon }}</text>
          <text class="cat-name">{{ cat.label }}</text>
        </view>
      </view>
    </view>

    <view class="form-item">
      <text class="form-label">频次</text>
      <view class="freq-row">
        <view class="freq-btn" :class="{ active: form.frequency.type === 'daily' }"
          @click="form.frequency.type = 'daily'">每天</view>
        <view class="freq-btn" :class="{ active: form.frequency.type === 'weekly' }"
          @click="form.frequency.type = 'weekly'">每周</view>
      </view>
      <input v-model.number="form.frequency.count" type="number" class="form-input small"
        placeholder="次数" style="margin-top:8px" />
    </view>

    <view class="form-item">
      <text class="form-label">每次积分</text>
      <input v-model.number="form.points_per_check" type="number" class="form-input" placeholder="10" />
    </view>

    <view class="form-item">
      <text class="form-label">提醒时间</text>
      <picker mode="time" :value="form.reminder_time" @change="onTimePick">
        <view class="form-input picker-box">
          <text class="picker-text">{{ form.reminder_time || '不提醒' }}</text>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
    </view>

    <view class="btn-primary" @click="handleSubmit">
      <text>{{ plan ? '保存修改' : '创建计划' }}</text>
    </view>

    <!-- 底部安全间距 -->
    <view style="height: 40px;"></view>
  </view>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  plan: { type: Object, default: null },
})

const emit = defineEmits(['submit'])

const categories = [
  { value: 'reading', label: '阅读', icon: '📚' },
  { value: 'study', label: '学习', icon: '📝' },
  { value: 'exercise', label: '运动', icon: '🏃' },
  { value: 'life', label: '生活', icon: '🏠' },
  { value: 'custom', label: '自定义', icon: '🎯' },
]

const form = reactive({
  title: '',
  category: 'reading',
  frequency: { type: 'daily', count: 1 },
  points_per_check: 10,
  reminder_time: '',
  reminder_text: '',
})

// 编辑模式回填
watch(() => props.plan, (val) => {
  if (val) Object.assign(form, JSON.parse(JSON.stringify(val)))
}, { immediate: true })

function onTimePick(e) { form.reminder_time = e.detail.value }

function handleSubmit() {
  if (!form.title) return uni.showToast({ title: '请输入计划名称', icon: 'none' })
  emit('submit', { ...form })
}
</script>

<style scoped>
.form-item { margin-bottom: 20px; }
.form-label { font-size: 15px; font-weight: bold; color: #555; margin-bottom: 8px; display: block; }
.form-input {
  border: 1px solid #eee; border-radius: 10px; padding: 12px 16px;
  font-size: 15px; background: #FAFAFA;
}
.form-input.small { width: 120px; }
.picker-box {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; box-sizing: border-box;
}
.picker-text { color: #333; font-size: 15px; }
.picker-arrow { color: #ccc; font-size: 12px; }
.category-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.category-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 14px; border-radius: 12px; background: #f5f5f5; font-size: 13px;
}
.category-item.active { background: #FFF0E6; border: 2px solid #FF6B6B; }
.category-item text:first-child { font-size: 24px; }
.cat-name { font-size: 12px; color: #666; }
.freq-row { display: flex; gap: 10px; }
.freq-btn {
  padding: 8px 24px; border-radius: 20px; background: #f5f5f5; font-size: 14px;
}
.freq-btn.active { background: #FF6B6B; color: #fff; }
.btn-primary {
  margin-top: 20px; padding: 14px; text-align: center; border-radius: 25px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: #fff;
  font-size: 17px; font-weight: bold;
}
</style>
