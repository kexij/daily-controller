import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';



const getWeekNumber = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export default async function WeekDetailsPage({ params }: { params: Promise<{ year: string, week: string }> | { year: string, week: string } }) {
  // Handle both Next.js 14 and 15 params API
  const resolvedParams = await params;
  const targetYear = parseInt(resolvedParams.year);
  const targetWeek = parseInt(resolvedParams.week);

  const { getUser } = await import('@/app/actions');
  const user = await getUser();
  if (!user) return <div className="p-10 text-center">User not found</div>;

  const allDailies = await prisma.dailySummary.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' }
  });
  
  const allTasks = await prisma.task.findMany({
    where: { userId: user.id, isCompleted: true },
    orderBy: { updatedAt: 'desc' }
  });

  const weekDailies = allDailies.filter(d => {
    const dObj = new Date(d.date);
    return dObj.getFullYear() === targetYear && getWeekNumber(dObj) === targetWeek;
  });

  const weekTasks = allTasks.filter(t => {
    const dObj = new Date(t.updatedAt);
    return dObj.getFullYear() === targetYear && getWeekNumber(dObj) === targetWeek;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-indigo-100">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <header className="mb-8">
          <Link href="/data-center" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回数据中心
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{targetYear}年 第{targetWeek}周 详情</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">回顾这一周的点点滴滴</p>
        </header>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></span>
              每日心得
            </h2>
            {weekDailies.length === 0 ? (
              <p className="text-sm text-slate-400 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">这一周没有留下心得哦 🌱</p>
            ) : (
              <div className="space-y-3">
                {weekDailies.map(d => (
                  <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <span className="font-bold text-blue-600 block mb-2 text-sm">{new Date(d.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
                    <span className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words break-all">{d.content}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-1.5 h-5 bg-emerald-500 rounded-full mr-2"></span>
              已完成任务
            </h2>
            {weekTasks.length === 0 ? (
              <p className="text-sm text-slate-400 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">这一周没有完成任务 📝</p>
            ) : (
              <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                {weekTasks.map(t => (
                  <div key={t.id} className="flex items-start text-sm p-3 border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-colors rounded-xl m-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 mr-3 flex-shrink-0 shadow-sm shadow-emerald-200"></span>
                    <span className="text-slate-700 font-medium break-words break-all">{t.title}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}



