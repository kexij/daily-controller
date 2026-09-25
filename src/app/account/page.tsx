import React from 'react';
import { getUser } from '@/app/actions';
import AccountSettingsClient from '@/components/AccountSettingsClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function AccountPage() {
  const user = await getUser();
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-blue-100">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <header className="mb-8">
          <Link href="/stats" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回复盘
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">账号信息</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">管理你的个人账号资料</p>
        </header>

        <section className="mb-10">
          <AccountSettingsClient user={user} />
        </section>
      </main>
    </div>
  );
}
