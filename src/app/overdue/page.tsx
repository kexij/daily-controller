import React from 'react';
import { getOverdueTasks } from '@/app/actions';
import TaskListClient from '@/components/TaskListClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function OverduePage() {
  const tasks = await getOverdueTasks();

  // Group tasks by date
  const groupedTasks: Record<string, any[]> = {};
  tasks.forEach(task => {
    const dateStr = new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
    groupedTasks[dateStr].push(task);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      <main className="max-w-md mx-auto p-6 pt-12 sm:pt-16">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回看板
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-red-600">逾期任务</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">把落下的进度补回来 🚀</p>
        </header>

        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-100 border-dashed rounded-2xl">
            <span className="text-slate-400 text-sm font-medium">太棒了，没有任何逾期任务！ 🎉</span>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTasks).map(([dateLabel, dateTasks]) => (
              <section key={dateLabel}>
                <h2 className="text-sm font-bold text-slate-400 mb-3 ml-2 border-l-2 border-red-400 pl-2">{dateLabel} 之前</h2>
                <TaskListClient tasks={dateTasks} />
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
