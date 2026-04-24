<!-- 设置页 -->
<template>
  <view class="page">
    <view class="profile-card">
      <image
        v-if="userStore.avatarUrl"
        :src="userStore.avatarUrl"
        class="avatar-img"
        mode="aspectFill"
      />
      <text v-else class="avatar">{{ userStore.role === 'parent' ? '👨‍👩‍👧' : '🧒' }}</text>
      <text class="nickname">{{ userStore.nickname || '未登录' }}</text>
      <text class="role-tag">{{ userStore.role === 'parent' ? '家长' : '孩子' }}</text>
      <view class="points-info">
        <text class="points-text">⭐ {{ pointsStore.current }} 积分</text>
      </view>
    </view>

    <!-- 同步状态 -->
    <view class="sync-bar" v-if="offlineStore.pendingCount > 0" @click="doSync">
      <text>📶 {{ offlineStore.pendingCount }}条记录待同步</text>
      <text class="sync-btn">{{ offlineStore.syncing ? '同步中...' : '立即同步' }}</text>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="goPlanList">
        <text>📋 计划管理</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goRewardShop">
        <text>🎁 奖励商店</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goRecords">
        <text>📋 兑换记录</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" @click="goReport">
        <text>📊 本周周报</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" v-if="userStore.isParent" @click="goGuide">
        <text>📖 家长指南</text>
        <text class="arrow">›</text>
      </view>
      <view class="menu-item" v-if="userStore.isParent" @click="goManage">
        <text>⚙️ 奖励管理</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 切换角色 -->
    <view class="switch-area" v-if="userStore.isLoggedIn">
      <!-- 当前是家长 → 切回孩子 -->
      <view class="btn-outline" v-if="userStore.isParent" @click="goChildMode">
        <text>切换为孩子模式</text>
      </view>
      <!-- 当前是孩子 → 切到家长（需要密码） -->
      <view class="btn-outline" v-else @click="goParentMode">
        <text>切换为家长模式</text>
      </view>
    </view>

    <!-- 家长设置密码 -->
    <view class="menu-list" v-if="userStore.isParent" style="margin-top: 8px;">
      <view class="menu-item" @click="showPasswordModal = true">
        <text>🔑 {{ userStore.hasParentPassword ? '修改家长密码' : '设置家长密码' }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="btn-logout" @click="handleLogout">
      <text>退出登录</text>
    </view>

    <!-- 切换家长模式 - 密码验证弹窗 -->
    <view class="modal-mask" v-if="showPasswordInput" @click="showPasswordInput = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">🔒 家长验证</text>
        <text class="modal-desc">请输入家长密码</text>
        <input
          type="number"
          password
          v-model="passwordValue"
          placeholder="请输入密码"
          class="password-input"
          :focus="showPasswordInput"
          maxlength="6"
        />
        <view class="modal-btn-row">
          <view class="modal-btn half cancel" @click="showPasswordInput = false">
            <text>取消</text>
          </view>
          <view class="modal-btn half confirm" @click="confirmParentLogin">
            <text>确认</text>
          </view>
        </view>
        <text class="error-text" v-if="passwordError">{{ passwordError }}</text>
      </view>
    </view>

    <!-- 设置/修改密码弹窗 -->
    <view class="modal-mask" v-if="showPasswordModal" @click="showPasswordModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">{{ userStore.hasParentPassword ? '修改密码' : '设置家长密码' }}</text>
        <text class="modal-desc">请设置4-6位数字密码</text>
        <input
          v-if="userStore.hasParentPassword"
          type="number"
          password
          v-model="oldPassword"
          placeholder="输入旧密码"
          class="password-input"
          maxlength="6"
        />
        <input
          type="number"
          password
          v-model="newPassword"
          placeholder="输入新密码"
          class="password-input"
          maxlength="6"
        />
        <input
          type="number"
          password
          v-model="confirmPassword"
          placeholder="再次确认新密码"
          class="password-input"
          maxlength="6"
        />
        <view class="modal-btn-row">
          <view class="modal-btn half cancel" @click="showPasswordModal = false">
            <text>取消</text>
          </view>
          <view class="modal-btn half confirm" @click="savePassword">
            <text>保存</text>
          </view>
        </view>
        <text class="error-text" v-if="pwdError">{{ pwdError }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user.js'
import { usePointsStore } from '../../stores/points.js'
import { useOfflineStore } from '../../stores/offline.js'

const userStore = useUserStore()
const pointsStore = usePointsStore()
const offlineStore = useOfflineStore()

const showPasswordInput = ref(false)
const passwordValue = ref('')
const passwordError = ref('')

const showPasswordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwdError = ref('')

onShow(() => {
  offlineStore.refreshCount()
})

async function doSync() {
  uni.showLoading({ title: '同步中...' })
  await offlineStore.sync()
  uni.hideLoading()
  uni.showToast({ title: '同步完成' })
}

function goChildMode() {
  userStore.switchToChild()
  uni.showToast({ title: '已切换为孩子模式', icon: 'none' })
}

function goParentMode() {
  passwordValue.value = ''
  passwordError.value = ''
  if (!userStore.hasParentPassword) {
    // 首次使用，引导设置密码
    uni.showModal({
      title: '设置家长密码',
      content: '首次进入家长模式需要设置密码（4-6位数字）',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          showPasswordModal.value = true
        }
      }
    })
  } else {
    showPasswordInput.value = true
  }
}

function confirmParentLogin() {
  if (!passwordValue.value) {
    passwordError.value = '请输入密码'
    return
  }
  const result = userStore.switchToParent(passwordValue.value)
  if (result === 'ok') {
    showPasswordInput.value = false
    uni.showToast({ title: '已切换为家长模式' })
  } else if (result === 'wrong') {
    passwordError.value = '密码错误'
    passwordValue.value = ''
  }
}

function savePassword() {
  pwdError.value = ''
  const isFirstSet = !userStore.hasParentPassword

  if (!isFirstSet) {
    // 修改密码
    if (!oldPassword.value) { pwdError.value = '请输入旧密码'; return }
    if (!userStore.verifyParentPassword(oldPassword.value)) { pwdError.value = '旧密码错误'; return }
  }
  if (!newPassword.value || String(newPassword.value).length < 4) { pwdError.value = '密码至少4位'; return }
  if (String(newPassword.value) !== String(confirmPassword.value)) { pwdError.value = '两次密码不一致'; return }
  if (!/^\d+$/.test(String(newPassword.value))) { pwdError.value = '密码只能为数字'; return }

  userStore.setParentPassword(String(newPassword.value))
  showPasswordModal.value = false
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''

  if (isFirstSet) {
    // 首次设置密码后自动切换到家长模式
    userStore.switchToChild()  // 先确保role有值
    userStore.switchRole('parent')
    uni.showToast({ title: '密码设置成功，已进入家长模式' })
  } else {
    uni.showToast({ title: '密码已修改' })
  }
}

function goRewardShop() { uni.navigateTo({ url: '/pages/reward/shop' }) }
function goRecords() { uni.navigateTo({ url: '/pages/reward/records' }) }
function goReport() { uni.navigateTo({ url: '/pages/report/weekly' }) }
function goGuide() { uni.navigateTo({ url: '/pages/guide/index' }) }
function goPlanList() { uni.navigateTo({ url: '/pages/plan/list' }) }
function goManage() { uni.navigateTo({ url: '/pages/reward/manage' }) }

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后数据仍会保留',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #FFF8F0; }
.profile-card {
  text-align: center; padding: 30px 0 20px;
  background: linear-gradient(135deg, #FFE8D6, #FFF0E6);
  border-radius: 0 0 30px 30px;
}
.avatar { font-size: 56px; display: block; }
.avatar-img { width: 80px; height: 80px; border-radius: 50%; display: block; margin: 0 auto; border: 3px solid rgba(255,255,255,0.6); }
.nickname { font-size: 20px; font-weight: bold; color: #333; display: block; margin-top: 8px; }
.role-tag {
  display: inline-block; background: #FF6B6B; color: #fff;
  padding: 2px 12px; border-radius: 10px; font-size: 12px; margin-top: 6px;
}
.points-info { margin-top: 10px; }
.points-text { font-size: 15px; color: #E67E22; font-weight: bold; }
.sync-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin: 12px 16px; padding: 12px 16px;
  background: #FFF7E6; border-radius: 12px; font-size: 14px; color: #E67E22;
}
.sync-btn { color: #FF6B6B; font-weight: bold; font-size: 13px; }
.menu-list { padding: 16px; }
.menu-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; background: #fff; border-radius: 12px; margin-bottom: 8px;
  font-size: 15px;
}
.arrow { color: #ccc; font-size: 18px; }
.switch-area { padding: 0 16px; margin-top: 8px; }
.btn-outline {
  text-align: center; padding: 14px; border-radius: 25px;
  border: 2px solid #FF6B6B; color: #FF6B6B; font-size: 15px;
}
.btn-logout {
  text-align: center; padding: 16px; color: #999; font-size: 14px; margin-top: 20px;
}

/* 弹窗 */
.modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 999;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  width: 75%; background: #fff; border-radius: 16px; padding: 28px 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.modal-title {
  font-size: 18px; font-weight: bold; text-align: center;
  display: block; margin-bottom: 6px;
}
.modal-desc {
  font-size: 13px; color: #999; text-align: center;
  display: block; margin-bottom: 16px;
}
.password-input {
  border: 2px solid #eee; border-radius: 12px; padding: 12px 16px;
  font-size: 22px; letter-spacing: 8px; text-align: center;
  margin-bottom: 12px; background: #FAFAFA;
}
.modal-btn-row { display: flex; gap: 10px; margin-top: 4px; }
.modal-btn.half { flex: 1; text-align: center; padding: 12px; border-radius: 12px; font-size: 15px; font-weight: bold; }
.modal-btn.half.confirm { background: #FF6B6B; color: #fff; }
.modal-btn.half.cancel { background: #f5f5f5; color: #999; }
.error-text { font-size: 12px; color: #FF4D4F; text-align: center; display: block; margin-top: 8px; }
</style>
