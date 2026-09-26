'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions';
import { toast } from '@/components/Feedback';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await login(formData);
      if (res && res.error) {
        setError(res.error);
      } else {
        toast.success('登录成功');
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">欢迎回来 👋</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">用户名 / 账号</label>
            <input name="username" type="text" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" placeholder="输入你的账号" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">密码</label>
            <input name="password" type="password" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" placeholder="••••••••" />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 mt-4">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          还没有账号？ <Link href="/register" className="text-blue-600 font-bold hover:underline">立即注册</Link>
        </p>
      </div>
    </div>
  );
}
