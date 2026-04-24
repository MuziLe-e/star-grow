// stores/user.js — 用户/家庭状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
const get = (k) => uni.getStorageSync(k)
const set = (k, v) => uni.setStorageSync(k, v)

export const useUserStore = defineStore('user', () => {
  const memberId = ref(get('memberId') || '')
  const familyId = ref(get('familyId') || '')
  const role = ref(get('role') || '')
  const nickname = ref(get('nickname') || '')
  const avatar = ref(get('avatar') || '')
  const openId = ref(get('openId') || '')
  const avatarUrl = ref(get('avatarUrl') || '')
  const currentPoints = ref(0)
  const totalPoints = ref(0)

  const isParent = computed(() => role.value === 'parent')
  const isLoggedIn = computed(() => !!memberId.value)
  const hasParentPassword = computed(() => !!get('parent_pwd'))

  // 登录/注册（支持微信登录和普通登录）
  async function login({ nick, selectedRole, openId: wxOpenId, avatarUrl: wxAvatarUrl, familyId: cloudFamilyId }) {
    nickname.value = nick
    role.value = selectedRole

    // 如果有 openId，用它生成稳定的 memberId
    if (wxOpenId) {
      openId.value = wxOpenId
      memberId.value = 'wx_' + wxOpenId.slice(-16)
    } else {
      memberId.value = 'member_' + Date.now()
    }

    // 头像优先使用微信头像
    if (wxAvatarUrl) {
      avatarUrl.value = wxAvatarUrl
      avatar.value = ''
    }

    // familyId 优先使用云端返回的值（多用户隔离），否则回退默认
    familyId.value = cloudFamilyId || 'family_default'

    // 持久化
    set('memberId', memberId.value)
    set('familyId', familyId.value)
    set('role', role.value)
    set('nickname', nickname.value)
    set('avatar', avatar.value)
    set('openId', openId.value)
    set('avatarUrl', avatarUrl.value)
    return true
  }

  // 设置家长密码
  function setParentPassword(password) {
    set('parent_pwd', password)
  }

  // 验证家长密码
  function verifyParentPassword(password) {
    return get('parent_pwd') === password
  }

  // 切换到家长模式（需要密码验证）
  // 返回 'ok' | 'need_set' | 'wrong'
  function switchToParent(password) {
    if (!hasParentPassword.value) {
      return 'need_set'
    }
    if (verifyParentPassword(password)) {
      role.value = 'parent'
      set('role', 'parent')
      return 'ok'
    }
    return 'wrong'
  }

  // 设置积分
  function setPoints(current, total) {
    currentPoints.value = current
    totalPoints.value = total
  }

  // 切换到孩子模式（不需要密码）
  function switchToChild() {
    role.value = 'child'
    set('role', 'child')
  }

  // 切换角色（兼容旧调用，不做密码校验）
  function switchRole(newRole) {
    role.value = newRole
    set('role', newRole)
  }

  // 退出登录
  function logout() {
    memberId.value = ''
    familyId.value = ''
    role.value = ''
    nickname.value = ''
    avatar.value = ''
    openId.value = ''
    avatarUrl.value = ''
    currentPoints.value = 0
    totalPoints.value = 0
    ;['memberId','familyId','role','nickname','avatar','openId','avatarUrl'].forEach(k => set(k, ''))
  }

  return {
    memberId, familyId, role, nickname, avatar, openId, avatarUrl,
    currentPoints, totalPoints,
    isParent, isLoggedIn, hasParentPassword,
    login, setParentPassword, verifyParentPassword, switchToParent, switchToChild,
    setPoints, switchRole, logout,
  }
})
