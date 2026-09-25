"use client";
import React, { useState, useMemo } from 'react';
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
    const key = `${year}-${week}`;
    if (!historyMap[key]) historyMap[key] = { year, week, daily: [], tasks: [], summary: null };
    if (type === 'daily') historyMap[key].daily.push(item);
    if (type === 'task') historyMap[key].tasks.push(item);
  };

  dailySummaries.forEach((s: any) => processDateItem(s, 'date', 'daily'));
  completedTasks.forEach((t: any) => processDateItem(t, 'updatedAt', 'task'));
  
  weeklySummaries.forEach((s: any) => {
    const key = `${s.year}-${s.week}`;
    if (!historyMap[key]) historyMap[key] = { year: s.year, week: s.week, daily: [], tasks: [], summary: s };
    else historyMap[key].summary = s;
  });

  const sortedWeeks = Object.keys(historyMap).sort((a, b) => b.localeCompare(a));

  const futureTasksByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    futureTasks.forEach((task: any) => {
      const d = new Date(task.dueDate);
      const dateKey = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(task);
    });
    return Object.keys(map).sort().map(key => ({ date: key, tasks: map[key] }));
  }, [futureTasks]);

  return (
    <div>
      <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6">
        <button onClick={() => setTab('future')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'future' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>未来计划</button>
        <button onClick={() => setTab('history')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>历史轨迹</button>
      </div>

      {tab === 'future' && (
        <div className="space-y-6">
          {futureTasksByDate.length === 0 && <p className="text-center text-slate-400 py-10">暂无待办规划</p>}
          {futureTasksByDate.map((group) => (
            <div key={group.date} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-indigo-500 mr-2"/> {group.date}
              </h2>
              <TaskListClient tasks={group.tasks} />
            </div>
          ))}
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
                  <div className="p-5 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <WeeklySummaryClient initialContent={weekData.summary?.content || ''} year={weekData.year} week={weekData.week} />
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
