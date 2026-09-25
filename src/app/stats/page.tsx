import React from 'react';
import { getStatsData } from '@/app/actions';
import { Flame, Target, BookOpen } from 'lucide-react';
import DailySummaryForm from '@/components/DailySummaryForm';
import StatsSidebar from '@/components/StatsSidebar';

export default async function StatsPage() {
  const { todayTasks, todayCompleted, habits, summary } = await getStatsData();
  const completionRate = todayTasks === 0 ? 0 : Math.round((todayCompleted / todayTasks) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <StatsSidebar />

        {/* Today's Rate */}
        <section className="mb-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">今日完成率</h2>
            <div className="text-4xl font-black text-slate-800">{completionRate}%</div>
            <p className="text-xs font-semibold text-slate-400 mt-2">完成了 {todayCompleted} / {todayTasks} 项任务</p>
          </div>
          
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle 
                cx="48" cy="48" r="40" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * completionRate) / 100} 
                className="text-blue-500 transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </section>

        {/* Daily Summary */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
            今日心得
          </h2>
          <DailySummaryForm initialContent={summary?.content || ''} />
        </section>

        {/* Habits Streaks */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Flame className="w-5 h-5 text-orange-500 mr-2" />
            习惯连胜榜
          </h2>
          
          {habits.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-100 border-dashed rounded-2xl">
              <span className="text-slate-400 text-sm font-medium">还没建立任何习惯哦 🌱</span>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map(habit => (
                <div key={habit.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl mr-4">
                    {habit.icon || '✨'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{habit.title}</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">当前坚持</p>
                  </div>
                  <div className="text-right flex items-baseline">
                    <div className="text-3xl font-black text-orange-500 mr-1">{habit.streak}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase">天</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
