/**
 * 提醒调度工具
 * 根据计划设定的时间推送友好提醒
 */
import { callFunction } from './api.js'

// 提醒文案池，按分类
const REMINDER_TEXTS = {
  reading: ['📚 阅读时间到啦，今天想看什么故事呀？', '📖 休息一下，来看看书吧～'],
  study:   ['✏️ 今天的任务等你来挑战，加油！', '📝 动动脑筋，你比想象中更厉害！'],
  exercise:['⚽ 出去动一动吧，身体棒棒！', '🏃 运动时间到，充满能量！'],
  life:    ['🏠 试试今天自己整理房间吧～', '🌟 自己的事情自己做，你最棒！'],
  custom:  ['⭐ 该完成今天的小目标啦！', '💪 一步一个脚印，继续加油！'],
}

/**
 * 设置提醒（小程序端用订阅消息，App端用本地通知）
 */
export function setupReminders(plans) {
  plans.forEach(plan => {
    if (!plan.reminder_time || plan.status !== 'active') return

    const texts = REMINDER_TEXTS[plan.category] || REMINDER_TEXTS.custom
    const text = plan.reminder_text || texts[Math.floor(Math.random() * texts.length)]
    const [h, m] = plan.reminder_time.split(':').map(Number)

    // #ifdef APP-PLUS
    // App端：注册本地定时通知
    plus.push.createMessage(text, `plan_${plan._id}`, {
      cover: false,
      sound: 'system',
      when: getNextTrigger(h, m),
    })
    // #endif

    // #ifdef MP-WEIXIN
    // 小程序端：订阅消息由云函数定时触发器处理
    callFunction('setupReminder', { plan_id: plan._id, time: plan.reminder_time, text })
    // #endif
  })
}

/**
 * 取消所有提醒
 */
export function clearReminders() {
  // #ifdef APP-PLUS
  plus.push.clear()
  // #endif
}

function getNextTrigger(hour, minute) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime()
}
