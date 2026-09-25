'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2 } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  
  // 只有在首页和复盘页才显示底部导航栏，其他层级页面直接隐藏
  if (pathname !== '/' && pathname !== '/stats') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex justify-around p-3">
        <Link href="/" className={`flex flex-col items-center p-2 transition-all ${pathname === '/' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">看板</span>
        </Link>
        <Link href="/stats" className={`flex flex-col items-center p-2 transition-all ${pathname === '/stats' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
          <BarChart2 className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">复盘</span>
        </Link>
      </div>
    </div>
  )
}
