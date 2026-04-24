<!-- 编辑计划 -->
<template>
  <view class="page">
    <PlanForm :plan="editPlan" @submit="handleSubmit" />
  </view>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { usePlanStore } from '../../stores/plans.js'
import PlanForm from '../../components/PlanForm.vue'

const planStore = usePlanStore()
const editPlan = ref(null)

onLoad((query) => {
  if (query?.id) {
    editPlan.value = planStore.plans.find(p => p._id === query.id) || null
  }
})

async function handleSubmit(form) {
  const res = await planStore.savePlan(editPlan.value ? { ...editPlan.value, ...form } : form)
  if (res.success) {
    uni.showToast({ title: '保存成功' })
    setTimeout(() => uni.navigateBack(), 1000)
  } else {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
</script>
<style scoped>
.page { min-height: 100vh; background: #FFF8F0; padding: 16px; }
</style>
