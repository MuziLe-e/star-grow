<!-- 登录页：微信授权登录 + 角色选择 -->
<template>
  <view class="page">
    <view class="logo-area">
      <text class="logo">⭐</text>
      <text class="app-name">星星养成</text>
      <text class="app-desc">每天进步一点点</text>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <!-- 微信登录：获取头像+昵称+code -->
    <view class="form-area" v-if="step === 'auth'">
      <view class="user-preview">
        <!-- 微信推荐：button open-type=chooseAvatar 获取头像 -->
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image
            v-if="wxAvatarUrl"
            :src="wxAvatarUrl"
            class="user-avatar-img"
            mode="aspectFill"
          />
          <text v-else class="user-avatar-placeholder">👤</text>
          <text class="avatar-tip">点击获取头像</text>
        </button>

        <!-- 微信推荐：input type=nickname 获取昵称 -->
        <input
          type="nickname"
          v-model="nickname"
          class="input-nick"
          placeholder="设置你的昵称"
          @blur="onNickBlur"
        />
      </view>

      <view class="btn-enter" @click="onWechatLogin">
        <text>{{ loading ? '登录中...' : '微信一键登录' }}</text>
      </view>
      <text class="tip-text">使用微信账号快速登录</text>
    </view>

    <!-- 选择身份 -->
    <view class="form-area" v-else-if="step === 'role'">
      <view class="user-preview">
        <image
          v-if="wxAvatarUrl"
          :src="wxAvatarUrl"
          class="user-avatar-img"
          mode="aspectFill"
        />
        <text v-else class="user-avatar-placeholder">👤</text>
        <text class="nick-display">{{ nickname }}</text>
      </view>

      <view class="role-label">选择身份</view>
      <view class="role-select">
        <view class="role-card" :class="{ active: role === 'parent' }" @click="role = 'parent'">
          <text class="role-icon">👨‍👩‍👧</text>
          <text class="role-name">我是家长</text>
          <text class="role-desc">管理计划和奖励</text>
        </view>
        <view class="role-card" :class="{ active: role === 'child' }" @click="role = 'child'">
          <text class="role-icon">🧒</text>
          <text class="role-name">我是孩子</text>
          <text class="role-desc">打卡赚积分</text>
        </view>
      </view>

      <view class="btn-enter" @click="doLogin">
        <text>{{ loading ? '登录中...' : '进入' }}</text>
      </view>
    </view>
    <!-- #endif -->

    <!-- #ifndef MP-WEIXIN -->
    <!-- H5 等非微信端：保持原有昵称+角色登录 -->
    <view class="form-area">
      <input v-model="nickname" placeholder="输入你的昵称" class="input-nick" :focus="false" />

      <view class="role-label">选择身份</view>
      <view class="role-select">
        <view class="role-card" :class="{ active: role === 'parent' }" @click="role = 'parent'">
          <text class="role-icon">👨‍👩‍👧</text>
          <text class="role-name">我是家长</text>
          <text class="role-desc">管理计划和奖励</text>
        </view>
        <view class="role-card" :class="{ active: role === 'child' }" @click="role = 'child'">
          <text class="role-icon">🧒</text>
          <text class="role-name">我是孩子</text>
          <text class="role-desc">打卡赚积分</text>
        </view>
      </view>

      <view class="btn-enter" @click="doLogin">
        <text>{{ loading ? '登录中...' : '进入' }}</text>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../stores/user.js'
import { callFunction } from '../../utils/api.js'

const userStore = useUserStore()
const nickname = ref('')
const role = ref('child')
const loading = ref(false)

// #ifdef MP-WEIXIN
const step = ref('auth') // 'auth' | 'role'
const wxLoginCode = ref('')
const wxOpenId = ref('')
const wxAvatarUrl = ref('')
const wxNickName = ref('')

// 选择头像回调（button open-type="chooseAvatar"）
function onChooseAvatar(e) {
  const avatarUrl = e.detail?.avatarUrl
  if (avatarUrl) {
    wxAvatarUrl.value = avatarUrl
  }
}

// 昵称输入回调（input type="nickname"）
function onNickBlur(e) {
  const val = e.detail?.value
  if (val) {
    wxNickName.value = val
    nickname.value = val
  }
}

// 微信一键登录：获取 code + 进入角色选择
async function onWechatLogin() {
  if (!nickname.value.trim()) {
    return uni.showToast({ title: '请先设置昵称', icon: 'none' })
  }
  if (loading.value) return
  loading.value = true

  try {
    // 调用 uni.login 获取 code
    const loginRes = await uni.login({ provider: 'weixin' })
    if (!loginRes?.code) {
      throw new Error('获取登录code失败')
    }
    // 保存 code，doLogin 时传给云函数
    wxLoginCode.value = loginRes.code

    // 进入角色选择阶段
    step.value = 'role'
  } catch (e) {
    console.error('微信登录失败:', e)
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
// #endif

async function doLogin() {
  if (!nickname.value.trim()) {
    return uni.showToast({ title: '请输入昵称', icon: 'none' })
  }
  if (loading.value) return
  loading.value = true

  try {
    // #ifdef MP-WEIXIN
    // 微信端：先调云函数登录，由云端校验白名单并返回完整用户数据
    const cloudRes = await callFunction('login', {
      code: wxLoginCode.value,
      nickname: nickname.value.trim(),
      role: role.value,
      avatarUrl: wxAvatarUrl.value,
    })

    if (!cloudRes.success) {
      // 白名单拒绝
      if (cloudRes.error === 'whitelist_rejected') {
        uni.showModal({
          title: '无法登录',
          content: cloudRes.message || '该小程序暂未对你开放',
          showCancel: false,
        })
      } else {
        uni.showToast({ title: cloudRes.error || '登录失败', icon: 'none' })
      }
      return
    }

    // 用云端返回的用户数据更新 store
    const member = cloudRes.data
    
    await userStore.login({
      nick: member.nickname,
      selectedRole: member.role,
      openId: member.openId,
      avatarUrl: member.avatarUrl,
      familyId: member.family_id,
    })

    // 更新 memberId 为云端真实 ID
    userStore.memberId = member._id
    uni.setStorageSync('memberId', member._id)

    // 首次登录时创建默认计划（新用户 member 由云函数创建，无 plans 字段）
    if (member.isNewUser) {
      const { usePlanStore } = await import('../../stores/plans.js')
      const planStore = usePlanStore()
      const defaults = planStore.getDefaultPlans()
      for (const plan of defaults) {
        await planStore.savePlan(plan)
      }
    }
    // #endif

    // #ifndef MP-WEIXIN
    // H5 等非微信端：原有登录流程
    await userStore.login({
      nick: nickname.value.trim(),
      selectedRole: role.value,
    })

    await callFunction('login', {
      memberId: userStore.memberId,
      nickname: userStore.nickname,
      role: userStore.role,
    })
    // #endif

    uni.switchTab({ url: '/pages/index/index' })
  } catch (e) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFF8F0; display: flex; flex-direction: column; }
.logo-area { text-align: center; padding: 80px 0 40px; }
.logo { font-size: 80px; display: block; }
.app-name { font-size: 28px; font-weight: bold; color: #333; display: block; margin-top: 12px; }
.app-desc { font-size: 15px; color: #999; margin-top: 6px; }
.form-area { padding: 0 30px; }

/* 头像选择按钮 */
.avatar-btn {
  display: flex; flex-direction: column; align-items: center;
  background: transparent !important; border: none !important; padding: 0;
  margin: 0; line-height: normal; width: auto; height: auto;
}
.avatar-btn::after { border: none !important; }
.avatar-tip { font-size: 12px; color: #999; margin-top: 6px; }
.nick-display { font-size: 16px; color: #333; font-weight: bold; margin-top: 8px; }
.tip-text { display: block; text-align: center; color: #999; font-size: 13px; margin-top: 16px; }

/* 进入按钮 */
.btn-enter {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: #FFFFFF; border-radius: 25px; padding: 15px 40px;
  font-size: 18px; font-weight: bold; text-align: center;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}
.btn-enter:active { transform: scale(0.96); }

/* 用户信息预览 */
.user-preview {
  display: flex; flex-direction: column; align-items: center; margin-bottom: 24px;
}
.user-avatar-img {
  width: 80px; height: 80px; border-radius: 50%; margin-bottom: 12px;
  border: 3px solid #FFE0CC;
}
.user-avatar-placeholder { font-size: 80px; margin-bottom: 12px; }

.input-nick {
  border: 2px solid #FFE0CC; border-radius: 25px; padding: 14px 20px;
  font-size: 16px; background: #fff; margin-bottom: 24px; text-align: center;
  width: 200px;
}

.role-label { font-size: 15px; font-weight: bold; color: #555; margin-bottom: 12px; }
.role-select { display: flex; gap: 16px; margin-bottom: 30px; }
.role-card {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 20px; border-radius: 16px; background: #fff; border: 2px solid #eee;
  transition: all 0.3s;
}
.role-card.active { border-color: #FF6B6B; background: #FFF5F0; }
.role-icon { font-size: 36px; margin-bottom: 8px; }
.role-name { font-size: 15px; font-weight: bold; color: #333; }
.role-desc { font-size: 12px; color: #999; margin-top: 4px; }
</style>
