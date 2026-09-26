'use client'

import { useEffect } from 'react'

// 注册 Service Worker，让网站可以像 App 一样安装到桌面/主屏。
// 只在生产环境注册，避免开发时的热更新受干扰。
export default function PwaSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 注册失败不影响正常使用
    })
  }, [])

  return null
}
