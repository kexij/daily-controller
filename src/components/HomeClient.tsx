'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toggleTask, updateTaskDetails, deleteTask, toggleHabitCheckIn, resetDemoSandbox } from '@/app/actions';
import { toast, confirmDialog } from '@/components/Feedback';
import AddFAB from '@/components/AddFAB';
import { getTaskSpanInfo, cleanDescription, parseSpanText } from '@/lib/task-utils';

export default function HomeClient({ user, tasks, habits, memos, overdueCount = 0, isDemo }: { user: any, tasks: any[], habits: any[], memos: any[], overdueCount?: number, isDemo?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<'task' | 'idea'>('task');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Task Edit Modal State
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[today.getDay()];
  const todayStr = `${month}月${day}日周${weekDay}`;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const totalTasks = tasks.length;

  const handleSwitchTab = (newTab: 'task' | 'idea') => {
    if (tab === newTab || isAnimating) return;
    setIsAnimating(true);
    setTab(newTab);
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  async function handleSaveTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const originalSpan = selectedTask.span || parseSpanText(null, selectedTask.description).spanText || '当天';
      await updateTaskDetails(
        selectedTask.id,
        formData.get('title') as string,
        (formData.get('description') as string || '').trim(),
        originalSpan
      );
      setSelectedTask(null);
      toast.success('任务已保存');
    } catch (error) {
      console.error(error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTask() {
    if (!(await confirmDialog('确定要删除这个任务吗？'))) return;
    setIsSubmitting(true);
    try {
      await deleteTask(selectedTask.id);
      setSelectedTask(null);
      toast.success('任务已删除');
    } catch (error) {
      console.error(error);
      toast.error('删除失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EAECEF] flex justify-center selection:bg-blue-100 font-sans text-slate-800">
      <div className="w-full max-w-[480px] bg-[#F6F7F9] min-h-screen relative shadow-2xl flex flex-col pb-24 overflow-x-hidden">
      
      {/* Header 问候语 */}
        <div className="px-6 pt-12 pb-6 relative">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 relative w-max">
              {user ? (
                `你好，${user.name || user.username}`
              ) : (
                <>
                  你好，
                  <span
                    onClick={() => router.push('/login')}
                    className="text-blue-600 hover:text-blue-700 cursor-pointer underline decoration-blue-200 underline-offset-4 transition-colors"
                  >
                    请登录
                  </span>
                </>
              )}
              <span className="animate-bounce origin-bottom-right">👋</span>
              {isDemo && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 shadow-sm ml-1">
                  展示样例
                </span>
              )}
            </h1>

            {isDemo && (
              <button
                type="button"
                onClick={async () => {
                  if (await confirmDialog('确定要将预演数据重置为初始状态吗？此操作会清除您在本次免登录体验中新增或修改的内容。')) {
                    await resetDemoSandbox();
                    toast.success('已恢复为初始预演数据');
                    router.refresh();
                  }
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 bg-white/80 hover:bg-white border border-slate-200/80 px-2.5 py-1 rounded-full shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                title="重置预演数据"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重置
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">今天是 {mounted ? todayStr : ''}</p>
        </div>

        {/* 核心切换区：任务 vs 灵感 */}
      <div className="px-5 mb-4">
        <div className="flex justify-between items-center">
          
          <div className="flex bg-slate-200/60 p-0.5 rounded-full shrink-0">
            <button 
              onClick={() => handleSwitchTab('task')} 
              className={`px-3.5 sm:px-4 py-1.5 text-sm sm:text-base rounded-full transition-all whitespace-nowrap ${tab === 'task' ? 'font-bold bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'font-medium text-slate-500 hover:text-slate-700'}`}
            >
              今日任务
            </button>
            <button 
              onClick={() => handleSwitchTab('idea')} 
              className={`px-3.5 sm:px-4 py-1.5 text-sm sm:text-base rounded-full transition-all whitespace-nowrap ${tab === 'idea' ? 'font-bold bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : 'font-medium text-slate-500 hover:text-slate-700'}`}
            >
              近期灵感
            </button>
          </div>
          
          {/* 右侧：上下垂直排列，节省横向空间 */}
          <div className={`transition-opacity duration-300 flex flex-col items-end justify-center shrink-0 gap-1 ${tab === 'task' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            {overdueCount > 0 && (
              <button 
                onClick={() => router.push('/overdue')} 
                className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full border border-red-200/80 transition-all shadow-xs cursor-pointer active:scale-95"
                title="查看逾期任务"
              >
                <svg className="w-3 h-3 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>逾期 {overdueCount}</span>
              </button>
            )}
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200/60 shadow-xs whitespace-nowrap">
              {completedTasks} / {totalTasks} 已完成
            </span>
          </div>
          
          <div className={`transition-opacity duration-300 shrink-0 ${tab === 'idea' ? 'opacity-100' : 'opacity-0 hidden'}`}>
            <button onClick={() => router.push('/memos')} className="flex items-center gap-0.5 text-xs font-bold text-purple-500 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full transition-colors border border-purple-100 cursor-pointer">
              全部灵感
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>

        </div>
      </div>

      {/* 列表容器 */}
      <div className="px-5">
        
        {/* ================= 任务列表视图 ================= */}
        <div className={`flex flex-col gap-3 transition-all duration-300 ${tab === 'task' ? 'block animate-in fade-in slide-in-from-left-4' : 'hidden'}`}>
          {tasks.length === 0 ? (
             <div className="text-center py-10 opacity-60">
               <span className="text-slate-400 text-sm font-medium">今天没有任务，好好休息吧 ✨</span>
             </div>
          ) : (
            tasks.map(task => {
              const taskDate = new Date(task.dueDate);
              const spanInfo = getTaskSpanInfo(task, todayStart);

              // 1. 已完成任务
              if (task.isCompleted) {
                return (
                  <div key={task.id} className="bg-white/60 border border-slate-100 rounded-[20px] p-4 flex items-start gap-3 opacity-60 transition-colors hover:opacity-80">
                    <form action={async () => await toggleTask(task.id, false)} className="mt-0.5 shrink-0">
                      <button type="submit" className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-500 hover:bg-emerald-200 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </button>
                    </form>
                    <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <span className="text-base font-bold text-slate-400 line-through decoration-slate-300">{task.title}</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {taskDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) === '23:59' ? '全天' : `${taskDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 截止`}
                        </span>
                        {spanInfo.isMultiDay && spanInfo.badgeText && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[10px] font-semibold">
                            {spanInfo.badgeText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. 真正逾期任务
              if (spanInfo.isOverdue) {
                return (
                  <div key={task.id} className="bg-[#FFF8F8] border border-red-100 rounded-[20px] p-4 flex items-start gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.03)] hover:border-red-200 transition-colors cursor-pointer">
                    <form action={async () => await toggleTask(task.id, true)} className="mt-0.5 shrink-0">
                      <button type="submit" className="w-5 h-5 rounded-full border-2 border-red-300 flex items-center justify-center bg-white hover:bg-red-50 transition-colors cursor-pointer"></button>
                    </form>
                    <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <span className="text-base font-bold text-slate-800">{task.title}</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-red-500 mt-1.5 bg-red-50 w-fit px-1.5 py-0.5 rounded-md">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        逾期未完成
                        {spanInfo.badgeText && (
                          <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] tracking-wide">{spanInfo.badgeText}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // 3. 跨度多天短期进行中任务（在跨度天数内，如“第 2/3 天”）
              if (spanInfo.isMultiDay) {
                return (
                  <div key={task.id} className="bg-gradient-to-r from-white via-indigo-50/20 to-white border border-indigo-100/90 rounded-[20px] p-4 flex items-start gap-3 shadow-[0_4px_20px_rgba(99,102,241,0.03)] hover:border-indigo-200 transition-all cursor-pointer">
                    <form action={async () => await toggleTask(task.id, true)} className="mt-0.5 shrink-0">
                      <button type="submit" className="w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400 transition-colors cursor-pointer"></button>
                    </form>
                    <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <span className="text-base font-bold text-slate-800">{task.title}</span>
                      <div className="flex items-center gap-2 text-xs font-semibold mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-600 font-bold text-[11px] tracking-tight shadow-xs">
                          <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          {spanInfo.badgeText}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {taskDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) === '23:59' ? '全天' : `${taskDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 截止`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // 4. 当天普通任务
              return (
                <div key={task.id} className="bg-white border border-slate-100/80 rounded-[20px] p-4 flex items-start gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-blue-100 transition-colors cursor-pointer">
                  <form action={async () => await toggleTask(task.id, true)} className="mt-0.5 shrink-0">
                    <button type="submit" className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"></button>
                  </form>
                  <div className="flex flex-col flex-1 cursor-pointer" onClick={() => setSelectedTask(task)}>
                    <span className="text-base font-bold text-slate-800">{task.title}</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-500 mt-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {taskDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) === '23:59' ? '全天' : `${taskDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 截止`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= 灵感列表视图 ================= */}
        <div className={`flex flex-col gap-3 transition-all duration-300 ${tab === 'idea' ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}`}>
          {memos.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <span className="text-slate-400 text-sm font-medium">最近没有记录灵感，去添加一个吧 ✨</span>
            </div>
          ) : (
            memos.map((memo, index) => {
              // Extract tags
              let parsedTags = [];
              try { parsedTags = JSON.parse(memo.tags || "[]"); } catch (e) {}
              
              // Alternate styles for visual variety as per mockup
              const isFirst = index % 3 === 0;
              const memoDate = new Date(memo.createdAt);
              
              return (
                <div key={memo.id} onClick={() => router.push('/memos')} className={`${isFirst ? 'bg-gradient-to-br from-white to-purple-50/30 border-purple-100/50 shadow-[0_4px_20px_rgba(147,51,234,0.03)] hover:border-purple-200' : 'bg-white border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-blue-100'} border rounded-[20px] p-4 flex flex-col gap-2 cursor-pointer transition-colors`}>
                  <p className="text-base font-medium text-slate-700 leading-relaxed line-clamp-3">{memo.content}</p>
                  <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                    {parsedTags.map((tag: string, tIdx: number) => (
                      <span key={tIdx} className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap ${isFirst ? 'text-purple-600 bg-purple-100/80' : tIdx % 2 === 0 ? 'text-orange-600 bg-orange-100/80' : 'text-blue-600 bg-blue-100/80'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isFirst ? 'bg-purple-500' : tIdx % 2 === 0 ? 'bg-orange-500' : 'bg-blue-500'}`}></span> {tag}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400 font-medium ml-auto whitespace-nowrap">
                      {memoDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 习惯打卡 */}
      <div className="px-5 mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">习惯打卡</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pb-4">
          {habits.map(habit => {
            const isCheckedToday = habit.logs && habit.logs.length > 0;
            return (
              <form key={habit.id} action={async () => await toggleHabitCheckIn(habit.id)}>
                <button type="submit" className={`w-full aspect-square rounded-[24px] flex flex-col items-center justify-center p-3 transition-all active:scale-95 cursor-pointer ${isCheckedToday ? 'bg-emerald-50 border border-emerald-100 shadow-sm' : 'bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-slate-200'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm transition-all mb-2 ${isCheckedToday ? 'bg-white' : 'bg-slate-50'}`}>
                    {habit.icon || '✨'}
                  </div>
                  <span className={`text-sm font-bold mb-1 line-clamp-1 ${isCheckedToday ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {habit.title}
                  </span>
                  {isCheckedToday ? (
                     <span className="text-xs text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">🔥 {habit.streak}天</span>
                  ) : (
                     <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">待打卡</span>
                  )}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      {/* 底部悬浮按钮 (FAB) */}
      <div className="fixed bottom-[85px] w-full max-w-[480px] pointer-events-none flex justify-end px-6 z-40">
        <div className="pointer-events-auto">
          <AddFAB customTrigger={
            <button className="w-[56px] h-[56px] bg-[#1D4ED8] hover:bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(29,78,216,0.4)] transition-transform active:scale-90 cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
            </button>
          } />
        </div>
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-slate-100 pb-safe pt-2 px-6 flex justify-around items-center h-[70px] z-30">
        <div className="flex flex-col items-center gap-1 cursor-pointer bg-slate-50 px-5 py-1.5 rounded-[16px] border border-slate-200 shadow-sm">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-xs font-bold text-blue-600">看板</span>
        </div>
        <div onClick={() => router.push('/stats')} className="flex flex-col items-center gap-1 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <span className="text-xs font-bold">复盘</span>
        </div>
      </div>

      {/* Task Edit Modal (reused from TaskListClient) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">任务详情</h3>
              <button type="button" onClick={() => setSelectedTask(null)} className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-95 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-5 flex flex-col gap-5">
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
                  defaultValue={cleanDescription(selectedTask.description)} 
                  placeholder="在这里补充或查看任务的详细内容..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all" 
                />
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3.5 transition-all active:scale-[0.98] cursor-pointer ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'shadow-lg shadow-blue-500/30'}`}>
                  {isSubmitting ? '正在保存...' : '保存更改'}
                </button>
                <button 
                  type="button" 
                  disabled={isSubmitting} 
                  onClick={handleDeleteTask}
                  className="w-full mt-3 bg-white text-red-500 border border-red-100 hover:bg-red-50 font-bold rounded-xl py-3.5 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  删除任务
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}







