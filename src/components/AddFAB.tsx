'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createTask, createMemo, getTags } from '@/app/actions';
import { toast } from '@/components/Feedback';
import CustomDatePicker from './CustomDatePicker';
import CustomTimePicker from './CustomTimePicker';

export default function AddFAB({ customTrigger }: { customTrigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState<'task' | 'idea'>('task');
  
  // Task specific state
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [taskDate, setTaskDate] = useState(todayStr);
  const [taskTime, setTaskTime] = useState('');
  const [taskSpan, setTaskSpan] = useState('当天');
  const [showSpanDropdown, setShowSpanDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  
  // Idea specific state - 动态标签
  const [selectedTags, setSelectedTags] = useState<string[]>(['灵感']);
  const [tags, setTags] = useState<{ id?: string; name: string; color: string }[]>([
    { name: '灵感', color: '#A78BFA' },
    { name: '杂记', color: '#60A5FA' },
    { name: '备忘', color: '#FBBF24' },
    { name: '读书笔记', color: '#34D399' }
  ]);

  const router = useRouter();

  // 当打开弹窗时，实时拉取最新的持久化标签库
  useEffect(() => {
    if (isOpen) {
      getTags()
        .then(dbTags => {
          if (dbTags && dbTags.length > 0) {
            setTags(dbTags);
            setSelectedTags(prev => {
              const valid = prev.filter(p => dbTags.some(t => t.name === p));
              return valid.length > 0 ? valid : [dbTags[0].name];
            });
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const getFreshColor = (c?: string) => {
    if (!c) return '#CBD5E1';
    const legacyMap: Record<string, string> = {
      'purple': '#A78BFA',
      'blue': '#60A5FA',
      'amber': '#FBBF24',
      'green': '#34D399',
      'red': '#F472B6',
      'orange': '#FB923C'
    };
    return legacyMap[c] || c;
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  async function handleTaskSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const description = (formData.get('description') as string || '').trim();
      const span = (formData.get('span') as string) || '当天';
      
      let timeStr = taskTime || "23:59";
      const dueDate = new Date(`${taskDate}T${timeStr}:00`);
      
      const res = await createTask({ title, description, dueDate, span });
      if (res && res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success('任务创建成功');
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleIdeaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const mainContent = formData.get('mainContent') as string;
      const details = formData.get('details') as string;
      
      const fullContent = details ? `${mainContent}\n\n${details}` : mainContent;
      
      const res = await createMemo({ content: fullContent, tags: selectedTags });
      if (res && res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success('灵感保存成功');
      setIsOpen(false);
      e.currentTarget.reset();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {customTrigger ? (
        <div onClick={() => setIsOpen(true)}>{customTrigger}</div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-1/2 translate-x-[9.5rem] sm:translate-x-48 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all z-30"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          
          {/* 统一使用灵感速记的外框风格 */}
          <div className="w-full bg-[#FCFBFA] rounded-[32px] shadow-2xl max-w-[420px] border border-white/50 overflow-hidden flex flex-col relative transition-all duration-300 animate-in zoom-in-95">
            
            {/* 统一的顶部 Switcher */}
            <div className="flex justify-between items-center p-6 pb-5">
              <div className="flex bg-slate-100/60 p-1 rounded-full">
                
                {/* 任务 Tab */}
                <button 
                  onClick={() => setTab('task')} 
                  className={`px-5 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${
                    tab === 'task' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'task' && (
                    <span className="bg-blue-50 p-1 rounded-full">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </span>
                  )}
                  新建任务
                </button>

                {/* 灵感 Tab */}
                <button 
                  onClick={() => setTab('idea')} 
                  className={`px-5 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${
                    tab === 'idea' 
                      ? 'bg-white text-[#F59E0B] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'idea' && (
                    <span className="bg-[#FEF3C7] p-1 rounded-full">
                      <svg className="w-3.5 h-3.5 text-[#D97706]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </span>
                  )}
                  新建灵感
                </button>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="p-2.5 bg-slate-100/50 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Task Form */}
            <div className="relative h-[340px] w-full">
            {tab === 'task' && (
              <form onSubmit={handleTaskSubmit} className="absolute inset-0 px-6 pb-6 flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input name="title" autoFocus type="text" placeholder="你要完成什么任务？" className="w-full bg-white border border-slate-100/80 rounded-[20px] px-5 py-4 text-[15px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset] transition-all" required />
                  </div>
                  
                  <textarea name="description" placeholder="添加详细描述... (可选)" className="w-full bg-white border border-slate-100/80 rounded-[20px] px-5 py-4 text-[13px] font-medium text-slate-700 h-24 resize-none focus:outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset] transition-all placeholder:text-slate-400"></textarea>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* 执行日期 */}
                  <div className="relative">
                    <button type="button" onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-slate-700 text-[12px] font-semibold transition-all shadow-sm">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {taskDate === todayStr ? '今天' : taskDate}
                    </button>
                      {showDatePicker && <CustomDatePicker value={taskDate} onChange={setTaskDate} onClose={() => setShowDatePicker(false)} />}
                  </div>
                  
                  {/* 截止时间 */}
                  <div className="relative">
                    <button type="button" onClick={() => setShowTimePicker(!showTimePicker)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all text-[12px] font-medium ${taskTime ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200/80 text-slate-500 shadow-sm hover:border-slate-300'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {taskTime || '截止时间'}
                    </button>
                      {showTimePicker && <CustomTimePicker value={taskTime} onChange={setTaskTime} onClose={() => setShowTimePicker(false)} />}
                  </div>

                  {/* 任务跨度 */}
                    <div className="ml-auto relative">
                      <input type="hidden" name="span" value={taskSpan} />
                      <button 
                        type="button" 
                        onClick={() => setShowSpanDropdown(!showSpanDropdown)} 
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-blue-50/60 hover:bg-blue-50 border border-blue-100/50 text-blue-600 text-[12px] font-semibold transition-all shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        跨度: {taskSpan}
                        <svg className={`w-3.5 h-3.5 text-blue-400 ml-0.5 transition-transform ${showSpanDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      
                      {showSpanDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSpanDropdown(false)}></div>
                          <div className="absolute right-0 bottom-full mb-2 w-28 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                            {['当天', '2天', '3天', '5天', '1周', '2周', '长期'].map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => { setTaskSpan(option); setShowSpanDropdown(false); }}
                                className={`w-full text-left px-4 py-2 text-[13px] font-bold transition-colors ${taskSpan === option ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full mt-1 bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white font-bold py-3.5 rounded-[18px] transition-all active:scale-95 shadow-lg shadow-blue-500/25 text-sm tracking-wide flex justify-center items-center gap-2 disabled:opacity-70">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  {isSubmitting ? '创建中...' : '创建任务'}
                </button>
              </form>
            )}

            {/* Idea Form - 动态标签选择 */}
            {tab === 'idea' && (
              <form onSubmit={handleIdeaSubmit} className="absolute inset-0 px-6 pb-6 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="relative">
                  <input name="mainContent" autoFocus type="text" placeholder="记下一个闪念、好点子或取件码小记..." className="w-full bg-white border border-slate-100/80 rounded-full pl-5 pr-14 py-3.5 text-[14px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset] transition-all" required />
                  <button type="submit" disabled={isSubmitting} className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[#FDD99B] hover:bg-[#FBCB7B] rounded-full flex items-center justify-center text-white transition-colors cursor-pointer disabled:opacity-50">
                    <svg className="w-4 h-4 -ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  </button>
                </div>
                
                <div className="flex items-start gap-3 mt-1">
                  <div className="flex items-center text-[#94A3B8] font-bold text-[13px] gap-1.5 mt-2 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    <span>标签</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center flex-1 max-h-24 overflow-y-auto pr-1">
                    {tags.map(tag => {
                      const isActive = selectedTags.includes(tag.name);
                      return (
                        <button 
                          key={tag.id || tag.name} 
                          type="button" 
                          onClick={() => toggleTag(tag.name)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            isActive 
                              ? 'bg-[#F59E0B] text-white border border-[#F59E0B] hover:bg-[#EA580C] shadow-sm' 
                              : 'bg-white text-[#475569] border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white opacity-90' : ''}`} style={{ backgroundColor: isActive ? undefined : getFreshColor(tag.color) }}></span>
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <textarea name="details" placeholder="更多细节补充... (可选)" className="w-full bg-white border border-slate-100/80 rounded-[20px] px-5 py-4 text-[13px] font-medium text-slate-700 h-24 resize-none focus:outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.5)_inset] transition-all placeholder:text-slate-400"></textarea>
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full mt-1 bg-gradient-to-br from-[#FDBA74] to-[#F59E0B] hover:opacity-90 text-white font-bold py-3.5 rounded-[18px] transition-all active:scale-95 shadow-lg shadow-orange-500/25 text-sm tracking-wide flex justify-center items-center gap-2 disabled:opacity-70">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  {isSubmitting ? '保存中...' : '保存灵感速记'}
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
