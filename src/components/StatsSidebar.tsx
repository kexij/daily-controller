"use client"
import { useState } from 'react';
import { MoreHorizontal, X, Settings, Database, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

export default function StatsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="mb-8 flex justify-between items-center relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">执行复盘 📊</h1>
        <p className="text-slate-500 mt-1.5 text-sm font-medium">数据见证你的每一次坚持</p>
      </div>
      <button onClick={() => setIsOpen(true)} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-all">
        <MoreHorizontal className="w-5 h-5 text-slate-600" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-800">更多模块</h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 bg-slate-200/50 rounded-full text-slate-500 hover:text-slate-800"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <Link href="/account" className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors group" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3"><User className="w-5 h-5"/> <span className="font-bold text-sm">个人账号</span></div>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </Link>
              <Link href="/profile" className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 transition-colors group" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3"><Settings className="w-5 h-5"/> <span className="font-bold text-sm">习惯设置</span></div>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </Link>
              <Link href="/data-center" className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors group" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3"><Database className="w-5 h-5"/> <span className="font-bold text-sm">数据中心</span></div>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
