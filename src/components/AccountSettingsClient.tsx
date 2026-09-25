'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/actions';

export default function AccountSettingsClient({ user }: { user: any }) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  if (!user) {
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center">
        <p className="text-slate-500 text-sm mb-4">登录后即可管理个人账号信息</p>
        <button onClick={() => router.push('/login')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-xl">去登录</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">账号</label>
        <div className="font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg">{user.username}</div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">昵称</label>
        <div className="font-medium text-slate-800 bg-slate-50 px-3 py-2 rounded-lg">{user.name}</div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <button onClick={handleLogout} className="w-full text-red-500 font-bold py-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
          退出登录
        </button>
      </div>
    </div>
  );
}
