'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/app/actions';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await register(formData);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">创建账号 ✨</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">用户名 / 账号 (唯一)</label>
            <input name="username" type="text" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" placeholder="例如：kexi123" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">昵称</label>
            <input name="name" type="text" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" placeholder="输入展示的昵称" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">密码</label>
            <input name="password" type="password" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" placeholder="••••••••" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 mt-4">
            {loading ? '注册中...' : '注册账号'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          已有账号？ <Link href="/login" className="text-blue-600 font-bold hover:underline">去登录</Link>
        </p>
      </div>
    </div>
  );
}
