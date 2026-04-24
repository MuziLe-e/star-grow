// 常量定义（内联到云函数目录）
const STREAK_BONUS = { 3: 5, 7: 15, 14: 30 }

const BADGE_DEFS = {
  first_checkin: { title: '初出茅庐', icon: '🌱', desc: '首次完成打卡' },
  streak_3: { title: '三连击', icon: '🔥', desc: '连续打卡3天' },
  streak_7: { title: '一周坚持', icon: '⚡', desc: '连续打卡7天' },
  streak_14: { title: '两周达人', icon: '💎', desc: '连续打卡14天' },
  streak_30: { title: '月度冠军', icon: '👑', desc: '连续打卡30天' },
  first_self: { title: '自主小达人', icon: '🦸', desc: '首次自主打卡' },
  all_category: { title: '全能之星', icon: '🌈', desc: '一周内所有分类都打卡' },
  mood_recorder: { title: '心情记录员', icon: '📝', desc: '连续5天写了感受' },
  self_week: { title: '自律之星', icon: '🌟', desc: '一周内全自主打卡' },
  reading_100: { title: '阅读百分钟', icon: '📖', desc: '阅读累计100分钟' },
}

async function isOpenIdInWhitelist(db, openId) {
  if (!openId) return false
  const res = await db.collection('whitelist').where({ openId }).limit(1).get()
  return res.data && res.data.length > 0
}

module.exports = { STREAK_BONUS, BADGE_DEFS, isOpenIdInWhitelist }
