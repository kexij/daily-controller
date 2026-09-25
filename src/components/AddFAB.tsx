'use client'

import React, { useState } from 'react';
import { Plus, X, CheckSquare, Sparkles } from 'lucide-react';
import { createTask, createHabit } from '@/app/actions';

export default function AddFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'task' | 'habit'>('task');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const formData = new FormData(e.currentTarget);
        
        if (tab === 'task') {
          const dateStr = formData.get('date') as string;
          const timeStr = formData.get('time') as string;
          const dueDate = new Date(`${dateStr}T${timeStr}:00`);
          
          await createTask({
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            dueDate
          });
          alert('任务创建成功！');
        } else {
          await createHabit({
            title: formData.get('title') as string,
            icon: (formData.get('icon') as string) || '✨'
          });
          alert('习惯创建成功！');
        }
        
        setIsOpen(false);
      } catch (error) {
        console.error(error);
        alert('创建失败，请重试');
      } finally {
        setIsSubmitting(false);
      }
    }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-1/2 translate-x-[9.5rem] sm:translate-x-48 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">新建</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-95">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex p-4 pb-0 gap-2">
              <button 
                onClick={() => setTab('task')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'task' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <CheckSquare className="w-4 h-4 mr-1.5" />
                临时任务
              </button>
              <button 
                onClick={() => setTab('habit')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'habit' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                习惯养成
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {tab === 'task' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">任务名称</label>
                    <input name="title" autoFocus placeholder="例如：下午3点开会" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" required />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">执行日期</label>
                      <input name="date" type="date" defaultValue={todayStr} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">截止时间</label>
                      <input name="time" type="time" defaultValue="18:00" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">详细备注 (可选)</label>
                    <textarea name="description" placeholder="更多细节..." className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">习惯名称</label>
                    <input name="title" autoFocus placeholder="例如：每天喝水 8杯" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Emoji 图标</label>
                    <input name="icon" defaultValue="✨" maxLength={2} className="w-16 text-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all" />
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-xs text-emerald-700 font-medium leading-relaxed">
                    习惯建立后，每天打卡可以积累连胜天数（Streak）。如果不打卡连胜会被中断哦！
                  </div>
                </>
              )}
              
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold rounded-xl py-3.5 transition-all active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed bg-slate-400' : (tab === 'task' ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30')}`}>
                  {isSubmitting ? '正在创建...' : '立即创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
