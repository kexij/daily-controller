const fs = require('fs');
const path = require('path');

try {
  // 1. BottomNav.tsx
  fs.writeFileSync('src/components/BottomNav.tsx', `'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2 } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto flex justify-around p-3">
        <Link href="/" className={\`flex flex-col items-center p-2 transition-all \${pathname === '/' ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}\`}>
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">看板</span>
        </Link>
        <Link href="/stats" className={\`flex flex-col items-center p-2 transition-all \${pathname.includes('/stats') || pathname.includes('/profile') || pathname.includes('/data-center') ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}\`}>
          <BarChart2 className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold">复盘</span>
        </Link>
      </div>
    </div>
  )
}
`);

  // 2. StatsSidebar.tsx
  fs.writeFileSync('src/components/StatsSidebar.tsx', `"use client"
import { useState } from 'react';
import { MoreHorizontal, X, Settings, Database, ChevronRight } from 'lucide-react';
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
              <Link href="/profile" className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors group" onClick={() => setIsOpen(false)}>
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
`);

  // 3. stats/page.tsx
  fs.writeFileSync('src/app/stats/page.tsx', `import React from 'react';
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
`);

  // 4. profile/page.tsx
  fs.writeFileSync('src/app/profile/page.tsx', `import React from 'react';
import { getDashboardData } from '@/app/actions';
import HabitSettingsClient from '@/components/HabitSettingsClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function ProfilePage() {
  const { habits } = await getDashboardData();
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 selection:bg-blue-100">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <header className="mb-8">
          <Link href="/stats" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回复盘
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">习惯设置</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">管理你需要坚持的习惯</p>
        </header>

        <section className="mb-10">
          <HabitSettingsClient initialHabits={habits} />
        </section>
      </main>
    </div>
  );
}
`);

  // 5. actions.ts (ensure getDataCenterData exists)
  let actions = fs.readFileSync('src/app/actions.ts', 'utf8');
  if (!actions.includes('getDataCenterData')) {
    actions += `
export async function getDataCenterData() {
  const user = await getUser();
  if (!user) return { futureTasks: [], weeklySummaries: [], dailySummaries: [], completedTasks: [] };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const futureTasks = await prisma.task.findMany({
    where: { userId: user.id, isCompleted: false, dueDate: { gte: todayStart } },
    orderBy: { dueDate: 'asc' }
  });
  const weeklySummaries = await prisma.weeklySummary.findMany({
    where: { userId: user.id },
    orderBy: [{ year: 'desc' }, { week: 'desc' }]
  });
  const dailySummaries = await prisma.dailySummary.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' }
  });
  const completedTasks = await prisma.task.findMany({
    where: { userId: user.id, isCompleted: true },
    orderBy: { updatedAt: 'desc' }
  });
  return { futureTasks, weeklySummaries, dailySummaries, completedTasks };
}
`;
    fs.writeFileSync('src/app/actions.ts', actions);
  }

  // 6. data-center/page.tsx
  fs.mkdirSync('src/app/data-center', { recursive: true });
  fs.writeFileSync('src/app/data-center/page.tsx', `import React from 'react';
import { getDataCenterData } from '@/app/actions';
import DataCenterClient from '@/components/DataCenterClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function DataCenterPage() {
  const data = await getDataCenterData();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <header className="mb-6">
          <Link href="/stats" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回复盘
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-indigo-600">数据中心</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">你的过去与未来 🌌</p>
        </header>
        <DataCenterClient data={data} />
      </main>
    </div>
  );
}
`);

  // 7. DataCenterClient.tsx
  fs.writeFileSync('src/components/DataCenterClient.tsx', `"use client";
import React, { useState } from 'react';
import WeeklySummaryClient from './WeeklySummaryClient';
import TaskListClient from './TaskListClient';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const getWeekNumber = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export default function DataCenterClient({ data }: { data: any }) {
  const [tab, setTab] = useState<'future' | 'history'>('future');
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const { futureTasks, weeklySummaries, dailySummaries, completedTasks } = data;

  const historyMap: Record<string, any> = {};
  
  const processDateItem = (item: any, dateField: string, type: string) => {
    const d = new Date(item[dateField]);
    const year = d.getFullYear();
    const week = getWeekNumber(d);
    const key = \`\${year}-\${week}\`;
    if (!historyMap[key]) historyMap[key] = { year, week, daily: [], tasks: [], summary: null };
    if (type === 'daily') historyMap[key].daily.push(item);
    if (type === 'task') historyMap[key].tasks.push(item);
  };

  dailySummaries.forEach((s: any) => processDateItem(s, 'date', 'daily'));
  completedTasks.forEach((t: any) => processDateItem(t, 'updatedAt', 'task'));
  
  weeklySummaries.forEach((s: any) => {
    const key = \`\${s.year}-\${s.week}\`;
    if (!historyMap[key]) historyMap[key] = { year: s.year, week: s.week, daily: [], tasks: [], summary: s };
    else historyMap[key].summary = s;
  });

  const sortedWeeks = Object.keys(historyMap).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
        <button onClick={() => setTab('future')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${tab === 'future' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}\`}>未来计划</button>
        <button onClick={() => setTab('history')} className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${tab === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}\`}>历史轨迹</button>
      </div>

      {tab === 'future' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center"><Calendar className="w-5 h-5 text-indigo-500 mr-2"/> 待办规划</h2>
          <TaskListClient tasks={futureTasks} />
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          {sortedWeeks.length === 0 && <p className="text-center text-slate-400 py-10">暂无历史记录</p>}
          {sortedWeeks.map(key => {
            const weekData = historyMap[key];
            const isExpanded = expandedWeek === key;
            return (
              <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedWeek(isExpanded ? null : key)} className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="text-left">
                    <h3 className="font-bold text-slate-800 text-lg">{weekData.year}年 第{weekData.week}周</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">完成了 {weekData.tasks.length} 个任务，{weekData.daily.length} 篇日记</p>
                  </div>
                  {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </button>
                
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-2">
                    <div>
                      <h4 className="font-bold text-slate-700 mb-3 text-sm border-l-2 border-indigo-400 pl-2">周记 / 复盘</h4>
                      <WeeklySummaryClient initialContent={weekData.summary?.content || ''} year={weekData.year} week={weekData.week} />
                    </div>
                    
                    {weekData.daily.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-3 text-sm border-l-2 border-blue-400 pl-2">每日心得</h4>
                        <div className="space-y-2">
                          {weekData.daily.map((d: any) => (
                            <div key={d.id} className="bg-slate-50 p-3 rounded-lg text-sm">
                              <span className="font-bold text-blue-600 block mb-1">{new Date(d.date).toLocaleDateString('zh-CN')}</span>
                              <span className="text-slate-600 leading-relaxed">{d.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {weekData.tasks.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-3 text-sm border-l-2 border-emerald-400 pl-2">已完成任务</h4>
                        <div className="space-y-2">
                          {weekData.tasks.map((t: any) => (
                            <div key={t.id} className="flex items-center text-sm bg-slate-50 p-3 rounded-lg">
                              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></span>
                              <span className="text-slate-700 line-through opacity-70">{t.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
`);
  console.log('Architecture patch applied');
} catch(e) { console.error(e) }
