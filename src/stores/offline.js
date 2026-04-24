// stores/offline.js — 离线队列管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPendingCount, flushSyncQueue } from '../utils/sync.js'

export const useOfflineStore = defineStore('offline', () => {
  const pendingCount = ref(0)
  const syncing = ref(false)

  function refreshCount() {
    pendingCount.value = getPendingCount()
  }

  async function sync() {
    if (syncing.value || pendingCount.value === 0) return
    syncing.value = true
    try {
      const result = await flushSyncQueue()
      refreshCount()
      return result
    } catch (e) {
      console.error('同步失败:', e)
    } finally {
      syncing.value = false
    }
  }

  return { pendingCount, syncing, refreshCount, sync }
})
