import React from 'react';
import { getDashboardData } from '@/app/actions';
import HabitSettingsClient from '@/components/HabitSettingsClient';

export default async function ProfilePage() {
  const { habits } = await getDashboardData();
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-blue-100">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">个人主页</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">管理你的习惯和偏好设置</p>
        </header>

        <section className="mb-10">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-slate-900">习惯自定义</h2>
          </div>
          
          <HabitSettingsClient initialHabits={habits} />
        </section>
      </main>
    </div>
  );
}
