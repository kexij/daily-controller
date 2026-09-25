import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getDashboardData, toggleHabitCheckIn } from './actions';
import TaskListClient from '@/components/TaskListClient';
import AddFAB from '@/components/AddFAB';

export default async function Dashboard() {
  const { tasks, habits } = await getDashboardData();
  
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-blue-100">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">你好，Kexi 👋</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">今天是 {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
        </header>

        {/* Tasks Section */}
        <section className="mb-10">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">今日任务</h2>
              <Link href="/overdue" className="flex items-center text-xs text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full transition-colors font-bold">
                <AlertCircle className="w-3 h-3 mr-1" /> 查看逾期
              </Link>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {completedTasks} / {totalTasks} 已完成
            </span>
          </div>
          
          <TaskListClient tasks={tasks} />
          
        </section>

        {/* Habits Section */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-slate-900">习惯打卡</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {habits.map(habit => {
              const isCheckedToday = habit.logs.length > 0;
              
              return (
                <form action={async () => {
                  'use server';
                  await toggleHabitCheckIn(habit.id);
                }} key={habit.id}>
                  <button type="submit" className={`w-full ${isCheckedToday ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:shadow-md active:scale-95'} p-4 rounded-2xl shadow-sm border flex flex-col items-center justify-center transition-all group cursor-pointer`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 relative transition-all ${isCheckedToday ? 'bg-white shadow-sm scale-110' : 'bg-slate-50 group-hover:scale-105'}`}>
                      {habit.icon || '✨'}
                      {isCheckedToday && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-400 text-white rounded-full p-0.5 shadow-sm">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-bold mb-1 ${isCheckedToday ? 'text-emerald-800' : 'text-slate-700'}`}>{habit.title}</span>
                    
                    {isCheckedToday ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        🔥 {habit.streak}天
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-md">
                        今日未打卡
                      </span>
                    )}
                  </button>
                </form>
              );
            })}
          </div>
        </section>
      </main>

      {/* Floating Action Button for Adding Tasks/Habits */}
      <AddFAB />
    </div>
  );
}
