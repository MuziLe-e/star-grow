<script setup>
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useOfflineStore } from './stores/offline.js'

onLaunch(() => {
  console.log('星星养成 App Launch')

  // 初始化微信云开发
  // #ifdef MP-WEIXIN
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力')
  } else {
    wx.cloud.init({
      env: 'your-env-id', // TODO: 替换为你的云开发环境ID
      traceUser: true,
    })
  }
  // #endif
})

onShow(() => {
  // 每次回到前台时尝试同步离线数据
  const offlineStore = useOfflineStore()
  if (offlineStore.pendingCount > 0) {
    offlineStore.sync()
  }
})
</script>

<style>
/* 全局样式 - 温暖卡通风格 */
page {
  background-color: #FFF8F0;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  color: #333333;
}

/* 通用大按钮 */
.btn-primary {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: #FFFFFF;
  border-radius: 25px;
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.btn-primary:active {
  transform: scale(0.96);
}

/* 卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px;
  margin: 12px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
</style>
