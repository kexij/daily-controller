'use client'

import React, { useState } from 'react';
import { ChevronLeft, Calendar, CheckCircle2, AlertCircle, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';
import { toggleTask, deleteTask } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { toast, confirmDialog } from '@/components/Feedback';

export default function TasksClient({ initialTasks }: { initialTasks: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'future' | 'overdue' | 'completed'>('future');

  const handleToggle = async (taskId: string, current: boolean) => {
    await toggleTask(taskId, !current);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    const ok = await confirmDialog('确定要删除这个任务吗？');
    if (!ok) return;
    await deleteTask(taskId);
    toast.success('已删除任务');
    router.refresh();
  };

  const todayStr = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD reliably in local time

  // Helper to categorize tasks
  const categorized = {
    future: [] as any[],
    overdue: [] as any[],
    completed: [] as any[]
  };

  initialTasks.forEach(task => {
    const d = new Date(task.dueDate);
    const taskDateStr = d.toLocaleDateString('en-CA');
    if (task.isCompleted) {
      categorized.completed.push(task);
    } else {
      if (taskDateStr < todayStr) {
        categorized.overdue.push(task);
      } else {
        categorized.future.push(task);
      }
    }
  });

  const groupTasksByDate = (tasks: any[]) => {
    const groups: Record<string, any[]> = {};
    tasks.forEach(task => {
      const date = new Date(task.dueDate);
      const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(task);
    });
    return groups;
  };

  const currentTasks = categorized[activeTab];
  const groupedTasks = groupTasksByDate(currentTasks);
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => activeTab === 'future' ? a.localeCompare(b) : b.localeCompare(a)); // future ascending, overdue/completed descending

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/stats" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">任务中心</h1>
          <p className="text-[12px] font-medium text-slate-400 mt-0.5">管理您的所有规划与代办</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100/80 p-1 rounded-2xl w-full">
        <button 
          onClick={() => setActiveTab('future')} 
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'future' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar className="w-4 h-4" /> 未来任务
        </button>
        <button 
          onClick={() => setActiveTab('overdue')} 
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'overdue' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-red-500' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <AlertCircle className="w-4 h-4" /> 逾期 ({categorized.overdue.length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')} 
          className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeTab === 'completed' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle2 className="w-4 h-4" /> 已完成
        </button>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium text-sm">暂无相关任务</p>
          </div>
        ) : (
          sortedDates.map(dateStr => (
            <div key={dateStr} className="flex flex-col gap-3">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {dateStr}
              </h3>
              <div className="flex flex-col gap-3">
                {groupedTasks[dateStr].map(task => {
                  const d = new Date(task.dueDate);
                  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  const isChecked = task.isCompleted;

                  return (
                    <div key={task.id} className={`bg-white p-4 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border transition-all flex gap-3 ${isChecked ? 'border-emerald-100 bg-emerald-50/30' : activeTab === 'overdue' ? 'border-red-100 bg-red-50/20' : 'border-slate-100'}`}>
                      <button 
                        onClick={() => handleToggle(task.id, isChecked)} 
                        className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all mt-0.5 ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : activeTab === 'overdue' ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {isChecked && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                      </button>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <span className={`text-[15px] font-bold truncate leading-tight ${isChecked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isChecked ? 'bg-slate-100 text-slate-400' : activeTab === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-500'}`}>
                            {timeStr}
                          </span>
                          {task.description && (
                            <span className="text-[12px] text-slate-400 truncate flex-1 font-medium">{task.description.replace(/\n/g, ' ')}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(task.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}


