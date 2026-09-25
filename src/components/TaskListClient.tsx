'use client'

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, X, AlertCircle } from 'lucide-react';
import { toggleTask, updateTaskDetails, deleteTask } from '@/app/actions';

export default function TaskListClient({ tasks }: { tasks: any[] }) {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取今天零点，用于判断是否逾期
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await updateTaskDetails(
      selectedTask.id,
      formData.get('title') as string,
      formData.get('description') as string
    );
    setIsSubmitting(false);
    setSelectedTask(null);
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个任务吗？')) return;
    setIsSubmitting(true);
    try {
      await deleteTask(selectedTask.id);
      setSelectedTask(null);
    } catch (error) {
      console.error(error);
      alert('删除失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 bg-white border border-slate-100 border-dashed rounded-2xl">
        <span className="text-slate-400 text-sm font-medium">今天没有任务，好好休息吧 ✨</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map(task => {
          const taskDate = new Date(task.dueDate);
          const isOverdue = taskDate < todayStart && !task.isCompleted;

          return (
            <div key={task.id} className={`flex items-center p-4 bg-white rounded-2xl shadow-sm border transition-all ${task.isCompleted ? 'opacity-60 border-slate-100' : isOverdue ? 'border-red-100 bg-red-50/30' : 'border-slate-100 hover:border-blue-100 hover:shadow-md'}`}>
              
              <form action={async () => {
                await toggleTask(task.id, !task.isCompleted);
              }}>
                <button type="submit" className="mr-4 flex-shrink-0 cursor-pointer rounded-full focus:outline-none hover:scale-110 transition-transform" title={task.isCompleted ? "标为未完成" : "标为完成"}>
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : isOverdue ? (
                    <Circle className="w-6 h-6 text-red-200 hover:text-red-400 transition-colors" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-200 hover:text-blue-400 transition-colors" />
                  )}
                </button>
              </form>
              
              <button 
                type="button" 
                onClick={() => setSelectedTask(task)}
                className="flex-1 text-left cursor-pointer group focus:outline-none"
              >
                <h3 className={`text-sm font-bold ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600 transition-colors'}`}>
                  {task.title}
                </h3>
                <div className={`flex items-center text-xs mt-1 font-semibold ${task.isCompleted ? 'text-slate-400' : isOverdue ? 'text-red-500' : 'text-blue-500'}`}>
                  {isOverdue ? (
                    <><AlertCircle className="w-3 h-3 mr-1" />逾期未完成</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" />{taskDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 截止</>
                  )}
                </div>
              </button>
              
            </div>
          )
        })}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">任务详情</h3>
              <button type="button" onClick={() => setSelectedTask(null)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">任务名称</label>
                <input 
                  name="title" 
                  defaultValue={selectedTask.title} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">详细备注</label>
                <textarea 
                  name="description" 
                  defaultValue={selectedTask.description || ''} 
                  placeholder="在这里补充或查看任务的详细内容..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" 
                />
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3.5 transition-all active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'shadow-lg shadow-blue-500/30'}`}>
                  {isSubmitting ? '正在保存...' : '保存更改'}
                </button>
                <button 
                  type="button" 
                  disabled={isSubmitting} 
                  onClick={handleDelete}
                  className="w-full mt-3 bg-white text-red-500 border border-red-100 hover:bg-red-50 font-bold rounded-xl py-3.5 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  删除任务
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
